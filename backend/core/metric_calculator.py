class MetricCalculator:

    def calculate(self, data: dict) -> dict:
        metrics = {}
        metrics["offensive_strength_index"] = self._offensive_strength(data)
        metrics["defensive_vulnerability_index"] = self._defensive_vulnerability(data)
        metrics["transition_intensity_score"] = self._transition_intensity(data)
        metrics["fatigue_risk_score"] = self._fatigue_risk(data)
        metrics["tactical_stability_score"] = self._tactical_stability(data)
        metrics["opponent_strength_index"] = self._opponent_strength(data)
        return {**data, **metrics}

    # ── Offensive Strength ─────────────────────────────────────
    def _offensive_strength(self, d: dict) -> float:
        """Higher = more attacking threat."""
        goals = min(d["goals_scored_last_5"] / 15.0, 1.0)

        if d["avg_shots_per_match"] is not None:
            shots = min(d["avg_shots_per_match"] / 20.0, 1.0)
            on_target = min(d["avg_shots_on_target"] / 10.0, 1.0)
            return round(goals * 0.4 + shots * 0.35 + on_target * 0.25, 3)

        return round(goals, 3)

    # ── Defensive Vulnerability ────────────────────────────────
    def _defensive_vulnerability(self, d: dict) -> float:
        """Higher = more defensively exposed."""
        goals = min(d["goals_conceded_last_5"] / 15.0, 1.0)

        if d["avg_defensive_errors"] is not None:
            errors = min(d["avg_defensive_errors"] / 5.0, 1.0)
            return round(goals * 0.6 + errors * 0.4, 3)

        return round(goals, 3)

    # ── Transition Intensity ───────────────────────────────────
    def _transition_intensity(self, d: dict) -> float:
        """High shots + low possession = transition style."""
        if d["avg_shots_per_match"] is not None and d["avg_possession"] is not None:
            shots = min(d["avg_shots_per_match"] / 20.0, 1.0)
            possession_inv = 1.0 - (d["avg_possession"] / 100.0)
            return round(shots * 0.5 + possession_inv * 0.5, 3)

        wins = d["last_5_results"].count("W")
        return round(wins / 5.0 * 0.5, 3)

    # ── Fatigue Risk ───────────────────────────────────────────
    def _fatigue_risk(self, d: dict) -> float:
        """Higher = more players at fatigue risk."""
        players = d.get("players", [])
        if not players:
            return 0.3

        avg_fitness = sum(p.get("fitness_score", 1.0) for p in players) / len(players)
        return round(1.0 - avg_fitness, 3)

    # ── Tactical Stability ─────────────────────────────────────
    def _tactical_stability(self, d: dict) -> float:
        """Higher = more consistent results."""
        points = {"W": 3, "D": 1, "L": 0}
        pts = [points[r] for r in d["last_5_results"]]

        if len(pts) < 2:
            return 0.5

        mean = sum(pts) / len(pts)
        variance = sum((p - mean) ** 2 for p in pts) / len(pts)
        return round(1.0 - min(variance / 9.0, 1.0), 3)

    # ── Opponent Strength ──────────────────────────────────────
    def _opponent_strength(self, d: dict) -> float:
        """Mirrors offensive strength but for opponent."""
        opp_results = d.get("opponent_last_5_results", ["D"] * 5)
        opp_goals = d.get("opponent_goals_scored", 6)

        wins = opp_results.count("W")
        goals = min(opp_goals / 15.0, 1.0)
        wins_score = wins / 5.0

        if d["opp_avg_shots_per_match"] is not None:
            shots = min(d["opp_avg_shots_per_match"] / 20.0, 1.0)
            return round(goals * 0.35 + wins_score * 0.35 + shots * 0.3, 3)

        return round(goals * 0.5 + wins_score * 0.5, 3)