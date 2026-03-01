"""
GafferOS — FastAPI Backend
Phase 3: REST API wrapping the existing pipeline.

Run from backend/ directory:
    uvicorn api.main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List

from core.schemas import (
    MatchAnalysisRequest,
    DataTier,
    Tier1Input,
    Tier2Input,
    MatchResult,
    Player,
    BroadPosition,
    SpecificPosition,
)
from pipeline import TactIQPipeline

# ── App ────────────────────────────────────────────────────────
app = FastAPI(
    title="GafferOS API",
    description="AI-assisted tactical decision support for grassroots football.",
    version="1.0.0",
)

# ── CORS — allow Next.js dev server ───────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pipeline (singleton) ───────────────────────────────────────
pipeline = TactIQPipeline()


# ── Request / Response Models ──────────────────────────────────

class PlayerRequest(BaseModel):
    name: str
    position: str           # BroadPosition value e.g. "DEF"
    specific_position: str  # SpecificPosition value e.g. "CB"
    secondary_position: Optional[str] = None
    available: bool = True
    fitness_score: float = Field(default=1.0, ge=0.0, le=1.0)


class Tier1Request(BaseModel):
    team_name: str
    opponent_name: str
    last_5_results: List[str] = Field(..., min_length=1, max_length=5)
    goals_scored_last_5: int = Field(..., ge=0)
    goals_conceded_last_5: int = Field(..., ge=0)
    players: Optional[List[PlayerRequest]] = []
    opponent_last_5_results: Optional[List[str]] = None
    opponent_goals_scored: Optional[int] = None
    opponent_goals_conceded: Optional[int] = None


class Tier2Request(Tier1Request):
    avg_possession: float = Field(..., ge=0, le=100)
    avg_passing_accuracy: float = Field(..., ge=0, le=100)
    avg_shots_per_match: float = Field(..., ge=0)
    avg_shots_on_target: float = Field(..., ge=0)
    avg_defensive_errors: float = Field(..., ge=0)
    opp_avg_possession: Optional[float] = None
    opp_avg_passing_accuracy: Optional[float] = None
    opp_avg_shots_per_match: Optional[float] = None
    opp_avg_defensive_errors: Optional[float] = None


class AnalyseRequest(BaseModel):
    tier: str  # "tier_1" or "tier_2"
    tier1_data: Optional[Tier1Request] = None
    tier2_data: Optional[Tier2Request] = None


# ── Helpers ────────────────────────────────────────────────────

def _build_players(raw: Optional[List[PlayerRequest]]) -> List[Player]:
    if not raw:
        return []
    players = []
    for p in raw:
        players.append(Player(
            name=p.name,
            position=BroadPosition(p.position),
            specific_position=SpecificPosition(p.specific_position),
            secondary_position=SpecificPosition(p.secondary_position) if p.secondary_position else None,
            available=p.available,
            fitness_score=p.fitness_score,
        ))
    return players


def _build_results(raw: Optional[List[str]]) -> Optional[List[MatchResult]]:
    if raw is None:
        return None
    return [MatchResult(r) for r in raw]


def _build_tier1(data: Tier1Request) -> Tier1Input:
    return Tier1Input(
        team_name=data.team_name,
        opponent_name=data.opponent_name,
        last_5_results=_build_results(data.last_5_results),
        goals_scored_last_5=data.goals_scored_last_5,
        goals_conceded_last_5=data.goals_conceded_last_5,
        players=_build_players(data.players),
        opponent_last_5_results=_build_results(data.opponent_last_5_results),
        opponent_goals_scored=data.opponent_goals_scored,
        opponent_goals_conceded=data.opponent_goals_conceded,
    )


def _build_tier2(data: Tier2Request) -> Tier2Input:
    return Tier2Input(
        team_name=data.team_name,
        opponent_name=data.opponent_name,
        last_5_results=_build_results(data.last_5_results),
        goals_scored_last_5=data.goals_scored_last_5,
        goals_conceded_last_5=data.goals_conceded_last_5,
        players=_build_players(data.players),
        opponent_last_5_results=_build_results(data.opponent_last_5_results),
        opponent_goals_scored=data.opponent_goals_scored,
        opponent_goals_conceded=data.opponent_goals_conceded,
        avg_possession=data.avg_possession,
        avg_passing_accuracy=data.avg_passing_accuracy,
        avg_shots_per_match=data.avg_shots_per_match,
        avg_shots_on_target=data.avg_shots_on_target,
        avg_defensive_errors=data.avg_defensive_errors,
        opp_avg_possession=data.opp_avg_possession,
        opp_avg_passing_accuracy=data.opp_avg_passing_accuracy,
        opp_avg_shots_per_match=data.opp_avg_shots_per_match,
        opp_avg_defensive_errors=data.opp_avg_defensive_errors,
    )


# ── Routes ─────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "GafferOS API running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyse")
def analyse(body: AnalyseRequest):
    """
    Main endpoint. Accepts match data and returns a full TacticalReport.
    """
    try:
        tier = DataTier(body.tier)

        if tier == DataTier.TIER_1:
            if not body.tier1_data:
                raise HTTPException(status_code=422, detail="tier1_data is required for tier_1.")
            request = MatchAnalysisRequest(
                tier=tier,
                tier1_data=_build_tier1(body.tier1_data),
            )

        elif tier == DataTier.TIER_2:
            if not body.tier2_data:
                raise HTTPException(status_code=422, detail="tier2_data is required for tier_2.")
            request = MatchAnalysisRequest(
                tier=tier,
                tier2_data=_build_tier2(body.tier2_data),
            )

        else:
            raise HTTPException(status_code=400, detail="Invalid tier value.")

        report = pipeline.run(request)
        return report.dict()

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")