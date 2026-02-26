# GafferOS

AI-assisted tactical decision support system for grassroots and amateur football clubs.

## The Problem
Elite clubs use expensive analytics platforms. Grassroots teams rely on spreadsheets and guesswork. GafferOS bridges that gap.

## What It Does
Coaches input basic match data and receive instant tactical recommendations — formation, press intensity, defensive line, rotation suggestions, and a plain-English reasoning report.

## Data Tiers
- **Tier 1** — Last 5 results, goals, player availability
- **Tier 2** — Full match statistics (possession, passing %, shots, errors)

## Tech Stack
- **Backend** — Python, Pydantic
- **ML** — Scikit-learn, XGBoost *(Phase 2)*
- **API** — FastAPI *(Phase 3)*
- **UI** — Streamlit → React *(Phase 4)*



## Roadmap
- [x] Phase 1 — Core engine + Streamlit UI
- [ ] Phase 2 — ML win probability model
- [ ] Phase 3 — FastAPI + PostgreSQL
- [ ] Phase 4 — React dashboard + SaaS