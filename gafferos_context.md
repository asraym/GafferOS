# GafferOS — Project Context File

## What Is This Project
GafferOS is an AI-assisted tactical decision support system for grassroots 
and amateur football clubs. It takes basic match data from a coach and returns 
tactical recommendations — formation, press intensity, defensive line, rotation 
suggestions, and a plain English reasoning report.

The core idea: elite clubs use expensive platforms like Hudl and StatsBomb. 
Grassroots teams have nothing. GafferOS bridges that gap with a lightweight, 
adaptive system that works even with minimal data.

---

## Project Status
Phase 1 — COMPLETE
Phase 2 — NOT STARTED (ML pipeline)
Phase 3 — NOT STARTED (FastAPI + PostgreSQL)
Phase 4 — NOT STARTED (React + SaaS)

---

## Tech Stack
- Language: Python 3.14
- Data validation: Pydantic
- Data processing: Pandas, NumPy
- ML (Phase 2): Scikit-learn, XGBoost, Joblib
- API (Phase 3): FastAPI, Uvicorn
- Database (Phase 3): PostgreSQL, SQLAlchemy
- UI Phase 1: Streamlit
- UI Phase 4: React
- OS: Windows
- Version control: Git + GitHub

---

## Project Structure

```
GafferOS/
├── backend/
│   ├── core/
│   │   ├── schemas.py              # Pydantic input/output contracts
│   │   ├── input_validator.py      # Validates inputs, fills missing fields
│   │   ├── metric_calculator.py    # Converts raw stats → tactical indices
│   │   ├── form_analyser.py        # Form score, momentum, form label
│   │   └── feature_builder.py      # Builds ML feature vector
│   ├── engine/
│   │   ├── formation_selector.py   # Formation, line height, tactical focus
│   │   ├── press_engine.py         # Press intensity, match risk
│   │   ├── mismatch_detector.py    # Advantages and threats
│   │   ├── rotation_advisor.py     # Player fatigue and availability
│   │   └── explainer.py            # Plain English reasoning
│   ├── ml/                         # Empty — Phase 2
│   ├── api/                        # Empty — Phase 3
│   │   └── routes/
│   ├── models/                     # Saved .pkl files — Phase 2
│   ├── data/
│   │   └── sample_inputs/
│   │       ├── tier1_example.json
│   │       └── tier2_example.json
│   ├── tests/                      # Empty — to be filled
│   ├── pipeline.py                 # Orchestrates all layers
│   ├── run.py                      # Terminal test script
│   └── requirements.txt
├── frontend/
│   └── ui/
│       └── app.py                  # Streamlit UI
├── docs/
├── .gitignore
└── README.md
```

---

## Data Flow (Phase 1)

```
Coach Input (Streamlit form)
→ InputValidator       validates + normalises, fills defaults
→ MetricCalculator     produces 6 tactical indices (all 0.0–1.0)
→ FormAnalyser         form score, momentum, form label
→ FormationSelector    formation, defensive line, tactical focus
→ PressEngine          press intensity, match risk level
→ MismatchDetector     advantages and threats lists
→ RotationAdvisor      player fatigue and availability flags
→ Explainer            plain English reasoning paragraph
→ TacticalReport       final Pydantic output model
```

---

## Data Tiers

### Tier 1 — Minimal
- Team name, opponent name
- Last 5 results (W/D/L)
- Goals scored and conceded (last 5)
- Player list with availability and fitness score (0.0–1.0)
- Optional: opponent last 5 results, goals scored/conceded

### Tier 2 — Full Stats
Everything in Tier 1 plus:
- Avg possession %
- Avg passing accuracy %
- Avg shots per match
- Avg shots on target
- Avg defensive errors per match
- Same opponent stats if available

---

## Tactical Metrics

All normalised to 0.0–1.0 scale.

### Offensive Strength Index (OSI)
Tier 1: min(goals_scored / 15.0, 1.0)
Tier 2: (goals×0.40) + (shots/20×0.35) + (sot/10×0.25)

### Defensive Vulnerability Index (DVI)
Tier 1: min(goals_conceded / 15.0, 1.0)
Tier 2: (goals×0.60) + (errors/5×0.40)

### Transition Intensity Score (TIS)
Tier 1: (wins/5) × 0.50
Tier 2: (shots/20×0.50) + ((1 - possession/100)×0.50)

### Fatigue Risk Score (FRS)
1.0 - average(player fitness scores)
Default 0.30 if no player data provided

### Tactical Stability Score (TSS)
Points: W=3, D=1, L=0
variance = sum((point - mean)²) / count
TSS = 1.0 - min(variance / 9.0, 1.0)

### Opponent Strength Index (OSI_opp)
Tier 1: (opp_goals/15×0.50) + (opp_wins/5×0.50)
Tier 2: (goals×0.35) + (wins×0.35) + (shots/20×0.30)

---

## Engine Rules Summary

### Formation Selection (priority order)
1. DVI > 0.65 AND opp > 0.60 → 5-4-1
2. Fatigue > 0.60 AND opp > 0.45 → 4-5-1
3. OSI > 0.65 AND opp < 0.40 → 4-3-3
4. DVI < 0.40 AND OSI > 0.45 → 4-2-3-1
5. TIS > 0.60 → 4-4-2
6. Default → 4-3-3

### Defensive Line
- DVI > 0.60 OR opp > 0.65 → Deep
- Fatigue > 0.55 → Medium
- OSI > 0.60 AND opp < 0.45 → High
- Default → Medium

