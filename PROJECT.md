---
project_id: a21e144f-e10d-43b0-9fa4-82eb468bd72c
status: building          # building | live | paused | archived
goal: "High-fidelity interactive prototype of an AI-Native Enterprise Control Tower for DEWA — connects org structure, human/agent workforce, Quality Procedures, processes, AI initiatives, harness engineering, D2D delivery, value realization and token economics into one CAIO-facing console."
domain: enterprise-ai-governance
audience: "CAIO, CIO, EVP, and senior DEWA management (executive demo/prototype audience)"
---

# ai-native-control-tower

> AI-Native Enterprise Control Tower — a CAIO-facing prototype that shows how DEWA becomes an AI-native organization: organization → job → activity → Quality Procedure → process → human/agent allocation → AI initiative → agent harness → D2D delivery → performance → value realization → token economics → strategic outcomes, in one connected product.

## Current state

_2026-07-31_ — scaffolded via `dak init`, then converted from the DAK default (Vue + FastAPI + Postgres) to this project's actual stack: **React 19 + Vite + Astryx/dewa theme, frontend-only, no backend.** Building all 16 navigation modules per `Protoype_requirements.docx` (see `/Users/sufimac/Desktop/AI Native Framework/Protoype_requirements.docx`), following its own 12-step build sequence.

## Goals

- Demonstrate the full AI-native transformation chain (org → QP → process → agent → harness → D2D → value → tokens → strategy) as one coherent, navigable product — not a set of disconnected dashboards.
- Give CAIO/CIO/EVP a presentation-ready tool: Executive Overview → drill-down through every module → a final interactive "AI-Native Enterprise Map" with a scripted Story Mode.
- "Done" for v1 = all 16 modules real (not stub) with mock data, the two named worked examples (Senior Business Analyst position, D2D Documentation Agent + its harness) fully populated, and a README with the SAP Neptune implementation mapping.

## Stack

See `/architecture` (live) or `public/tech-stack.json`.

_Stack deviations:_
- **No backend.** This prototype is frontend-only: mock TypeScript data (`frontend/src/data/`) served through local `mockApi.ts` functions, consumed via local React state. No FastAPI, no Postgres, no Docker. This is an explicit instruction from the requirements doc (Section 1: "No backend required for the first prototype... No external API keys... No paid dependencies"), not an oversight. A follow-up phase would move `mockApi.ts`'s data into the standard DAK FastAPI+Postgres backend.
- **Design system:** Astryx + the bundled `dewa` theme (DEWA green `#007560`, already the Astryx default), extended with this project's own `frontend/src/dewa/DESIGN.md` token set (Dubai font, 5/7/15/20/100px radius scale, pill buttons) layered on top as `theme-control-tower.css` + a `DewaButton` wrapper — see that file for specifics.
- **Charts:** `recharts`. **Node-link graphs** (org chart, harness designer, final Enterprise Map): `@xyflow/react` + `@dagrejs/dagre` for auto-layout where edges aren't a pure tree. Both MIT-licensed, no paid dependencies.

## Log

### Phase 1 — Scaffolded (2026-07-31)

Initialized via `dak init` (default Vue 3 + FastAPI + Postgres + Docker scaffold), then immediately stripped to this project's actual stack: deleted `backend/`, `docker-compose.yml`, and all `.vue`/`main.js`/`router.js` leftovers (dead code — `index.html` already loaded `main.jsx`). Kept the four DAK auto-pages (`/journey`, `/architecture`, `/vibe-code`, `/pm-log`) and the Astryx/dewa theme layer. Added `recharts`, `@xyflow/react`, `@dagrejs/dagre`, and TypeScript (`tsconfig.json`, `.ts`/`.tsx` for the data/logic layer; UI stays `.jsx` per the existing template convention).

**What's done**
- Frontend boots clean on `npm install && npm run dev` (port 3400 / exposed as 3100 previously via the now-removed Docker Compose — bare-metal `npm run dev` is the supported path per the requirements doc).
- Design token layering, mock data model, and all 16 modules — in progress, see Step log below as each lands.

**Open questions**
- Real Dubai font files not yet sourced (proprietary UAE government font) — shipping with a documented Figtree fallback for now.

**Lessons**
- `dak init`'s scaffold currently copies both a Vue and a React frontend simultaneously (only the React one is wired to `index.html`) — worth cleaning up in the template itself at some point, but out of scope here.

### Phase 2 — Step 1: Design tokens & route shell (2026-08-01)

