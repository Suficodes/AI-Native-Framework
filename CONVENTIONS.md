# CONVENTIONS — ai-native-control-tower

> Claude reads this before any work. Keep it short, specific, and current. This isn't `PROJECT.md` (which is narrative history); this is the project's style rulebook.

## Project identity & status

- `.dak/project.json` holds the project's **immutable identity** (UUID, ports, scaffold version), written once at `dak init`. Don't edit it.
- `PROJECT.md` **front-matter** holds the **editable intent**. Keep `goal`, `domain`, `audience` filled (one line each), and update `status` at phase boundaries (`building` → `live` → `paused`/`archived`).

## Stack (see PROJECT.md "Stack deviations" for the full rationale)

- **Frontend only.** React 19 + Vite + `react-router-dom` (`createHashRouter`) + `@astryxdesign/core` (Astryx, `dewa` theme). No backend, no database, no Docker for this phase — all data comes from `frontend/src/data/mockApi.ts`.
- UI components stay `.jsx` (matches the existing Astryx template pattern). The **data/logic layer is TypeScript** (`.ts`): `data/types.ts`, `data/seed/*.ts`, `data/mockApi.ts`, `lib/calc.ts`. Run `npm run typecheck` (`tsc --noEmit`) before calling any data-layer change done.
- Charts: `recharts`. Node-link graphs (org chart, harness designer, Enterprise Map): `@xyflow/react`, layout via a hand-written tree function (org chart) or `@dagrejs/dagre` (anything with cross-cutting edges).

## Naming

- **React components:** `PascalCase.jsx` (e.g. `KpiCard.jsx`)
- **Hooks:** `useX.js` (e.g. `useMockData.js`)
- **TS data/logic modules:** `camelCase.ts` (e.g. `mockApi.ts`, `calc.ts`) or `PascalCase.ts` for pure type files (`types.ts` is the one exception, kept lowercase by convention)
- **Route paths:** kebab-case, nouns (`/ai-initiatives`, `/harness-engineering`, `/value-realization`)
- **CSS classes:** `kebab-case`, no BEM (rely on scoped styles / Astryx tokens)
- **Mock entity IDs:** stable, human-readable prefixes — `DIV-`, `SD-`, `DPT-`, `SEC-`, `POS-`, `EMP-`, `AGT-`, `PROC-`, `QP-`, `INIT-`, `HAR-`, `DEM-`, `VR-`, `SO-`, `EC-`, `ROOM-`, `ROLE-`, `TX-`, `SKILL-`, `LES-`. The two required worked examples use **fixed, memorable IDs** rather than sequential ones: `POS-BA-D2D-01` (Senior Business Analyst), `AGT-D2D-DOC-01` / `HAR-D2D-BRD-01` (D2D Documentation Agent + its harness), `PROC-D2D` (the 14-step D2D process).

