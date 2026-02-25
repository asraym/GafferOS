class FormationSelector:

    def select(self, data: dict) -> dict:
        formation = self._pick_formation(data)
        line_height = self._pick_line_height(data)
        tactical_focus = self._pick_tactical_focus(data)

        return {
            **data,
            "recommended_formation": formation,
            "defensive_line": line_height,
            "tactical_focus": tactical_focus,
        }

    # ── Formation ──────────────────────────────────────────────
    def _pick_formation(self, d: dict) -> str:
        osi = d["offensive_strength_index"]
        dvi = d["defensive_vulnerability_index"]
        opp = d["opponent_strength_index"]
        fatigue = d["fatigue_risk_score"]

        # High vulnerability + strong opponent → defensive
        if dvi > 0.65 and opp > 0.6:
            return "5-4-1"

        # High fatigue + moderate opponent → compact
        if fatigue > 0.6 and opp > 0.45:
            return "4-5-1"

        # Strong attack + weak opponent → aggressive
        if osi > 0.65 and opp < 0.4:
            return "4-3-3"

        # Solid defence + decent attack → possession
        if dvi < 0.4 and osi > 0.45:
            return "4-2-3-1"

        # Transition-heavy style
        if d["transition_intensity_score"] > 0.6:
            return "4-4-2"

        # Default
        return "4-3-3"

    # ── Defensive Line ─────────────────────────────────────────
    def _pick_line_height(self, d: dict) -> str:
        dvi = d["defensive_vulnerability_index"]
        opp = d["opponent_strength_index"]
        fatigue = d["fatigue_risk_score"]
        osi = d["offensive_strength_index"]

        if dvi > 0.6 or opp > 0.65:
            return "Deep"
        if fatigue > 0.55:
            return "Medium"
        if osi > 0.6 and opp < 0.45:
            return "High"
        return "Medium"

    # ── Tactical Focus ─────────────────────────────────────────
    def _pick_tactical_focus(self, d: dict) -> str:
        osi = d["offensive_strength_index"]
        dvi = d["defensive_vulnerability_index"]
        opp = d["opponent_strength_index"]
        ti = d["transition_intensity_score"]
        form = d["form_score"]
        momentum = d.get("momentum", "Stable")

        if dvi > 0.6 and opp > 0.55:
            return "Defensive Solidity"
        if ti > 0.6 and form > 0.6:
            return "Counter-Attacking"
        if osi > 0.6 and opp < 0.45:
            return "High Press & Dominate"
        if momentum == "Rising" and osi > 0.5:
            return "Wide Attacking Play"
        if dvi < 0.35 and osi > 0.5:
            return "Possession & Build-Up"
        return "Balanced Mid-Block"