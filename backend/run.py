from core.schemas import MatchAnalysisRequest, DataTier, Tier1Input, MatchResult, Player
from pipeline import TactIQPipeline


def main():
    request = MatchAnalysisRequest(
        tier=DataTier.TIER_1,
        tier1_data=Tier1Input(
            team_name="GafferOS FC",
            opponent_name="Riverside United",
            last_5_results=[
                MatchResult.WIN,
                MatchResult.DRAW,
                MatchResult.WIN,
                MatchResult.LOSS,
                MatchResult.WIN,
            ],
            goals_scored_last_5=9,
            goals_conceded_last_5=5,
            players=[
                Player(name="Jamie Cole", position="GK", available=True, fitness_score=0.95),
                Player(name="Marcus Webb", position="DEF", available=True, fitness_score=0.60),
                Player(name="Owen Hart", position="MID", available=False, fitness_score=0.0),
                Player(name="Liam Torres", position="FWD", available=True, fitness_score=0.88),
            ],
            opponent_last_5_results=[
                MatchResult.LOSS,
                MatchResult.WIN,
                MatchResult.DRAW,
                MatchResult.LOSS,
                MatchResult.DRAW,
            ],
            opponent_goals_scored=5,
            opponent_goals_conceded=8,
        )
    )

    pipeline = TactIQPipeline()
    result = pipeline.run(request)

    print("\n" + "=" * 55)
    print("  GAFFEROS — MATCH ANALYSIS REPORT")
    print("=" * 55)
    print(f"  {result.team_name}  vs  {result.opponent_name}")
    print(f"  Data Tier: {result.tier_used}")
    print("=" * 55)
    print(f"  Formation:       {result.recommended_formation}")
    print(f"  Press Intensity: {result.press_intensity}")
    print(f"  Defensive Line:  {result.defensive_line}")
    print(f"  Tactical Focus:  {result.tactical_focus}")
    print(f"  Match Risk:      {result.match_risk_level}")
    print()
    print("  Rotation Suggestions:")
    for s in result.rotation_suggestions:
        print(f"    → {s}")
    print()
    print("  Reasoning:")
    print(f"    {result.reasoning}")
    print("=" * 55)


if __name__ == "__main__":
    main()