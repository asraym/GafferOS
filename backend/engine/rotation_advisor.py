class RotationAdvisor:

    FATIGUE_THRESHOLD = 0.65

    def advise(self, data: dict) -> dict:
        suggestions = self._build_suggestions(data)
        return {**data, "rotation_suggestions": suggestions}

    def _build_suggestions(self, d: dict) -> list:
        starting_xi = d.get("starting_xi", [])
        bench = d.get("bench", [])
        suggestions = []

        if not starting_xi:
            if d["fatigue_risk_score"] > 0.55:
                suggestions.append(
                    "Fatigue risk elevated — consider rotating 2-3 players if depth allows."
                )
            return suggestions

        for p in starting_xi:
            fitness = p.get("fitness_score", 1.0)
            name = p.get("name")
            specific = p.get("specific_position")
            broad = p.get("position")

            if not p.get("available", True):
                replacement = self._find_replacement(bench, broad, specific)
                if replacement:
                    suggestions.append(
                        f"{name} ({specific}) — unavailable. "
                        f"Suggest starting {replacement['name']} "
                        f"({replacement['specific_position']}, "
                        f"fitness: {int(replacement['fitness_score'] * 100)}%)."
                    )
                else:
                    suggestions.append(
                        f"{name} ({specific}) — unavailable. No bench cover found."
                    )

            elif fitness < self.FATIGUE_THRESHOLD:
                replacement = self._find_replacement(bench, broad, specific)
                if replacement:
                    suggestions.append(
                        f"{name} ({specific}) — fitness at {int(fitness * 100)}%. "
                        f"Consider bringing on {replacement['name']} "
                        f"({replacement['specific_position']}, "
                        f"fitness: {int(replacement['fitness_score'] * 100)}%)."
                    )
                else:
                    suggestions.append(
                        f"{name} ({specific}) — fitness at {int(fitness * 100)}%. "
                        f"No bench cover available — monitor closely."
                    )

        if not suggestions:
            suggestions.append(
                "Starting XI fitness looks good — no urgent changes needed."
            )

        return suggestions

    def _find_replacement(self, bench: list, broad: str, specific: str):
        """
        Finds fittest bench player who covers the position.
        Checks primary position first, then secondary position.
        """
        candidates = []

        for p in bench:
            if not p.get("available", True):
                continue

            if p.get("position") == broad or p.get("specific_position") == specific:
                candidates.append(p)
                continue

            if p.get("secondary_position") == specific:
                candidates.append(p)

        if not candidates:
            return None

        return max(candidates, key=lambda p: p.get("fitness_score", 0.0))