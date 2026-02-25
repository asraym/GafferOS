class Explainer:

    def explain(self, data: dict) -> dict:
        reasoning = self._build_reasoning(data)
        return {**data, "reasoning": reasoning}

    # ── Reasoning ──────────────────────────────────────────────
    def _build_reasoning(self, d: dict) -> str:
        lines = []

        # Form summary
        lines.append(
            f"Recent form: {d.get('form_label', 'N/A')} "
            f"(momentum: {d.get('momentum', 'Stable')})."
        )

        # Formation rationale
        lines.append(
            f"Recommended {d['recommended_formation']} based on "
            f"offensive strength of {d['offensive_strength_index']:.2f} "
            f"against opponent strength of {d['opponent_strength_index']:.2f}, "
            f"with defensive vulnerability at {d['defensive_vulnerability_index']:.2f}."
        )

        # Press rationale
        fatigue = d["fatigue_risk_score"]
        lines.append(
            f"{d['press_intensity']} press intensity recommended — "
            f"squad fatigue risk is {fatigue:.0%}, "
            f"{'limiting high energy press.' if fatigue > 0.5 else 'allowing active pressing.'}"
        )

        # Tactical focus
        lines.append(
            f"Tactical focus: {d['tactical_focus']}."
        )

        # Risk
        lines.append(
            f"Overall match risk assessed as {d['match_risk_level']}."
        )

        # Advantages
        if d.get("advantages"):
            lines.append(
                "Key advantages: " + " | ".join(d["advantages"])
            )

        # Threats
        if d.get("threats"):
            lines.append(
                "Key threats: " + " | ".join(d["threats"])
            )

        return " ".join(lines)