`dewa/theme-control-tower.css` (DESIGN.md's radius scale, mapped onto Astryx's 5 radius slots), `dewa/DewaButton.jsx` (48px pill wrapper — Astryx `Button` has no 48px size, but its `--_button-radius` var is the same officially-supported pill hook Astryx's own Carousel/Chat use), `dewa/ValueTag.jsx` (Estimated/Observed/Verified/Validated badge). Full route table for all 16 modules + Administration wired into `router.jsx`/`App.jsx` (SideNav grouped "Control Tower" + "Project", topbar with role switcher, period selector, global search via CommandPalette, notifications), every route rendering a real page — `ComingSoon` placeholder for modules not yet built, real content for Administration (config-driven, 19 sub-screens) and the standalone full-screen Enterprise Map shell.

### Phase 2 — Step 2: Mock data model (2026-08-01)

Full TypeScript data layer: `data/types.ts` (24 entity interfaces), `data/seed/*.ts` (one file per entity, strict FK-dependency build order), `data/mockApi.ts` (the exact `get*()` names the requirements doc specifies, each with an artificial delay), `lib/calc.ts` (the doc's formulas, implemented once). Verified via `scripts/smoke-data.ts` (`npx tsx scripts/smoke-data.ts`): all Section 21 volumes match exactly (4 divisions/8 super depts/16 depts/25 sections/60 positions/40 employees/15 agents/20 processes/15 QPs/20 initiatives/15 harnesses/15 VR records), zero dangling foreign keys, and both required worked examples (`POS-BA-D2D-01`, `AGT-D2D-DOC-01`/`HAR-D2D-BRD-01`) reproduce the doc's exact figures.

### Phase 2 — Step 3: Executive Overview (2026-08-01)

`components/KpiCard.jsx` (shared primitive — definition/source/period via HoverCard, drill-down, ValueTag), all 16 KPIs, charts A–H (recharts), and the Executive Attention Required panel, all computed from the mock dataset via `data/executiveAggregates.ts` (no hardcoded numbers).

**Lessons**
- Loaded the `dataviz` skill before building charts. DEWA's own brand hex (including primary green `#007560`) **fails** the skill's categorical-palette validator as chart-mark colors — brand palettes are tuned for WCAG text contrast, not perceptual chart-series distinctness. Chart marks use the dataviz skill's own validated reference palette instead (`lib/chartColors.js`); all other UI chrome still uses the real DEWA theme.
- recharts 3.10.1's `Pie`/`Sector` needs literal hex color values, not CSS `var(...)` strings — its internal color math (hover lighten/darken) silently fails on unparseable color strings, while `Bar`/`Cell` fills tolerate `var()` fine. Chart colors are mode-aware JS functions (`lib/chartColors.js` + `lib/useChartMode.js`) rather than CSS custom properties.
- Found and fixed a real bug via DOM inspection (not just screenshots): recharts `Sector` returns `null` when `startAngle === endAngle`, which happened permanently for both Pie charts under headless-screenshot testing conditions. Root cause: `--virtual-time-budget` in headless Chrome does not reliably advance `requestAnimationFrame`-driven animations (confirmed the same symptom on `<Metric>`'s NumberFlow count-up and recharts' `Bar` entrance animation) — real browsers are unaffected. Fixed by setting `isAnimationActive={false}` on all chart marks, which also better matches DESIGN.md's "avoid bounce animations" guidance for a serious enterprise dashboard.
- `<Metric>` (NumberFlow) requires a numeric `value` — passing a string label (e.g. an agenticity level like `"L2"`) silently coerces to `0`. `KpiCard` now branches on `typeof value === 'number'`.

### Phase 2 — Step 4: Organization module (2026-08-01)

`data/organizationAggregates.ts` (fixes three seed gaps found during this step — `OrgNode.headcountHuman/headcountAgent` and `strategicObjectiveIds` were always `0`/`[]`, `Position.assignedAgentIds` was never backfilled — all now derived at read time, not hand-authored), `components/SidePanel.jsx` (the shared slide-in primitive CONVENTIONS.md required but that didn't exist yet), and the full `/organization` module: two `@xyflow/react` + dagre visualization modes (traditional org chart, AI-native workforce network with agent-supervision edges), five-dimension filters + search, a current/target agenticity toggle, and Section/Position side panels. The required Senior Business Analyst worked example (six activity rows at 70/40/10/95/100/0%, D2D Documentation Agent assignment) renders with no special-casing — it falls out of generic panel rendering over real seed data.

**Lessons**
- Design spec: `docs/superpowers/specs/2026-08-01-organization-module-design.md`. Implementation plan: `docs/superpowers/plans/2026-08-01-organization-module.md`.
- Discovered Steps 0–3 had been sitting entirely uncommitted in the working tree (only the raw `dak init` scaffold was in git history) — committed and pushed to `https://github.com/Suficodes/AI-Native-Framework.git` before starting Step 4.
- Found `KpiGrid.jsx` (Step 3) hardcodes `prefix="AED "` on two KPIs instead of using `<Aed>` — a CONVENTIONS.md violation that predates this step; left as-is (out of scope for Step 4) but flagged for a follow-up fix.

### Phase 2 — Step 5: Processes & Quality Procedures module (2026-08-01)

`data/processesAggregates.ts` (division/section name lookups, QP status/indicator breakdowns, overdue-review detection, agent/harness name lookups for process steps and QPs — same derive-don't-hardcode pattern as Steps 4's `organizationAggregates.ts`). Two tabs sharing one small `ProcessesTabs.jsx`: **Process Agenticity** (process register + a generic process-detail page rendering any process's step table — current/future owner, contribution split, automation level, control requirement, timing, quality/exceptions, assigned agent/harness, value opportunity — verified against the D2D process's real 14 steps) and **Quality Procedures** (QP register + a compliance dashboard reusing `KpiCard` + a generic QP-detail page covering every field in Section 6.B, including the "Agent Conversion" panel — instructions, workflow steps, guardrails, evaluation criteria, audit evidence). QP-01 (D2D Demand Intake & BRD Preparation) renders correctly with no special-casing, same principle as Step 4's worked example.

**Lessons**
- Astryx `Table` has no `onRowClick`/`hoverable` prop (`hasHover` is the real prop name) — row navigation is done via a clickable title cell (`renderCell` + `onClick` on the primary column), matching the `LinkRow` pattern already established in Step 4's side panels.
- No browser tool is available in this environment; verification here was `typecheck` + `vitest` + `build` (all clean) plus a `tsx`-run runtime check of every new `processesAggregates.ts` function against the real dataset (confirmed PROC-D2D's 14 steps, QP-01's agent/harness names, and the QP↔process join all resolve correctly). Manual browser click-through is still recommended before calling this fully verified.
