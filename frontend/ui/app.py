import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

import streamlit as st
from core.schemas import (
    MatchAnalysisRequest, DataTier,
    Tier1Input, Tier2Input,
    MatchResult, Player
)
from pipeline import TactIQPipeline

# ── Page Config ────────────────────────────────────────────────
st.set_page_config(
    page_title="GafferOS",
    page_icon="⚽",
    layout="wide"
)

# ── Load Pipeline ──────────────────────────────────────────────
@st.cache_resource
def load_pipeline():
    return TactIQPipeline()

pipeline = load_pipeline()

# ── Header ─────────────────────────────────────────────────────
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
    results_input = st.multiselect(
        "Last 5 results (oldest → newest)",
        options=["W", "D", "L"],
        default=["W", "D", "W", "L", "W"],
        max_selections=5,
    )
    goals_scored = st.number_input("Goals scored (last 5)", min_value=0, value=9)
    goals_conceded = st.number_input("Goals conceded (last 5)", min_value=0, value=5)

with col2:
    st.subheader("👥 Opponent")
    opponent_name = st.text_input("Opponent name", value="Riverside United")
    opp_results = st.multiselect(
        "Opponent last 5 results",
        options=["W", "D", "L"],
        default=["L", "W", "D", "L", "D"],
        max_selections=5,
    )
    opp_goals_scored = st.number_input("Opponent goals scored (last 5)", min_value=0, value=5)
    opp_goals_conceded = st.number_input("Opponent goals conceded (last 5)", min_value=0, value=8)

# ── Players ────────────────────────────────────────────────────
st.divider()
st.subheader("👤 Player Availability")
st.caption("Add players to get rotation suggestions")

num_players = st.number_input("Number of players to add", min_value=0, max_value=20, value=3)
players = []

if num_players > 0:
    for i in range(num_players):
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            name = st.text_input(f"Name", key=f"name_{i}", value=f"Player {i+1}")
        with c2:
            position = st.selectbox(f"Position", ["GK", "DEF", "MID", "FWD"], key=f"pos_{i}")
        with c3:
            available = st.checkbox(f"Available", key=f"avail_{i}", value=True)
        with c4:
            fitness = st.slider(f"Fitness", 0.0, 1.0, 0.85, key=f"fit_{i}")
        players.append(Player(
            name=name,
            position=position,
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
        avg_passing = st.slider("Passing accuracy %", 50.0, 95.0, 79.5)
        avg_shots = st.slider("Shots per match", 0.0, 30.0, 13.4)
        avg_sot = st.slider("Shots on target", 0.0, 15.0, 5.8)
        avg_errors = st.slider("Defensive errors", 0.0, 5.0, 1.2)
    with c2:
        st.markdown("**Opponent**")
        opp_possession = st.slider("Opp possession %", 30.0, 70.0, 46.0)
        opp_passing = st.slider("Opp passing accuracy %", 50.0, 95.0, 70.0)
        opp_shots = st.slider("Opp shots per match", 0.0, 30.0, 9.6)
        opp_errors = st.slider("Opp defensive errors", 0.0, 5.0, 2.4)

# ── Analyse Button ─────────────────────────────────────────────
st.divider()
if st.button("🔍 Analyse Match", type="primary", use_container_width=True):
    if len(results_input) < 1:
        st.error("Please enter at least 1 result.")
    else:
        with st.spinner("Analysing..."):
            try:
                base = dict(
                    team_name=team_name,
                    opponent_name=opponent_name,
                    last_5_results=[MatchResult(r) for r in results_input],
                    goals_scored_last_5=goals_scored,
                    goals_conceded_last_5=goals_conceded,
                    players=players,
                    opponent_last_5_results=[MatchResult(r) for r in opp_results] if opp_results else None,
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

                # ── Results ────────────────────────────────────
                st.success("Analysis complete!")
                st.divider()

                r1, r2, r3, r4 = st.columns(4)
                r1.metric("Formation", result.recommended_formation)
                r2.metric("Press Intensity", result.press_intensity)
                r3.metric("Defensive Line", result.defensive_line)
                r4.metric("Match Risk", result.match_risk_level)

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
                    m1.metric("Offensive Strength", f"{result.offensive_strength_index:.2f}")
                    m2.metric("Defensive Vulnerability", f"{result.defensive_vulnerability_index:.2f}")
                    m3.metric("Fatigue Risk", f"{result.fatigue_risk_score:.2f}")
                    m4.metric("Tactical Stability", f"{result.tactical_stability_score:.2f}")

            except Exception as e:
                st.error(f"Error: {str(e)}")