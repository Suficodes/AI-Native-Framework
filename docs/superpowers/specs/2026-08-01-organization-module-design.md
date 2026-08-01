# Organization Module — Design Spec

Status: approved · 2026-08-01 · Build Step 4 (see PROJECT.md step log)

## Context

Requirements doc Section 5 ("ORGANIZATION MODULE") calls this "a core part of the prototype." It needs:
enterprise hierarchy display (Enterprise → Division → Super Department → Department → Section →
Position → Human/Human+Agent/Agent-only), two visualization modes (traditional org chart, AI-native
organization network), expand/collapse, search, five filter dimensions, a Section side panel, a
Position side panel, and the named worked example (Senior Business Analyst — Human + D2D
Documentation Agent, with the six exact activity percentages: 70/40/10/95/100/0%).

Steps 0–3 are done: route shell + design tokens, the full mock data model (`data/types.ts`,
`data/seed/*.ts`, `data/mockApi.ts`), and Executive Overview. This step is the first to use
`@xyflow/react` + `@dagrejs/dagre` (both already installed per PROJECT.md's stack deviation note)
and the first to need a slide-in side panel (`components/SidePanel.jsx` didn't exist yet).

## Data gaps found and how this step fixes them

Audited `data/seed/organization.seed.ts`, `positions.seed.ts`, `agents.seed.ts`: three fields are
seeded but never populated:

- `OrgNode.headcountHuman` / `headcountAgent` — always `0`.
- `OrgNode.strategicObjectiveIds` — always `[]`.
- `Position.assignedAgentIds` — always `[]` (including on `POS-BA-D2D-01`, the worked example).

Per CONVENTIONS.md ("Formulas live once in `lib/calc.ts`... never hand-compute/hardcode a result a
formula could produce") and the precedent set by `data/executiveAggregates.ts`, these are fixed by
**deriving them at read time**, not by hand-authoring values into the seed files or mutating seed
output. New module: `data/organizationAggregates.ts`.

## 1. `data/organizationAggregates.ts`

Pure functions over `dataset` (from `mockApi.ts`), synchronous (data is already in memory), no
mutation of seed objects:

- `buildOrgIndex()` — one pass building `childrenByParentId`, `nodesById`, `positionsBySectionId`,
  `employeesBySectionId`, `agentsBySectionId` (agents matched via `agent.orgAssignment.sectionId`).
- `headcountRollup(nodeId)` → `{ human, agent }`, recursively summed from positions/employees/agents
  under that subtree.
- `strategicObjectivesForSection(sectionId)` → section's owned `Process`es (`ownerSectionId`) →
  their `AIInitiative`s (`relatedProcessId`) → `strategicObjectiveId`, deduped; rolled up to every
  ancestor node.
- `agenticityForSection(sectionId, mode: 'current' | 'target')` → average of owned processes'
  `currentAgenticity` / `targetAgenticity` (numeric L0–L6 index, rounded to nearest level for
  display).
- `aiCoverageForSection(sectionId)` → weighted average of `position.aiWorkCoveragePct` across the
  section's positions.
- `realizedValueForSection(sectionId)` → sum of `VRRecord.netBenefit` where the VR's
  `aiInitiative.sectionId` matches (joined through `aiInitiatives`).
- `tokenCostForSection(sectionId)` → sum of `TokenUsageRecord.cost` for agents whose
  `orgAssignment.sectionId` matches.
- `agentsForPosition(positionId)` → `agents.filter(a => a.orgAssignment.positionId === positionId)`.
- `performanceStatusForPosition(positionId)` → latest `AgentPerformanceRecord.result` for any agent
  from `agentsForPosition`; `'N/A'` for positions with no assigned agent.

## 2. `components/SidePanel.jsx` (new shared primitive)

Referenced by CONVENTIONS.md ("No modals for primary content — use `components/SidePanel.jsx`
(slide-in)") but not yet built. Fixed-position panel sliding in from the right, backdrop + Escape +
backdrop-click to close, `usePresence` (from `dewa/usePresence.js`) for the exit animation so it
matches the rest of the app's motion language. Props: `isOpen`, `onClose`, `eyebrow`, `title`,
`width`, `children`. This is the first consumer; every later module's side panel reuses it.

## 3. Two visualization modes

Both `@xyflow/react` + `@dagrejs/dagre` — CONVENTIONS.md explicitly lists "org chart" as a
node-link-graph use case, not a plain tree list.

**Mode A — Traditional org chart.** Full Enterprise → Division → Super Department → Department →
Section → Position hierarchy. Dagre top-down (`TB`) layout. Expand/collapse per node — a
`collapsedIds` Set in component state; a node's descendants are excluded from the nodes/edges arrays
passed to React Flow when its ancestor is collapsed, and dagre re-lays-out on every toggle. Default
state: Divisions expanded, everything below collapsed (first paint ≈ 1 + 4 + 8 = 13 nodes, not 100+).
Each node shows name, level, a human-count / agent-count badge pair, and a workforce-type icon.

**Mode B — AI-native organization network.** Flattened to Section + Position (the four upper tiers
add hierarchy noise without adding to the "workforce network" story). Same dagre `TB` layout. Adds
dashed "supervises" edges from each agent to its manager's position (via
`agent.managerEmployeeId` → that employee's `positionId`). Nodes colored by `workforceTypeColor()`
from `lib/chartColors.js` (already validated against the dataviz skill's palette rules in Step 3 —
reused here, not reinvented).

## 4. Filters + search

Astryx `Selector` (single-value, `hasClear`) for each of: division, workforce type, agenticity
level, performance status, strategic objective. Astryx `TextInput` for name search (matches org node
names and position/employee names). A position passes the filter set if it matches every active
filter (AND). Non-matching nodes are **dimmed to ~40% opacity, not removed** — keeps the dagre layout
and tree shape stable across filter changes instead of causing jarring re-layout jumps. Search
auto-expands the ancestor chain of any match in Mode A.

## 5. Current-state vs target-state toggle

Per the approved recommendation: relabels agenticity badges only. Structure, node count, and edges
never change between the two states. The toggle swaps which number `agenticityForSection(...,
'current' | 'target')` feeds into the badge color/label. This is fully derived from the real
`Process.currentAgenticity` / `targetAgenticity` fields already in the seed — no simulated or
fabricated org reshaping.

## 6. Side panels

**Section panel** (click a Section-level node): mandate, section manager, employee count, agent
count, areas of activity, Quality Procedures, processes, AI initiatives, AI coverage, process
agenticity, realized value, token cost, strategic objective contribution — all via
`organizationAggregates.ts`, each value-bearing figure tagged with `<ValueTag>`.

**Position panel** (click a Position-level node): title, job description, key responsibilities,
activities, competencies, assigned employee, assigned Copilot/agents (via `agentsForPosition`), AI
work-coverage %, human contribution, agent contribution, quality-adjusted AI coverage, verified
capacity released, performance KPIs, related processes, related Quality Procedures.

No special-casing for the worked example. `POS-BA-D2D-01`'s job description already carries the six
activity rows with the exact percentages (70/40/10/95/100/0%) from `positions.seed.ts`, and
`agentsForPosition('POS-BA-D2D-01')` naturally returns `AGT-D2D-DOC-01`. The generic Position panel
renders both correctly because the underlying data is already exactly right — this is the deliberate
outcome of fixing the data gaps in section 0 rather than hardcoding the example into the UI.

## 7. Routing

`router.jsx`: `{ path: "organization", element: coming(...) }` → `{ path: "organization", element:
<Organization /> }`. No new sub-routes — panels are in-page state (open/close via component state,
not navigation), consistent with the "no modals, slide-in panel" house rule.

## 8. Files

```
frontend/src/
├── components/
│   └── SidePanel.jsx                       (new — shared primitive)
├── data/
│   └── organizationAggregates.ts           (new)
└── pages/organization/
    ├── Organization.jsx                     (new — route entry, toolbar, mode switch)
    ├── OrgFilters.jsx                        (new — filter bar)
    ├── OrgChart.jsx                          (new — Mode A)
    ├── OrgNetworkGraph.jsx                   (new — Mode B)
    ├── OrgFlowNode.jsx                       (new — shared custom React Flow node renderer)
    ├── orgLayout.ts                          (new — dagre layout helper, shared by both modes)
    ├── SectionPanel.jsx                      (new)
    └── PositionPanel.jsx                     (new)
```

## 9. Testing

- `data/organizationAggregates.ts`: vitest spec verifying headcount rollup at the Enterprise node
  equals the known totals (40 employees / 15 agents per Section 21), zero orphan strategic-objective
  references, and `agentsForPosition('POS-BA-D2D-01')` returns exactly `['AGT-D2D-DOC-01']`.
- Manual: `npm run dev`, `/organization` — toggle Mode A/B, expand/collapse, search "Senior Business
  Analyst," open its Position panel and confirm the six activity rows match 70/40/10/95/100/0%
  exactly, exercise all five filters, toggle current/target, check both light and dark mode.

## Open item resolved during review

Mode B's "supervises" edges use `agent.managerEmployeeId` → that employee's position. Section
membership alone still determines node placement/grouping, so the network reads correctly even
where `employee.managerId` chains are sparse in the current seed.
