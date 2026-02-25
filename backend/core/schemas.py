from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────
class DataTier(str, Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"


class MatchResult(str, Enum):
    WIN = "W"
    DRAW = "D"
    LOSS = "L"


# ── Player ─────────────────────────────────────────────────────
class Player(BaseModel):
    name: str
    position: str                         # GK, DEF, MID, FWD
    available: bool
    fitness_score: Optional[float] = 1.0  # 0.0 to 1.0


# ── Tier 1 Input ───────────────────────────────────────────────
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


# ── Tier 2 Input ───────────────────────────────────────────────
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


# ── Request Wrapper ────────────────────────────────────────────
class MatchAnalysisRequest(BaseModel):
    tier: DataTier
    tier1_data: Optional[Tier1Input] = None
    tier2_data: Optional[Tier2Input] = None


# ── Output ─────────────────────────────────────────────────────
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