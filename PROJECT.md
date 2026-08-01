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

_2026-08-01_ — **10 of 16 modules real.** Done: Executive Overview, Organization, Processes & Quality Procedures, AI Initiatives, Agents, Harness Engineering, AI Playbook, D2D Integration, Copilot & Workforce, Administration. Remaining: Performance, Value Realization, Token Economics (Step 9); Observability, Strategic Alignment (Step 10); the final AI-Native Enterprise Map (Step 11); polish, accessibility, README and deliverables (Step 12).

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
- Corrected course from Step 4's note: a browser check **is** possible here — headless Chrome is installed (`/Applications/Google Chrome.app`), driven directly via `--headless=new --screenshot=... --virtual-time-budget=...`, no Playwright/Puppeteer needed. Screenshotted `/organization`, `/processes/agenticity`, `/processes/agenticity/PROC-D2D`, `/processes/quality-procedures`, and `/processes/quality-procedures/QP-01` — all render correctly.
- The QP register screenshot caught a real seed-data bug invisible to typecheck/tests: `qualityProcedures.seed.ts` hardcodes `id: 'QP-01'` for the D2D worked example, then a loop calls `nextQpId()` for the rest — but since the hardcoded push never advanced the `QP` counter, the loop's first iteration also produced `'QP-01'`, colliding with the hand-authored record (and silently producing only 14 unique QP IDs instead of Section 21's required 15). Fixed by burning one `nextQpId()` call right after the hardcoded push. Re-verified: 15 unique QP IDs, all other entity collections (processes, positions, employees, agents, initiatives, harnesses, demands, orgNodes) already collision-free.

### Phase 2 — Step 6: AI Initiatives + Agent module (2026-08-01)

Added `Agent.purpose` (a real data-model gap — the doc's worked example needs a purpose statement and the type had nowhere to put one — seeded for all 15 agents, exact wording for AGT-D2D-DOC-01 from Section 8), `data/lookups.ts` (generic cross-module ID→name lookups: employee/process/QP/strategic-objective/excellence-criterion/D2D-demand), and `data/agentsAggregates.ts` (process/QP assignment derived as a union of the agent's own field *and* real ProcessStep/QP references, since only 4 of 15 agents have the field populated — plus harness, performance, token usage, value, budget, incidents, and run/trace history joins). **AI Initiatives**: portfolio table + hand-rolled Kanban board (no Astryx Kanban component) across the 11 delivery stages, all 8 named sample initiatives present, generic detail page. **Agents**: the Digital Employee Registry + a 9-tab Agent Profile page (Overview, Digital Job Description, Process Assignments, Harnesses, Performance, Token Usage, Value, Risk & Compliance, Audit History), each tab its own small component. AGT-D2D-DOC-01 renders its full reporting chain (Manager → IT Lead, Business Owner → DBE Manager, Technical Owner → AI Platform Team, Risk Owner → Information Security) with no special-casing.

