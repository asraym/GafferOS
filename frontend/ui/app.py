import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

import streamlit as st
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from core.schemas import (
    MatchAnalysisRequest, DataTier,
    Tier1Input, Tier2Input,
    MatchResult, Player,
    BroadPosition, SpecificPosition, POSITION_MAP
)
from pipeline import TactIQPipeline

# ── Page Config ────────────────────────────────────────────────
st.set_page_config(
    page_title="GafferOS",
    page_icon="⚽",
    layout="wide"
)

@st.cache_resource
def load_pipeline():
    return TactIQPipeline()

pipeline = load_pipeline()

st.title("⚽ GafferOS")
st.caption("AI-assisted tactical decision support for grassroots football")
st.divider()

# ── Sidebar ────────────────────────────────────────────────────
with st.sidebar:
    st.header("⚙️ Settings")
    tier_choice = st.radio(
        "Data availability",
        ["Tier 1 — Basic", "Tier 2 — Full Stats"],
    )
    tier = DataTier.TIER_1 if "Tier 1" in tier_choice else DataTier.TIER_2

# ── Input Form ─────────────────────────────────────────────────
col1, col2 = st.columns(2)

with col1:
    st.subheader("🏠 Your Team")
    team_name = st.text_input("Team name", value="GafferOS FC")
    st.markdown("**Last 5 results (oldest → newest)**")
    result_cols = st.columns(5)
    result_defaults = ["W", "D", "W", "L", "W"]
    results_input = []
    for i, col in enumerate(result_cols):
        with col:
            idx = ["W", "D", "L"].index(result_defaults[i])
            results_input.append(st.selectbox(
                f"M{i+1}", ["W", "D", "L"], index=idx, key=f"result_{i}"
            ))
    goals_scored = st.number_input("Goals scored (last 5)", min_value=0, value=9)
    goals_conceded = st.number_input("Goals conceded (last 5)", min_value=0, value=5)

with col2:
    st.subheader("👥 Opponent")
    opponent_name = st.text_input("Opponent name", value="Riverside United")
    st.markdown("**Opponent last 5 results**")
    opp_cols = st.columns(5)
    opp_defaults = ["L", "W", "D", "L", "D"]
    opp_results = []
    for i, col in enumerate(opp_cols):
        with col:
            idx = ["W", "D", "L"].index(opp_defaults[i])
            opp_results.append(st.selectbox(
                f"M{i+1}", ["W", "D", "L"], index=idx, key=f"opp_result_{i}"
            ))
    opp_goals_scored = st.number_input("Opponent goals scored (last 5)", min_value=0, value=5)
    opp_goals_conceded = st.number_input("Opponent goals conceded (last 5)", min_value=0, value=8)

# ── Players ────────────────────────────────────────────────────
st.divider()
st.subheader("👤 Squad")
st.caption("Add your full squad — system will auto-select the best XI")

SPECIFIC_OPTIONS = {
    "GK":  ["GK"],
    "DEF": ["CB", "RB", "LB", "RWB", "LWB"],
    "MID": ["CDM", "CM", "CAM", "RM", "LM"],
    "FWD": ["RW", "LW", "ST", "CF", "SS"],
}

num_players = st.number_input("Number of players", min_value=0, max_value=25, value=14)
players = []

if num_players > 0:
    for i in range(num_players):
        c1, c2, c3, c4, c5, c6 = st.columns(6)
        with c1:
            name = st.text_input("Name", key=f"name_{i}", value=f"Player {i+1}")
        with c2:
            broad = st.selectbox("Group", ["GK", "DEF", "MID", "FWD"], key=f"broad_{i}")
        with c3:
            specific_options = SPECIFIC_OPTIONS[broad]
            specific = st.selectbox("Position", specific_options, key=f"specific_{i}")
        with c4:
            all_positions = ["None"] + [
                p for opts in SPECIFIC_OPTIONS.values()
                for p in opts if p != specific
            ]
            secondary_raw = st.selectbox("2nd Pos", all_positions, key=f"secondary_{i}")
            secondary = None if secondary_raw == "None" else secondary_raw
        with c5:
            available = st.checkbox("Avail", key=f"avail_{i}", value=True)
        with c6:
            fitness = st.slider("Fitness", 0.0, 1.0, 0.85, key=f"fit_{i}")

        players.append(Player(
            name=name,
            position=BroadPosition(broad),
            specific_position=SpecificPosition(specific),
            secondary_position=SpecificPosition(secondary) if secondary else None,
            available=available,
            fitness_score=fitness
        ))

