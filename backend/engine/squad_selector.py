"""
squad_selector.py — Auto-selects the best possible starting XI
based on formation, player fitness, impact score, and match risk.

Selection score:
  High risk:   PIS × 0.70 + fitness × 0.30
  Medium risk: PIS × 0.50 + fitness × 0.50
  Low risk:    PIS × 0.30 + fitness × 0.70
  No stats:    fitness only
"""

BROAD_TO_SPECIFIC = {
    "GK":  ["GK"],
    "DEF": ["CB", "RB", "LB", "RWB", "LWB"],
    "MID": ["CDM", "CM", "CAM", "RM", "LM"],
    "FWD": ["RW", "LW", "ST", "CF", "SS"],
}

FORMATION_SLOTS = {
    "4-3-3":   {"GK": 1, "DEF": 4, "MID": 3, "FWD": 3},
    "4-2-3-1": {"GK": 1, "DEF": 4, "MID": 5, "FWD": 1},
    "4-4-2":   {"GK": 1, "DEF": 4, "MID": 4, "FWD": 2},
    "4-5-1":   {"GK": 1, "DEF": 4, "MID": 5, "FWD": 1},
    "5-4-1":   {"GK": 1, "DEF": 5, "MID": 4, "FWD": 1},
}

# ── Position group mapping ─────────────────────────────────────
def _position_group(specific: str) -> str:
    if specific == "GK":
        return "GK"
    if specific == "CB":
        return "CB"
    if specific in ("RB", "LB", "RWB", "LWB"):
        return "Fullback"
    if specific == "CDM":
        return "CDM"
    if specific == "CM":
        return "CM"
    if specific == "CAM":
        return "CAM"
    if specific in ("RW", "LW", "RM", "LM"):
        return "Wide"
    if specific in ("ST", "CF", "SS"):
        return "FWD"
    return "Unknown"


# ── PIS Calculator ─────────────────────────────────────────────
def _calculate_pis(player: dict) -> float | None:
    """
    Calculate Player Impact Score (0.0-1.0) from stats.
    Returns None if no stats or matches_played is 0.
    """
    stats = player.get("stats")
    if not stats:
        return None

    mp = stats.get("matches_played", 0)
    if not mp or mp == 0:
        return None

    group = _position_group(player.get("specific_position", ""))

    def per(key):
        return stats.get(key, 0) / mp

    def cap(val):
        return min(val, 1.0)

    if group == "GK":
        return cap(
            cap(per("saves") / 5) * 0.6 +
            cap(per("clean_sheets") / 0.5) * 0.4
        )

    if group == "CB":
        return cap(
            cap(per("tackles") / 5) * 0.40 +
            cap(per("interceptions") / 3) * 0.35 +
            cap(per("blocks") / 2) * 0.25
        )

    if group == "Fullback":
        return cap(
            cap(per("tackles") / 4) * 0.30 +
            cap(per("interceptions") / 3) * 0.30 +
            cap(per("crosses") / 4) * 0.20 +
            cap(per("assists") / 0.5) * 0.20
        )

    if group == "CDM":
        return cap(
            cap(per("tackles") / 5) * 0.45 +
            cap(per("interceptions") / 3) * 0.35 +
            cap(per("key_passes") / 2) * 0.20
        )

    if group == "CM":
        return cap(
            cap(per("key_passes") / 3) * 0.40 +
            cap(per("assists") / 0.5) * 0.35 +
            cap(per("goals") / 0.3) * 0.25
        )

    if group == "CAM":
        return cap(
            cap(per("key_passes") / 4) * 0.35 +
            cap(per("chances_created") / 3) * 0.35 +
            cap(per("assists") / 0.5) * 0.30
        )

    if group == "Wide":
        return cap(
            cap(per("goals") / 0.5) * 0.30 +
            cap(per("assists") / 0.5) * 0.30 +
            cap(per("crosses") / 4) * 0.20 +
            cap(per("dribbles") / 3) * 0.20
        )

    if group == "FWD":
        return cap(
            cap(per("goals") / 0.6) * 0.65 +
            cap(per("assists") / 0.4) * 0.35
        )

    return None


# ── Selection Score ────────────────────────────────────────────
def _selection_score(player: dict, match_risk: str) -> float:
    fitness = player.get("fitness_score") or 0.0
    pis = _calculate_pis(player)

    if pis is None:
        return fitness

    weights = {
        "High":   (0.70, 0.30),
        "Medium": (0.50, 0.50),
        "Low":    (0.30, 0.70),
    }
    pis_w, fit_w = weights.get(match_risk, (0.50, 0.50))
    return round(pis_w * pis + fit_w * fitness, 4)


# ── Squad Selector ─────────────────────────────────────────────
class SquadSelector:

    def select(self, data: dict) -> dict:
        players = data.get("players", [])
        formation = data.get("recommended_formation", "4-3-3")
        match_risk = data.get("match_risk_level", "Medium")

        if not players:
            data["starting_xi"] = []
            data["bench"] = []
            return data

        # Normalise player dicts (handle Pydantic models)
        player_dicts = []
        for p in players:
            if hasattr(p, "dict"):
                d = p.dict()
            else:
                d = dict(p)
            for key, val in d.items():
                if hasattr(val, "value"):
                    d[key] = val.value
            # Attach computed selection score
            d["_selection_score"] = _selection_score(d, match_risk)
            d["_pis"] = _calculate_pis(d)
            player_dicts.append(d)

        slots = FORMATION_SLOTS.get(formation, {"GK": 1, "DEF": 4, "MID": 3, "FWD": 3})
        available = [p for p in player_dicts if p.get("available", True)]

        starting_xi, used_names = self._fill_xi(available, slots)
        bench = [p for p in available if p.get("name") not in used_names]

        data["starting_xi"] = starting_xi
        data["bench"] = bench
        return data

    def _fill_xi(self, available: list, slots: dict):
        starting_xi = []
        used_names = set()
        for broad, count in slots.items():
            selected = self._pick_for_position(available, broad, count, used_names)
            for p in selected:
                p_copy = dict(p)
                p_copy["slot_broad"] = broad
                starting_xi.append(p_copy)
                used_names.add(p.get("name"))
        return starting_xi, used_names

    def _pick_for_position(self, available: list, broad: str, count: int, used_names: set) -> list:
        candidates = []

        # Pass 1 — primary position match
        for p in available:
            if p.get("name") in used_names:
                continue
            if p.get("position") == broad:
                candidates.append(p)

        # Pass 2 — secondary position match
        if len(candidates) < count:
            specific_options = BROAD_TO_SPECIFIC.get(broad, [])
            for p in available:
                if p.get("name") in used_names or p in candidates:
                    continue
                if p.get("secondary_position") in specific_options:
                    candidates.append(p)

        # Pass 3 — any available player as last resort
        if len(candidates) < count:
            for p in available:
                if p.get("name") in used_names or p in candidates:
                    continue
                candidates.append(p)

        # Sort by selection score descending
        candidates.sort(key=lambda p: p.get("_selection_score", 0.0), reverse=True)
        return candidates[:count]