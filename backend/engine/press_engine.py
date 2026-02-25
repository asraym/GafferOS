class PressEngine:

    def recommend(self, data: dict) -> dict:
        intensity = self._press_intensity(data)
        risk = self._match_risk(data)

        return {
            **data,
            "press_intensity": intensity,
            "match_risk_level": risk,
        }

    # ── Press Intensity ────────────────────────────────────────
    def _press_intensity(self, d: dict) -> str:
        fatigue = d["fatigue_risk_score"]
        opp = d["opponent_strength_index"]
        form = d["form_score"]

        # Never press hard if squad is tired
        if fatigue > 0.65:
            return "Low"

        # High press only if fit + good form + manageable opponent
        if fatigue < 0.35 and form > 0.55 and opp < 0.6:
            return "High"

        # Strong opponent — stay compact
        if opp > 0.65:
            return "Low"

        return "Medium"

    # ── Match Risk ─────────────────────────────────────────────
    def _match_risk(self, d: dict) -> str:
        opp = d["opponent_strength_index"]
        dvi = d["defensive_vulnerability_index"]
        fatigue = d["fatigue_risk_score"]
        form = d["form_score"]

        score = (
            opp     * 0.4 +
            dvi     * 0.3 +
            fatigue * 0.2 +
            (1 - form) * 0.1
        )

        if score > 0.6:
            return "High"
        elif score > 0.35:
            return "Medium"
        return "Low"