# ── Tier 2 Stats ───────────────────────────────────────────────
avg_possession = avg_passing = avg_shots = avg_sot = avg_errors = None
opp_possession = opp_passing = opp_shots = opp_errors = None

if tier == DataTier.TIER_2:
    st.divider()
    st.subheader("📊 Match Statistics")
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Your Team**")
        avg_possession = st.slider("Possession %", 30.0, 70.0, 54.0)
        avg_passing    = st.slider("Passing accuracy %", 50.0, 95.0, 79.5)
        avg_shots      = st.slider("Shots per match", 0.0, 30.0, 13.4)
        avg_sot        = st.slider("Shots on target", 0.0, 15.0, 5.8)
        avg_errors     = st.slider("Defensive errors", 0.0, 5.0, 1.2)
    with c2:
        st.markdown("**Opponent**")
        opp_possession = st.slider("Opp possession %", 30.0, 70.0, 46.0)
        opp_passing    = st.slider("Opp passing accuracy %", 50.0, 95.0, 70.0)
        opp_shots      = st.slider("Opp shots per match", 0.0, 30.0, 9.6)
        opp_errors     = st.slider("Opp defensive errors", 0.0, 5.0, 2.4)

# ── Analyse Button ─────────────────────────────────────────────
st.divider()
analyse_clicked = st.button("🔍 Analyse Match", type="primary", use_container_width=True)

if analyse_clicked:
    with st.spinner("Analysing..."):
        try:
            base = dict(
                team_name=team_name,
                opponent_name=opponent_name,
                last_5_results=[MatchResult(r) for r in results_input],
                goals_scored_last_5=goals_scored,
                goals_conceded_last_5=goals_conceded,
                players=players,
                opponent_last_5_results=[MatchResult(r) for r in opp_results],
                opponent_goals_scored=opp_goals_scored,
                opponent_goals_conceded=opp_goals_conceded,
            )

            if tier == DataTier.TIER_1:
                request = MatchAnalysisRequest(
                    tier=DataTier.TIER_1,
                    tier1_data=Tier1Input(**base)
                )
            else:
                request = MatchAnalysisRequest(
                    tier=DataTier.TIER_2,
                    tier2_data=Tier2Input(
                        **base,
                        avg_possession=avg_possession,
                        avg_passing_accuracy=avg_passing,
                        avg_shots_per_match=avg_shots,
                        avg_shots_on_target=avg_sot,
                        avg_defensive_errors=avg_errors,
                        opp_avg_possession=opp_possession,
                        opp_avg_passing_accuracy=opp_passing,
                        opp_avg_shots_per_match=opp_shots,
                        opp_avg_defensive_errors=opp_errors,
                    )
                )

            result = pipeline.run(request)
            st.session_state["result"] = result
            st.session_state["players"] = players
            st.session_state["current_xi"] = list(result.starting_xi)

        except Exception as e:
            import traceback
            st.error(f"Error: {str(e)}")
            st.code(traceback.format_exc())