### Tactical Focus
- DVI > 0.60 AND opp > 0.55 → Defensive Solidity
- TIS > 0.60 AND form > 0.60 → Counter-Attacking
- OSI > 0.60 AND opp < 0.45 → High Press & Dominate
- Momentum = Rising AND OSI > 0.50 → Wide Attacking Play
- DVI < 0.35 AND OSI > 0.50 → Possession & Build-Up
- Default → Balanced Mid-Block

### Press Intensity
- Fatigue > 0.65 → Low (overrides everything)
- Fatigue < 0.35 AND form > 0.55 AND opp < 0.60 → High
- Opp > 0.65 → Low
- Default → Medium

### Match Risk Score
score = (opp×0.40) + (DVI×0.30) + (fatigue×0.20) + ((1-form)×0.10)
- score > 0.60 → High
- score > 0.35 → Medium
- else → Low

---

## Key Design Decisions

1. Every module takes a data dict in, returns an enriched data dict out
   → Makes pipeline.py clean and easy to extend

2. Tier 2 extends Tier 1 via Pydantic inheritance
   → No duplicated fields

3. Every metric has a Tier 1 fallback
   → System never crashes on missing data

4. Fatigue overrides press intensity regardless of other metrics
   → Safety first — never ask tired players to press high

5. ML model is optional in pipeline.py (ml_model=None)
   → Phase 2 plugs in without touching existing code

6. Explainer is the last step and pulls from every layer
   → Every recommendation is always justified

---

## Schemas

### Input
```python
class DataTier(str, Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"

class MatchResult(str, Enum):
    WIN = "W"
    DRAW = "D"
    LOSS = "L"

class Player(BaseModel):
    name: str
    position: str          # GK, DEF, MID, FWD
    available: bool
    fitness_score: float   # 0.0 to 1.0

class Tier1Input(BaseModel):
    team_name: str
    opponent_name: str
    last_5_results: List[MatchResult]
    goals_scored_last_5: int
    goals_conceded_last_5: int
    players: Optional[List[Player]]
    opponent_last_5_results: Optional[List[MatchResult]]
    opponent_goals_scored: Optional[int]
    opponent_goals_conceded: Optional[int]

class Tier2Input(Tier1Input):
    avg_possession: float
    avg_passing_accuracy: float
    avg_shots_per_match: float
    avg_shots_on_target: float
    avg_defensive_errors: float
    opp_avg_possession: Optional[float]
    opp_avg_passing_accuracy: Optional[float]
    opp_avg_shots_per_match: Optional[float]
    opp_avg_defensive_errors: Optional[float]

class MatchAnalysisRequest(BaseModel):
    tier: DataTier
    tier1_data: Optional[Tier1Input]
    tier2_data: Optional[Tier2Input]
```

### Output
```python
class TacticalReport(BaseModel):
    team_name: str
    opponent_name: str
    tier_used: DataTier
    recommended_formation: str
    press_intensity: str
    defensive_line: str
    tactical_focus: str
    match_risk_level: str
    rotation_suggestions: List[str]
    win_probability: Optional[float]
    draw_probability: Optional[float]
    loss_probability: Optional[float]
    offensive_strength_index: float
    defensive_vulnerability_index: float
    fatigue_risk_score: float
    tactical_stability_score: float
    reasoning: str
```

---

## ML Feature Vector (Phase 2)

These 8 features will be used to train the model.
Order is fixed — must match training schema exactly.

```python
FEATURE_KEYS = [
    "offensive_strength_index",
    "defensive_vulnerability_index",
    "transition_intensity_score",
    "fatigue_risk_score",
    "tactical_stability_score",
    "opponent_strength_index",
    "form_score",
    "opponent_form_score",
]
```

Training data source: StatsBomb open data (free)
GitHub: github.com/statsbomb/open-data
Install: pip install statsbombpy

Model: XGBoost classifier
Target: Win=2, Draw=1, Loss=0
Output: win/draw/loss probabilities

---

## Phase 2 Plan (ML)

1. pip install statsbombpy
2. Run ml/feature_engineering.py → produces data/statsbomb_features.csv
3. Run ml/train.py → produces models/match_predictor.pkl
4. Load model in pipeline.py → TactIQPipeline(ml_model=loaded_model)
5. Pipeline automatically fills win/draw/loss probabilities in output

---

## Phase 3 Plan (API)

- FastAPI app in api/main.py
- Main endpoint: POST /analyse
- Additional: POST /teams, GET /history
- Database: PostgreSQL via SQLAlchemy
- Auth: JWT (for SaaS)

---

## Phase 4 Plan (SaaS)

- Replace Streamlit with React dashboard
- Add user accounts and authentication
- Deploy on Render or Railway
- Add subscription model

---

## How To Run

```bash
# Activate venv (Windows)
cd GafferOS/backend
venv\Scripts\activate

# Terminal test
python run.py

# Streamlit UI
streamlit run ../frontend/ui/app.py
```

---

## Known Issues & Fixes

| Issue | Fix |
|-------|-----|
| pandas 2.2.0 build error on Windows | Use pandas>=2.1.0 |
| scikit-learn incompatible with Python 3.14 | Use >= for all versions |
| ModuleNotFoundError for schemas | Use core.schemas in imports |
| venv activation failed | Use backslash on Windows |

---

## Important Notes For Any Agent Working On This

- Developer is intermediate level in Python
- Windows machine, Python 3.14
- Use >= not == for package versions in requirements.txt
- All imports must use full module path e.g. core.schemas not schemas
- Do not modify metric thresholds without explaining the reasoning
- ML layer is intentionally not built yet — do not add it unless asked
- Keep explanations practical, avoid over-engineering
- When adding new engine rules always follow priority order pattern
- Every new module must follow: takes dict in, returns enriched dict out