**Lessons**
- Installed `puppeteer-core` in the scratchpad (pointed at the same local Chrome, no browser download) to click through all 9 profile tabs and the Kanban toggle programmatically — screenshot-only verification can't reach content gated behind client-side tab/view state. Caught two real rendering bugs this way that typecheck/build/vitest all missed: (1) `DigitalJobDescriptionTab.jsx` had label/value `<Text>` pairs rendering run-together on one line ("Digital job titleD2D Intake and BRD Agent") — same root cause repeated in `RiskComplianceTab.jsx`'s "Incidents" header. (2) `HarnessesTab.jsx` displayed `confidenceThreshold` (stored as a 0–1 fraction) as a raw percentage — "0.85%" instead of "85%".
- Grepped every new file afterward for the same label+value adjacency pattern to confirm no other instance existed before calling the step done — screenshot verification should be paired with a pattern search once a bug class is found, not just a fix-and-move-on. **Correction from Step 7:** the `DigitalJobDescriptionTab.jsx`/`RiskComplianceTab.jsx` grep-fix pass only *partially* worked — wrapping label+value pairs in a plain `<div>` does nothing, since Astryx `Text` defaults to `display: 'inline'` (confirmed by reading the component source, `Text/Text.tsx`) and a non-flex `<div>` doesn't blockify inline children. `RiskComplianceTab.jsx` happened to render correctly because I'd also added `style={{ display: 'block' }}` there; `DigitalJobDescriptionTab.jsx` did not get that and was still broken — caught only by re-inspecting the "fixed" screenshot pixel-by-pixel in Step 7 rather than trusting the earlier pass. Real fix: `style={{ display: 'block' }}` on the label (inline `style` beats Astryx's StyleX class in the cascade), OR ensure the next sibling is itself a block/flex element (`VStack`/`HStack`) — a block-level next-sibling always forces the break regardless of the first element's own display value. Two adjacent inline `<Text>`s inside a `display:'flex'` parent are fine as-is (flex blockifies direct children) — confirmed safe in `TokenUsageTab.jsx` and `AgentFormula.jsx`, left unchanged.

### Phase 2 — Step 7: Harness Engineering module (2026-08-01)

The "Agent = Model + Instructions + Context + Knowledge + Tools + Workflow + Guardrails + Evaluations + Human checkpoints + Observability + Cost controls" formula explainer (`AgentFormula.jsx`) plus the Harness Registry table. The visual Harness Designer reuses `pages/organization/orgLayout.ts`'s dagre helper with `direction: 'LR'` instead of `'TB'` — the exact reuse that file's Step 4 comment anticipated — for the 11-block left-to-right workflow (Trigger → ... → Value update), each block clickable to open its configuration in a `SidePanel` (rendered generically from `HarnessBlock.config`, a free-form `Record<string, string | string[]>`, since shape varies per block type). Deployment-gate progress row (7 gates), evaluation suite as `ProgressBar`s (9 criteria, color-coded by score), and release history. HAR-D2D-BRD-01 (all 10 guardrails, 9 evaluation criteria) renders through the same generic page as the other 14 harnesses.

**Lessons**
- A `npm run build` failure (missing export) caught an import mistake `tsc --noEmit` completely missed: `processName` is defined in `data/lookups.ts`, not `data/processesAggregates.ts`, but two new files imported it from the wrong module. `checkJs: false` in `tsconfig.json` means `.jsx` files aren't type-checked, so a bad named import from a `.ts` module into a `.jsx` file only surfaces at bundle time — `npm run build` is not a redundant step after `npm run typecheck`, they catch different bugs.
- Went back and re-audited Steps 4–6's already-shipped side panels for the Step 6 inline-`Text` bug class (see above) rather than assuming "similar code, probably fine" — clicked open Organization's Section and Position panels for the first time (never actually visually verified in Step 4) via the same puppeteer approach. Both were already correct (they lean on `MetadataList`/`VStack` rather than raw adjacent `Text` pairs), but this should have been checked when Step 4 shipped, not three steps later.

### Phase 2 — Step 8: D2D Integration + Copilot & Workforce module (2026-08-01)

**D2D Integration**: the 12-stage journey (Business need → ... → Playbook update) as a live per-stage demand-count strip (`D2DJourneyStages.jsx`) + demand register, and a generic demand-detail page with delivery milestones and the contribution timeline (Human/Copilot/Agent/Human-approval actor badges). **Copilot & Workforce**: the three concepts the doc requires kept visibly separate — AI adoption (Copilot usage KPIs + per-division table), AI work contribution (the doc's exact formulas, reused from `lib/calc.ts` rather than recomputed, via new `data/copilotAggregates.ts`), and AI business value (explicitly *not* fabricated here — a pointer to Value Realization, since that's where the real benefit/cost data lives) — plus the required disclaimer banner verbatim and the full Work Contribution Ledger.

**Lessons**
- Made the *exact same* wrong-module import mistake as Step 7 (`processName` from `processesAggregates.ts` instead of `lookups.ts`) in `D2DDemandDetail.jsx`, caught the same way: `npm run build` failed, `typecheck` didn't. This is now a known personal failure mode for this session — worth grepping for after writing any file that imports cross-module lookups, not just relying on the build to catch it after the fact.
- Found a much bigger, systemic version of the Step 6/7 spacing bug: `HStack`'s `justify` prop takes `'between'`, not the CSS-style `'space-between'` I'd been writing everywhere — an invalid value that silently no-ops (again invisible to `tsc` because `.jsx` isn't checked). This wasn't confined to Step 8's new files: it had been present since **Step 3** in `components/KpiCard.jsx` (every KPI card's label/info-icon row) and `pages/executive-overview/AttentionPanel.jsx` (every attention-panel row), plus `PositionPanel.jsx` (Step 4) and `ProcessDetail.jsx` (Step 5) — 6 files, 8 occurrences total, fixed in one pass (`grep -rl` + `sed`) and reverified in the browser across Executive Overview, Organization, Processes, Harness Engineering, and D2D. None of this was caught earlier because Steps 3–5 shipped before browser verification became part of the routine (Step 6 onward) — a concrete argument for why "click through the actual page" needs to happen on the step that introduces a component, not deferred.

### Phase 2 — AI Playbook module (2026-08-01)

The module the original 12-step plan skipped: every other nav item had a step, this one didn't. Requirements doc Section 10 — a **living** playbook, explicitly "not a static document", showing guidance filtered by division / department / section / job / process / Quality Procedure / agent / strategic objective.

Built on the same architectural rule as the Enterprise Map, in its own shape: **one scope resolver → one `PlaybookScope` (a set of entity IDs) → one `buildPlaybook(scope)` deriving all 15 sections**. Nine scope dimensions (the doc's eight plus the enterprise root the picker defaults to) run through one code path; there is no per-scope screen and no per-scope content. `data/playbookScope.ts` resolves the scope, `playbookGuidance.ts` derives sections 1–5, `playbookRecommendations.ts` sections 6–8 (the only section with real decision logic — the doc's ten required fields per recommendation, plus a buy/configure/build rule), `playbookGovernance.ts` sections 9–12, `playbookAggregates.ts` sections 13–15 and the assembler. The only seeded inputs are the two entities the model genuinely lacked — `ReusableSkill` (Section 10.15, also the "Skill" level of the Section 15 token hierarchy) and `PlaybookLesson` — plus the narrative constants that are enterprise doctrine regardless of scope. UI: a sticky 15-section rail, a URL-driven scope picker (`/ai-playbook/:scopeType/:scopeId`, so a scoped playbook is shareable), and 15 small section components driven by one registry so the rail and the body cannot drift. `/ai-playbook/example/d2d` renders the required department worked example through the identical builder, with only a banner to say so.

**Lessons**

- Verified by clicking through all nine scope dimensions plus the example and a bad-ID route in a real browser, not just the two happy paths. Four defects that typecheck, build and vitest all passed:
  1. **A React key collision from duplicate derived content** — two unresolved incidents shared a title, so two identical `openRisks` lines collided. Fixed at the source (the risk list is a `Set`) rather than only in the key. The same screenshot showed the related content bug: a *warning* banner reading "1 item require attention" wrapped around the sentence "No open governance risks recorded" — a sentinel string standing in for an empty list. `openRisks` is now genuinely empty when clean and the section renders a positive state.
  2. **Astryx's CSS reset strips list markers**, so every `<ul>`/`<ol>` of guidance rendered as unmarked lines — invisible in code review, obvious in a screenshot. `list-style` is now declared explicitly in `GuidanceList`.
  3. **`${label}s` pluralization** produced "20 processs" and "15 harnesss" in the scope summary. Singular and plural are now spelled out per noun.
  4. **A real seed-data calibration bug the playbook exposed by putting two numbers side by side for the first time:** `buildBudgetControls` drew annual budgets from a hand-picked 50k–300k range while token `cost` is computed from realistic per-million-token pricing — two orders of magnitude apart, so *every* budget-utilization figure in the app rounded to 0%. Budgets are now derived from each agent's own recorded consumption (four quarters plus 25–80% headroom). This is the same class of bug as Step 5's QP-01 ID collision: only visible once something rendered it.
- **Known issue for Step 9 (Token Economics), deliberately not fixed here:** the token-usage seed draws every level's volumes from one 5K–8M range, so the Enterprise → Division → Department → Process → Agent → Harness → Skill → Model → Transaction hierarchy does not nest (a Transaction row can exceed the Enterprise row) and the absolute scale is low for a DEWA-sized programme. Fixing the nesting is precisely Step 9's job and would move numbers already verified in Executive Overview and the Agents module, so it belongs there rather than in a drive-by edit from this module.
- Three data modules run slightly over the 200-line cap (215/218/227). Each has one responsibility and a documented escape-hatch comment; the natural split points would have separated helpers from their only callers.
