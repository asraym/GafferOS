# GafferOS — Concepts To Know

A structured list of everything you should understand to build, extend,
and explain this project confidently.

---

## Python

### Intermediate Python (know these well)
- Classes and OOP — every module in this project is a class
- `__init__` method — how objects are initialised
- Instance methods and private methods (underscore prefix)
- Dictionaries — the core data structure used throughout the pipeline
- Dictionary unpacking — `{**dict1, **dict2}` used in every module
- List comprehensions — used in validator and feature builder
- f-strings — used heavily in explainer.py
- `Optional` type hints — many schema fields are optional
- `if __name__ == "__main__"` — used in run.py
- try/except — used in pipeline.py for ML error handling

### Python Concepts Specific To This Project
- Enums — MatchResult (W/D/L) and DataTier are Enums
- Inheritance — Tier2Input inherits from Tier1Input
- Default arguments — Optional fields with default values
- `min()` with 1.0 cap — normalisation pattern used everywhere
- `round()` — all metrics rounded to 3 decimal places

---

## Pydantic

- What Pydantic is — data validation library for Python
- BaseModel — every schema class inherits from this
- Field() — used to add constraints like ge=0 (greater than or equal)
- Model inheritance — Tier2Input extends Tier1Input
- `.dict()` method — converts a Pydantic model to a plain dict
- Optional fields — fields that don't have to be provided
- Enums in Pydantic — MatchResult used as a field type
- Validation errors — what happens when invalid data is submitted

---

## Data & Metrics

### Normalisation
- What normalisation is — scaling values to a common range (0.0–1.0)
- Why we normalise — so different metrics are comparable
- Min-max normalisation — raw / max_value, capped at 1.0
- Inversion — 1.0 - value (used for fatigue and possession)

### Statistics
- Mean (average) — used in fatigue and stability calculations
- Variance — measures how spread out results are
  formula: sum((value - mean)²) / count
- Why variance matters — detects consistency vs erratic performance
- Weighted averages — used in OSI, DVI, OSI_opp
  formula: (value1 × weight1) + (value2 × weight2) + ...
- Weights must sum to 1.0 — e.g. 0.40 + 0.35 + 0.25 = 1.0

---

## Machine Learning (Phase 2)

### Core Concepts
- Supervised learning — training on labelled examples (match + result)
- Classification — predicting a category (Win / Draw / Loss)
- Features — the input variables (your 8 tactical metrics)
- Target/Label — what you're predicting (match outcome)
- Training data — historical matches used to teach the model
- Test data — unseen matches used to evaluate the model
- Train/test split — typically 80% train, 20% test

### Model
- Gradient Boosting — builds decision trees sequentially
- XGBoost — optimised gradient boosting library
- predict_proba() — returns probabilities not just a class label
- Class order — Loss=0, Draw=1, Win=2 (must be consistent)

### Evaluation
- Accuracy — % of correct predictions
- F1 Score — balances precision and recall, better for imbalanced data
- Confusion Matrix — shows where the model gets confused
- Cross-validation — tests model on multiple splits to reduce bias

### Practical
- joblib.dump() — saves trained model to .pkl file
- joblib.load() — loads model at runtime
- Feature vector — ordered list of numbers fed into the model
- Domain gap — model trained on pro data, used for grassroots (limitation)

### Data Source
- StatsBomb open data — free event-level football dataset
- statsbombpy — Python library to access it
- Feature engineering — converting raw event data into model features

---

## API (Phase 3)

### FastAPI
- What FastAPI is — modern Python web framework
- Endpoints — URLs that accept requests (POST /analyse)
- HTTP methods — POST (send data), GET (retrieve data)
- Request body — JSON data sent to an endpoint
- Response model — Pydantic model returned as JSON
- Status codes — 200 OK, 422 validation error, 500 server error
- Swagger docs — auto-generated at /docs when FastAPI runs
- CORS — allows frontend to talk to backend across different ports
- Uvicorn — the server that runs FastAPI

### REST API Concepts
- What an API is — interface between frontend and backend
- JSON — data format used for requests and responses
- Stateless — each request is independent, no memory between calls

---

## Database (Phase 3)

### PostgreSQL
- What PostgreSQL is — relational database
- Tables — store structured data (teams, matches, reports)
- Primary key — unique identifier for each row
- Foreign key — links rows across tables

### SQLAlchemy
- What SQLAlchemy is — Python library to interact with databases
- ORM — Object Relational Mapper, maps Python classes to tables
- Models — Python classes that represent database tables
- Sessions — how you open/close database connections
- Migrations — how you update the database schema (via Alembic)

---

## Git & GitHub

### Concepts
- Repository — the project folder tracked by Git
- Commit — a saved snapshot of your code
- Branch — an isolated copy of the code for a feature
- Merge — combining a branch back into main
- Pull Request — asking to merge your branch into main
- Clone — copying a remote repo to your machine
- Push — sending local commits to GitHub
- Pull — getting latest changes from GitHub

### Workflow
- Never commit directly to main
- Always branch → work → pull request → merge
- Pull before starting work every session
- Commit small and often with clear messages

---

## Streamlit (Phase 1 UI)

- What Streamlit is — Python library for building web UIs
- st.text_input() — text input field
- st.number_input() — number input field
- st.multiselect() — dropdown with multiple selections
- st.slider() — range slider
- st.button() — clickable button
- st.metric() — displays a key value with label
- st.columns() — splits page into columns
- st.sidebar — left panel for settings
- st.divider() — horizontal line separator
- st.spinner() — loading animation
- st.cache_resource — caches heavy objects like the pipeline
- @st.cache_resource — decorator to apply caching

---

## Software Design

### Patterns Used In This Project
- Pipeline pattern — data flows through sequential stages
- Dictionary as data bus — each module enriches and passes forward
- Single responsibility — each class does exactly one thing
- Dependency injection — ML model passed into pipeline, not hardcoded
- Fallback defaults — system degrades gracefully on missing data
- Priority rules — engine checks most critical conditions first

### Concepts To Understand
- Separation of concerns — core vs engine vs api vs ui
- Modularity — adding Phase 2 without touching Phase 1 code
- Extensibility — designed so new tiers/rules can be added easily
- Explainability — every decision has a human-readable justification

---

## Football / Domain Knowledge

### Tactical Concepts Used In The Engine
- Formation — how players are arranged (4-3-3, 4-2-3-1 etc.)
- Press — actively chasing the ball high up the pitch
- Defensive line — how deep the defence sits
- Transition — moving quickly from defence to attack
- Mismatch — where one team has a clear advantage over the other
- Fatigue — tired players cannot press or cover ground effectively
- Form — recent results as an indicator of current performance
- Momentum — whether a team is trending up or down

### Why Domain Knowledge Matters
- The metric thresholds (0.65, 0.55 etc.) are football judgements
- Wrong thresholds = wrong recommendations
- As you learn more about football tactics, refine the rules

---

## Study Priority Order

### Do First (needed for Phase 1 and 2)
1. Python OOP and dictionaries
2. Pydantic BaseModel and validation
3. Normalisation and weighted averages
4. Variance and basic statistics
5. Git branching workflow

### Do Next (needed for Phase 2)
6. Supervised learning and classification
7. XGBoost and predict_proba()
8. Train/test split and cross-validation
9. joblib save/load
10. StatsBomb data structure

### Do After (needed for Phase 3 and 4)
11. FastAPI endpoints and routing
12. PostgreSQL basics
13. SQLAlchemy ORM
14. JWT authentication
15. Docker basics
16. React fundamentals