## File structure

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── app/
│   │   │   ├── App.jsx          # AppShell + SideNav (16 modules + Administration)
│   │   │   └── router.jsx       # createHashRouter — full route table
│   │   ├── data/                 # TypeScript data/logic layer
│   │   │   ├── types.ts          # every entity interface
│   │   │   ├── ids.ts
│   │   │   ├── rng.ts            # seeded PRNG, no faker dependency
│   │   │   ├── seed/*.ts         # one file per entity, strict FK dependency order
│   │   │   └── mockApi.ts        # getOrganization(), getAgents(), etc.
│   │   ├── lib/
│   │   │   ├── calc.ts           # the doc's formulas, implemented once
│   │   │   └── theme.js          # light/dark mode (existing)
│   │   ├── components/           # shared domain components (KpiCard, AgenticityChip, SidePanel, Timeline, graph node types, ...)
│   │   ├── pages/                # one folder per module, route-level pages
│   │   ├── dewa/                 # Astryx theme + this project's DESIGN.md token overrides
│   │   └── styles/
│   ├── public/
│   │   ├── vibe-stats.json       # auto-updated
│   │   ├── journey-data.json     # Claude-updated after significant work
│   │   └── tech-stack.json       # auto-updated
│   └── vite.config.js
├── .gitignore
├── PROJECT.md              # narrative history
├── CONVENTIONS.md          # this file
└── README.md               # setup, architecture, Neptune mapping, deliverables (Section 26 of the requirements doc)
```

## Soft file size caps

See `~/.claude/CLAUDE.md`. Summary:
- Function: 50 lines · React component (JSX): 250 · composable/util module: 200 · aggregator (`router.jsx`): 200 · test: 500.
- `data/seed/*.ts` files are an explicit exception (data, not logic) — allowed to run longer if one entity's realistic sample set genuinely needs it; split by entity, never by arbitrary line count.

## Testing

- **Frontend:** `vitest` in `frontend/src/**/__tests__/` or `*.spec.js` adjacent. Every new module needs a golden-path test at minimum (e.g., `calc.ts`'s formulas must have unit tests reproducing the doc's own sample results: 85% / 38% / 32% / 1,200h / 850h).

## Money

All money displayed to users uses `<Aed>` from `frontend/src/dewa/Aed.jsx`. Never hardcode `$` or `"AED"` strings.

## Data layer (mock, not a real DB)

- `data/seed/*.ts` run in **strict dependency order** (org → positions → employees → agents → processes → QPs → initiatives → harnesses → D2D → copilot/work-contribution → performance → VR → token/observability → strategic) sharing one in-memory ID registry — every foreign key must resolve to a real generated record. No dangling references.
- `mockApi.ts` wraps every collection in an artificial delay (150–400ms) so components genuinely exercise loading states, not just static renders.
- Formulas live once in `lib/calc.ts` and are imported everywhere a number is displayed — never hand-compute/hardcode a result that a formula could produce.

## Commits

- Conventional-commit style: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- One logical change per commit. Reviewer shouldn't have to untangle two features from one diff.
- Commit message explains the *why*, not the *what* (the diff shows what).

## Conventions specific to this project

- **Every button** imports `dewa/DewaButton.jsx`, never the raw Astryx `Button` (Astryx's `Button` has no 48px pill size — DEWA's `DESIGN.md` requires one on every button; `DewaButton` is the wrapper that enforces it).
- **Every important value** (benefit, cost, coverage %, capacity released, etc.) is tagged `Estimated | Observed | Verified | Validated` via `dewa/ValueTag.jsx` (a DEWA-brand primitive, alongside `Aed.jsx`/`Metric.jsx` — not an app-domain component) — this is a hard requirement from the spec's UX section, not optional polish.
- **The Enterprise Map (`/enterprise-map`) is one shared graph dataset + a pure `applyLens(lens, graph)` function per lens** — never build a lens as its own independent screen/dataset. This is the single most important architectural rule in the whole app; breaking it turns 10 lenses into 10 diverging, inconsistent implementations.
- **The AI Playbook (`/ai-playbook`) follows the same rule in its own shape:** one `resolvePlaybookScope(type, id)` → one `PlaybookScope` (a set of entity IDs) → one `buildPlaybook(scope)` deriving all 15 sections. Nine scope dimensions, one code path — never a per-scope screen and never per-scope content. Section copy that is genuinely enterprise doctrine (vision, principles, governance rules, sourcing criteria) lives in `data/seed/playbook.seed.ts`; everything numeric is derived for the active scope.
- **No modals for primary content** — use `components/SidePanel.jsx` (slide-in). `Dialog`/`AlertDialog` from Astryx are for confirmations only (e.g. "Approve this VR record?").
- RTL/Arabic is out of scope for this pass — DESIGN.md's Arabic tokens exist in the CSS but are unused. Don't build RTL-specific logic.
- Timezone: Asia/Dubai (for any date formatting).