# ── Results ────────────────────────────────────────────────────
if "result" in st.session_state:
    result = st.session_state["result"]
    current_xi = st.session_state.get("current_xi", result.starting_xi)
    bench = result.bench

    st.success("Analysis complete!")
    st.divider()

    tab1, tab2 = st.tabs(["📋 Report", "⚽ Formation"])

    # ── Tab 1: Report ──────────────────────────────────────────
    with tab1:
        r1, r2, r3, r4 = st.columns(4)
        r1.metric("Formation",       result.recommended_formation)
        r2.metric("Press Intensity", result.press_intensity)
        r3.metric("Defensive Line",  result.defensive_line)
        r4.metric("Match Risk",      result.match_risk_level)

        st.markdown(f"### 🎯 {result.tactical_focus}")

        if result.rotation_suggestions:
            st.divider()
            st.subheader("🔄 Rotation Suggestions")
            for s in result.rotation_suggestions:
                st.info(s)

        st.divider()
        st.subheader("💬 Reasoning")
        st.write(result.reasoning)

        with st.expander("🔬 Internal Metrics"):
            m1, m2, m3, m4 = st.columns(4)
            m1.metric("Offensive Strength",      f"{result.offensive_strength_index:.2f}")
            m2.metric("Defensive Vulnerability", f"{result.defensive_vulnerability_index:.2f}")
            m3.metric("Fatigue Risk",            f"{result.fatigue_risk_score:.2f}")
            m4.metric("Tactical Stability",      f"{result.tactical_stability_score:.2f}")

    # ── Tab 2: Formation ───────────────────────────────────────
    with tab2:
        st.subheader(f"⚽ {result.recommended_formation} — Auto-Selected XI")

        # ── Build rows from current_xi ─────────────────────────
        formation_str = result.recommended_formation
        try:
            lines = [int(x) for x in formation_str.split("-")]
        except:
            lines = [4, 3, 3]

        gks  = [p for p in current_xi if p.get("position") == "GK"]
        defs = [p for p in current_xi if p.get("position") == "DEF"]
        mids = [p for p in current_xi if p.get("position") == "MID"]
        fwds = [p for p in current_xi if p.get("position") == "FWD"]

        position_pools = [defs, mids, fwds]
        rows = [gks[:1] if gks else [None]]
        for i, count in enumerate(lines):
            pool = position_pools[i] if i < len(position_pools) else []
            row = [pool[j] if j < len(pool) else None for j in range(count)]
            rows.append(row)

        # ── Draw Pitch ─────────────────────────────────────────
        fig, ax = plt.subplots(figsize=(8, 11))
        fig.patch.set_facecolor("#2d5a27")
        ax.set_facecolor("#2d5a27")

        pitch_width, pitch_height = 100, 130

        ax.add_patch(patches.Rectangle(
            (5, 5), pitch_width - 10, pitch_height - 10,
            linewidth=2, edgecolor="white", facecolor="none"
        ))
        ax.plot([5, pitch_width - 5], [pitch_height / 2, pitch_height / 2],
                color="white", linewidth=1.5)
        ax.add_patch(plt.Circle((pitch_width / 2, pitch_height / 2), 10,
                color="white", fill=False, linewidth=1.5))
        ax.plot(pitch_width / 2, pitch_height / 2, "o", color="white", markersize=3)
        ax.add_patch(patches.Rectangle((27, 5), 46, 18,
                linewidth=1.5, edgecolor="white", facecolor="none"))
        ax.add_patch(patches.Rectangle((27, pitch_height - 23), 46, 18,
                linewidth=1.5, edgecolor="white", facecolor="none"))
        ax.add_patch(patches.Rectangle((38, 5), 24, 8,
                linewidth=1, edgecolor="white", facecolor="none"))
        ax.add_patch(patches.Rectangle((38, pitch_height - 13), 24, 8,
                linewidth=1, edgecolor="white", facecolor="none"))

        num_rows = len(rows)
        y_positions = [
            15 + (i * (pitch_height - 30) / max(num_rows - 1, 1))
            for i in range(num_rows)
        ]

        for row_idx, row in enumerate(rows):
            y = y_positions[row_idx]
            for col_idx, player in enumerate(row):
                x = (pitch_width / (len(row) + 1)) * (col_idx + 1)
                fitness = player.get("fitness_score") or 0 if player else 0
                color = "#1a3a8f" if fitness >= 0.65 else "#8b0000"

                ax.add_patch(plt.Circle((x, y), 4.5, color=color, zorder=3))
                ax.add_patch(plt.Circle((x, y), 4.5, color="white",
                             fill=False, linewidth=1.5, zorder=4))

                if player:
                    short_name   = (player.get("name") or "?").split()[-1]
                    specific_pos = player.get("specific_position") or ""
                    fitness_pct  = f"{int((player.get('fitness_score') or 0) * 100)}%"
                    ax.text(x, y + 0.5, short_name, ha="center", va="center",
                            fontsize=5.5, color="white", fontweight="bold", zorder=5)
                    ax.text(x, y - 1.8, specific_pos, ha="center", va="center",
                            fontsize=4.5, color="#ffdd88", zorder=5)
                    ax.text(x, y - 3.5, fitness_pct, ha="center", va="center",
                            fontsize=4.0, color="#aaffaa", zorder=5)
                else:
                    ax.text(x, y, "?", ha="center", va="center",
                            fontsize=8, color="white", zorder=5)

        ax.plot([], [], "o", color="#1a3a8f", label="Fit (≥65%)", markersize=8)
        ax.plot([], [], "o", color="#8b0000", label="Fatigue risk (<65%)", markersize=8)
        ax.legend(loc="lower center", fontsize=7, facecolor="#1a1a1a",
                  labelcolor="white", framealpha=0.8, ncol=2)
        ax.text(pitch_width / 2, pitch_height - 2,
                f"{result.team_name}  ·  {formation_str}",
                ha="center", va="top", fontsize=9, color="white", fontweight="bold")
        ax.set_xlim(0, pitch_width)
        ax.set_ylim(0, pitch_height)
        ax.axis("off")
        st.pyplot(fig)
        st.caption("🔵 Fit  🔴 Fatigue risk  · position in yellow · % is fitness")

        # ── Swap Panel ─────────────────────────────────────────
        st.divider()
        st.subheader("🔄 Swap Players")
        st.caption("Override the auto-selection for any slot")

        all_available = [p for p in st.session_state["players"] if p.available]
        all_names = [p.name for p in all_available]
        row_labels = ["GK"] + [f"Line {i+1}" for i in range(len(lines))]
        updated_xi = []

        for row_idx, row in enumerate(rows):
            cols = st.columns(len(row))
            for col_idx, player in enumerate(row):
                with cols[col_idx]:
                    current_name = player.get("name", "Empty") if player else "Empty"
                    options = ["Empty"] + all_names
                    current_idx = options.index(current_name) if current_name in options else 0
                    selected_name = st.selectbox(
                        f"{row_labels[row_idx]} {col_idx + 1}",
                        options,
                        index=current_idx,
                        key=f"swap_{row_idx}_{col_idx}"
                    )
                    if selected_name != "Empty":
                        matched = next(
                            (p for p in all_available if p.name == selected_name), None
                        )
                        updated_xi.append(matched.dict() if matched else None)
                    else:
                        updated_xi.append(None)

        if st.button("✅ Apply Changes", use_container_width=True):
            st.session_state["current_xi"] = [p for p in updated_xi if p]
            st.rerun()

        # ── Bench ──────────────────────────────────────────────
        st.divider()
        st.subheader("🪑 Bench")

        if bench:
            bench_cols = st.columns(min(len(bench), 5))
            for i, p in enumerate(bench):
                with bench_cols[i % 5]:
                    fitness = p.get("fitness_score") or 0
                    icon = "🟢" if fitness >= 0.65 else "🔴"
                    st.markdown(f"**{p.get('name')}**  \n{icon} {p.get('specific_position')} · {int(fitness * 100)}%")
        else:
            st.caption("No bench players available.")