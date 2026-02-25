class MismatchDetector:

    def detect(self, data: dict) -> dict:
        advantages = self._find_advantages(data)
        threats = self._find_threats(data)

        return {
            **data,
            "advantages": advantages,
            "threats": threats,
        }

    # ── Advantages ─────────────────────────────────────────────
    def _find_advantages(self, d: dict) -> list:
        advantages = []

        if d["offensive_strength_index"] > d["opponent_strength_index"] + 0.2:
            advantages.append(
                "Significant attacking superiority — exploit spaces aggressively."
            )

        if d["defensive_vulnerability_index"] < 0.3:
            advantages.append(
                "Defensively solid — opponent will struggle to create chances."
            )

        if d["form_score"] > d["opponent_form_score"] + 0.25:
            advantages.append(
                "Strong form advantage — momentum is on your side."
            )

        if d["transition_intensity_score"] > 0.55 and d["opponent_strength_index"] < 0.5:
            advantages.append(
                "Transition game is strong — counter quickly on turnovers."
            )

        if not advantages:
            advantages.append(
                "No clear statistical advantage — focus on set pieces and organisation."
            )

        return advantages

    # ── Threats ────────────────────────────────────────────────
    def _find_threats(self, d: dict) -> list:
        threats = []

        if d["opponent_strength_index"] > d["offensive_strength_index"] + 0.2:
            threats.append(
                "Opponent has stronger attack — prioritise defensive shape."
            )

        if d["defensive_vulnerability_index"] > 0.6:
            threats.append(
                "High defensive vulnerability — reduce individual errors."
            )

        if d["fatigue_risk_score"] > 0.55:
            threats.append(
                "Fatigue risk elevated — consider early substitutions."
            )

        if d["opponent_form_score"] > 0.65:
            threats.append(
                "Opponent in strong form — do not underestimate them."
            )

        if not threats:
            threats.append(
                "No major threats identified — maintain structure and focus."
            )

        return threats