class RotationAdvisor:

    FATIGUE_THRESHOLD = 0.65

    def advise(self, data: dict) -> dict:
        suggestions = self._build_suggestions(data)
        return {**data, "rotation_suggestions": suggestions}

    # ── Suggestions ────────────────────────────────────────────
    def _build_suggestions(self, d: dict) -> list:
        players = d.get("players", [])
        suggestions = []

        # No player data provided
        if not players:
            if d["fatigue_risk_score"] > 0.55:
                suggestions.append(
                    "Fatigue risk is elevated — consider rotating 2-3 players if depth allows."
                )
            return suggestions

        # Check each player
        for p in players:
            fitness = p.get("fitness_score", 1.0)

            if not p.get("available", True):
                suggestions.append(
                    f"{p['name']} ({p['position']}) — unavailable for selection."
                )
            elif fitness < self.FATIGUE_THRESHOLD:
                suggestions.append(
                    f"{p['name']} ({p['position']}) — fitness at {int(fitness * 100)}%."
                    f" Consider resting or limiting minutes."
                )

        if not suggestions:
            suggestions.append(
                "Squad fitness looks good — no urgent rotation needed."
            )

        return suggestions