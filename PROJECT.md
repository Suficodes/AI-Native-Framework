---
project_id: a21e144f-e10d-43b0-9fa4-82eb468bd72c
status: building          # building | live | paused | archived
goal: ""                  # one line — what this project is for (fill this in)
domain: ""                # e.g. finance, hr, ops, data, customer
audience: ""              # who uses it
---

# ai-native-control-tower

> One-line description of what this project does. Replace this.

## Current state

_2026-07-31_ — fresh DAK scaffold. Services boot, four auto-pages render, and a worked `items` data model is wired end-to-end (delete it once you add real models).

## Goals

- _Fill in what this project is trying to achieve. 3 bullets max._
- _What "done" looks like for v1._

## Stack

See `/architecture` (live) or `public/tech-stack.json`.

_Stack deviations: **none** yet._

## Log

### Phase 1 — Scaffolded (2026-07-31)

Initialized via `dak init`. Vue 3 + FastAPI + Postgres + Docker wired out of the box. Four auto-pages in place (`/journey`, `/architecture`, `/vibe-code`, `/pm-log`).

**What's done**
- Docker Compose brings up db, backend, frontend.
- `/healthz` + `/readyz` live.
- Admin auth via `DETAILED_PASSWORD` env (generated into `.env` at scaffold).
- Data layer: `items` model + CRUD at `/api/items`, tables auto-created on boot, `pytest` green.

**Open questions**
- _List any decisions deferred to a later session._

**Lessons**
- _As this grows, capture what went wrong and how you fixed it._
