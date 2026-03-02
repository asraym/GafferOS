from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class DataTier(str, Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"


class MatchResult(str, Enum):
    WIN  = "W"
    DRAW = "D"
    LOSS = "L"


class BroadPosition(str, Enum):
    GK  = "GK"
    DEF = "DEF"
    MID = "MID"
    FWD = "FWD"


class SpecificPosition(str, Enum):
    GK  = "GK"
    CB  = "CB"
    RB  = "RB"
    LB  = "LB"
    RWB = "RWB"
    LWB = "LWB"
    CDM = "CDM"
    CM  = "CM"
    CAM = "CAM"
    RM  = "RM"
    LM  = "LM"
    RW  = "RW"
    LW  = "LW"
    ST  = "ST"
    CF  = "CF"
    SS  = "SS"


POSITION_MAP = {
    BroadPosition.GK:  [SpecificPosition.GK],
    BroadPosition.DEF: [SpecificPosition.CB, SpecificPosition.RB,
                        SpecificPosition.LB, SpecificPosition.RWB,
                        SpecificPosition.LWB],
    BroadPosition.MID: [SpecificPosition.CDM, SpecificPosition.CM,
                        SpecificPosition.CAM, SpecificPosition.RM,
                        SpecificPosition.LM],
    BroadPosition.FWD: [SpecificPosition.RW, SpecificPosition.LW,
                        SpecificPosition.ST, SpecificPosition.CF,
                        SpecificPosition.SS],
}


class Player(BaseModel):
    name: str
    position: BroadPosition
    specific_position: SpecificPosition
    secondary_position: Optional[SpecificPosition] = None
    available: bool
    fitness_score: Optional[float] = 1.0


class Tier1Input(BaseModel):
    team_name: str
    opponent_name: str
    last_5_results: List[MatchResult] = Field(..., min_length=1, max_length=5)
    goals_scored_last_5: int = Field(..., ge=0)
    goals_conceded_last_5: int = Field(..., ge=0)
    players: Optional[List[Player]] = []
    opponent_last_5_results: Optional[List[MatchResult]] = None
    opponent_goals_scored: Optional[int] = None
    opponent_goals_conceded: Optional[int] = None


class Tier2Input(Tier1Input):
    avg_possession: float = Field(..., ge=0, le=100)
    avg_passing_accuracy: float = Field(..., ge=0, le=100)
    avg_shots_per_match: float = Field(..., ge=0)
    avg_shots_on_target: float = Field(..., ge=0)
    avg_defensive_errors: float = Field(..., ge=0)
    opp_avg_possession: Optional[float] = None
    opp_avg_passing_accuracy: Optional[float] = None
    opp_avg_shots_per_match: Optional[float] = None
    opp_avg_defensive_errors: Optional[float] = None


class MatchAnalysisRequest(BaseModel):
    tier: DataTier
    tier1_data: Optional[Tier1Input] = None
    tier2_data: Optional[Tier2Input] = None


class TacticalReport(BaseModel):
    team_name: str
    opponent_name: str
    tier_used: DataTier
    recommended_formation: str
    press_intensity: str
    defensive_line: str
    tactical_focus: str
    match_risk_level: str
    rotation_suggestions: List[str] = []
    win_probability: Optional[float] = None
    draw_probability: Optional[float] = None
    loss_probability: Optional[float] = None
    offensive_strength_index: float
    defensive_vulnerability_index: float
    fatigue_risk_score: float
    tactical_stability_score: float
    reasoning: str
    starting_xi: List[dict] = []
    bench: List[dict] = []