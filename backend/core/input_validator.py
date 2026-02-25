from core.schemas import MatchAnalysisRequest, DataTier, Tier1Input, Tier2Input

class InputValidator:

    def validate(self, request: MatchAnalysisRequest) -> dict:
        if request.tier == DataTier.TIER_1:
            return self._validate_tier1(request.tier1_data)
        elif request.tier == DataTier.TIER_2:
            return self._validate_tier2(request.tier2_data)
        else:
            raise NotImplementedError("Tier 3 is future scope.")

    # ── Tier 1 ─────────────────────────────────────────────────
    def _validate_tier1(self, data: Tier1Input) -> dict:
        if data is None:
            raise ValueError("Tier 1 data missing.")

        return {
            "tier": DataTier.TIER_1,
            "team_name": data.team_name,
            "opponent_name": data.opponent_name,
            "last_5_results": [r.value for r in data.last_5_results],
            "goals_scored_last_5": data.goals_scored_last_5,
            "goals_conceded_last_5": data.goals_conceded_last_5,
            "players": [p.dict() for p in data.players] if data.players else [],

            # Opponent — use neutral defaults if not provided
            "opponent_last_5_results": (
                [r.value for r in data.opponent_last_5_results]
                if data.opponent_last_5_results
                else ["D", "D", "D", "D", "D"]
            ),
            "opponent_goals_scored": data.opponent_goals_scored or 6,
            "opponent_goals_conceded": data.opponent_goals_conceded or 6,

            # Tier 2 fields — None for now
            "avg_possession": None,
            "avg_passing_accuracy": None,
            "avg_shots_per_match": None,
            "avg_shots_on_target": None,
            "avg_defensive_errors": None,
            "opp_avg_possession": None,
            "opp_avg_passing_accuracy": None,
            "opp_avg_shots_per_match": None,
            "opp_avg_defensive_errors": None,
        }

    # ── Tier 2 ─────────────────────────────────────────────────
    def _validate_tier2(self, data: Tier2Input) -> dict:
        if data is None:
            raise ValueError("Tier 2 data missing.")

        base = self._validate_tier1(data)
        base.update({
            "tier": DataTier.TIER_2,
            "avg_possession": data.avg_possession,
            "avg_passing_accuracy": data.avg_passing_accuracy,
            "avg_shots_per_match": data.avg_shots_per_match,
            "avg_shots_on_target": data.avg_shots_on_target,
            "avg_defensive_errors": data.avg_defensive_errors,
            "opp_avg_possession": data.opp_avg_possession or 50.0,
            "opp_avg_passing_accuracy": data.opp_avg_passing_accuracy or 72.0,
            "opp_avg_shots_per_match": data.opp_avg_shots_per_match or 10.0,
            "opp_avg_defensive_errors": data.opp_avg_defensive_errors or 1.5,
        })
        return base