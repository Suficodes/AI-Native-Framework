# ai-native-control-tower

Fresh DAK project. Vue 3 + FastAPI + Postgres, all via Docker Compose.

## Local development

```sh
cp .env.example .env
# set DETAILED_PASSWORD in .env
docker compose up --build
```

- Frontend: http://localhost:3100
- Backend:  http://localhost:8100  · health: `/healthz` · readiness: `/readyz`
- Postgres: localhost:5432

## Key files

| Where | What |
|---|---|
| `backend/app.py` | FastAPI aggregator (kept <200 lines) |
| `backend/api/*.py` | Route modules (one per resource) |
| `backend/services/*.py` | Business logic — no HTTP here |
| `backend/models/*.py` | SQLAlchemy models |
| `backend/auth.py` | DAK standard admin-key dep |
| `backend/logging_config.py` | Structured JSON logs |
| `frontend/src/views/` | Top-level route pages |
| `frontend/public/*.json` | Auto-updating data for the 4 auto-pages |
| `PROJECT.md` | Narrative log — keep it current |
| `CONVENTIONS.md` | Style rulebook — Claude reads first |

## Contracts with DAK

- Four auto-pages (`/vibe-code`, `/journey`, `/architecture`, `/pm-log`) stay wired.
- Files respect the tiered soft caps (`~/.claude/CLAUDE.md`).
- Currency is AED via the `<Aed>` component (`~/design-system/components/Aed.vue`).
- Any stack deviation documented in `PROJECT.md` under a "Stack Deviation" heading.
