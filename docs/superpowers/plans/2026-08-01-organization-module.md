# Organization Module (Build Step 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Organization module at `/organization` — a traditional org chart and an AI-native workforce network (both `@xyflow/react` + dagre), five-dimension filters, search, a current/target agenticity toggle, and Section/Position side panels — replacing the `ComingSoon` stub.

**Architecture:** A new `data/organizationAggregates.ts` derives everything the seed data left at `0`/`[]` (headcount rollup, strategic-objective rollup, position→agent linkage) via pure functions over the existing `dataset`, mirroring `data/executiveAggregates.ts`. Two `@xyflow/react` graphs (Mode A: full hierarchy; Mode B: Section+Position network with agent-supervision edges) share one dagre layout helper and one set of custom node renderers. A new shared `components/SidePanel.jsx` (referenced by CONVENTIONS.md but never built) hosts the Section and Position detail panels.

**Tech Stack:** React 19, `@xyflow/react` 12.11, `@dagrejs/dagre` 1.1, `@astryxdesign/core` (Selector, TextInput, SegmentedControl, MetadataList, Badge, Card, VStack/HStack, IconButton), TypeScript data layer, vitest.

## Global Constraints

- UI components stay `.jsx`; data/logic modules stay `.ts` (CONVENTIONS.md).
- Every button is `dewa/DewaButton.jsx` — never the raw Astryx `Button`. (This module doesn't need a button; if one is added later, use `DewaButton`.)
- Every important value (benefit, cost, coverage %, capacity released) is tagged `Estimated | Observed | Verified | Validated` via `dewa/ValueTag.jsx`.
- Money uses `<Aed usd={...} />` from `dewa/Aed.jsx` — never hardcode `$` or `"AED"`.
- No modals for primary content — `components/SidePanel.jsx` (slide-in), not `Dialog`.
- Formulas/derivations live once in `data/organizationAggregates.ts` (or `lib/calc.ts` for generic formulas) and are imported everywhere — never hand-computed inline in a component.
- `npm run typecheck` (`tsc --noEmit`) must pass before any data-layer task is called done.
- This project has no lint script configured (`frontend/package.json` has no `lint` entry, no eslint/oxlint config) — the finish-line checklist's lint step is satisfied by `npm run typecheck` + `npm run build` instead; don't add a lint tool as part of this feature.
- Test convention actually in force in this codebase (not the generic strict-TDD default): automated `vitest` specs cover the **data/logic layer** (`organizationAggregates.ts`, `orgLayout.ts`) — real failing-test-first TDD, per CONVENTIONS.md's "Testing" section. JSX/UI components are verified via `npm run typecheck`, `npm run build`, and a manual browser pass (this matches how Step 3 / Executive Overview was actually built — no per-chart component test files exist in this repo). Follow this split; don't invent a component-testing setup that doesn't otherwise exist here.
- Reuse, don't reinvent: `lib/chartColors.js`'s `workforceTypeColor()` (already validated against the dataviz skill in Step 3) is the node-coloring source for both graph modes — don't add a second color mapping.
- `dataset` (the synchronous export from `data/mockApi.ts`) is safe to import directly at module scope in `.jsx`/`.ts` files that need synchronous lookups — this is the established pattern (`components/RoleSwitcher.jsx` imports `data/roles.ts` directly). Never import `data/seed/*` or `data/dataset.ts` directly.

---

### Task 1: `data/organizationAggregates.ts` — the derived data layer

**Files:**
- Create: `frontend/src/data/organizationAggregates.ts`
- Create: `frontend/src/data/organizationAggregates.spec.ts`

**Interfaces:**
- Consumes: `dataset` from `./mockApi` (already built `Dataset` object — `orgNodes`, `positions`, `employees`, `agents`, `processes`, `qualityProcedures`, `aiInitiatives`, `vrRecords`, `tokenUsage`, `agentPerformance`, `strategicObjectives`), types from `./types` (`ID`, `OrgNode`, `Position`, `Employee`, `Agent`, `AgenticityLevel`, `AGENTICITY_ORDER`).
- Produces (used by Tasks 6–9):
  - `buildOrgIndex(): OrgIndex` where `OrgIndex = { nodesById: Record<ID, OrgNode>; childrenByParentId: Record<ID, ID[]>; positionsBySectionId: Record<ID, Position[]>; employeesBySectionId: Record<ID, Employee[]>; agentsBySectionId: Record<ID, Agent[]> }`
  - `headcountRollup(nodeId: ID): { human: number; agent: number }`
  - `strategicObjectivesForSection(sectionId: ID): ID[]`
  - `agenticityForSection(sectionId: ID, mode: 'current' | 'target'): AgenticityLevel | null`
  - `aiCoverageForSection(sectionId: ID): number`
  - `processesForSection(sectionId: ID): Process[]`
  - `qualityProceduresForSection(sectionId: ID): QualityProcedure[]`
  - `aiInitiativesForSection(sectionId: ID): AIInitiative[]`
  - `realizedValueForSection(sectionId: ID): number`
  - `tokenCostForSection(sectionId: ID): number`
  - `agentsForPosition(positionId: ID): Agent[]`
  - `performanceStatusForPosition(positionId: ID): AgentPerformanceResult | 'N/A'`
  - `positionSummary(positionId: ID): { employeeName: string | null; agentCount: number }`
  - `relatedProcessesForPosition(positionId: ID): Process[]`
  - `relatedQpsForPosition(positionId: ID): QualityProcedure[]`
  - `sectionManager(sectionId: ID): Employee | undefined`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/data/organizationAggregates.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import {
  headcountRollup, strategicObjectivesForSection, agentsForPosition,
  performanceStatusForPosition, agenticityForSection, tokenCostForSection,
  realizedValueForSection,
} from './organizationAggregates'

describe('organizationAggregates', () => {
  it('rolls up headcount at the enterprise root to the full dataset totals', () => {
    const root = dataset.orgNodes.find((n) => n.level === 'Enterprise')!
    const counts = headcountRollup(root.id)
    expect(counts.human).toBe(dataset.employees.length)
    expect(counts.agent).toBe(dataset.agents.length)
  })

  it('returns no dangling strategic objective references', () => {
    const validIds = new Set(dataset.strategicObjectives.map((o) => o.id))
    for (const section of dataset.orgNodes.filter((n) => n.level === 'Section')) {
      for (const objId of strategicObjectivesForSection(section.id)) {
        expect(validIds.has(objId)).toBe(true)
      }
    }
  })

  it('finds the D2D Documentation Agent for the Senior Business Analyst worked example', () => {
    const agents = agentsForPosition('POS-BA-D2D-01')
    expect(agents.map((a) => a.id)).toEqual(['AGT-D2D-DOC-01'])
  })

  it('derives a performance status for a position with an assigned agent, and N/A without one', () => {
    expect(performanceStatusForPosition('POS-BA-D2D-01')).not.toBe('N/A')
    const humanOnly = dataset.positions.find(
      (p) => p.workforceType === 'Human' && agentsForPosition(p.id).length === 0,
    )!
    expect(performanceStatusForPosition(humanOnly.id)).toBe('N/A')
  })

  it('agenticityForSection returns a valid AgenticityLevel for a section that owns processes', () => {
    const d2dSection = dataset.orgNodes.find((n) => n.name === 'Demand-to-Delivery Section')!
    const level = agenticityForSection(d2dSection.id, 'current')
    expect(level).not.toBeNull()
    expect(['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']).toContain(level)
  })

  it('token cost and realized value roll up to non-negative numbers for the D2D section', () => {
    const d2dSection = dataset.orgNodes.find((n) => n.name === 'Demand-to-Delivery Section')!
    expect(tokenCostForSection(d2dSection.id)).toBeGreaterThanOrEqual(0)
    expect(realizedValueForSection(d2dSection.id)).not.toBeNaN()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/data/organizationAggregates.spec.ts`
Expected: FAIL — `Cannot find module './organizationAggregates'` (the module doesn't exist yet).

- [ ] **Step 3: Implement `organizationAggregates.ts`**

Create `frontend/src/data/organizationAggregates.ts`:

```typescript
// Derived Organization-module data. The seed layer leaves OrgNode.headcountHuman/
// headcountAgent at 0, OrgNode.strategicObjectiveIds at [], and
// Position.assignedAgentIds at [] (never backfilled — see the 2026-08-01
// Organization module design spec). Per CONVENTIONS.md ("Formulas live once...
// never hand-compute/hardcode a result a formula could produce"), this module
// derives them at read time from real foreign keys instead — mirrors the
// data/executiveAggregates.ts pattern from Step 3.
import { dataset } from './mockApi'
import type {
  ID, OrgNode, Position, Employee, Agent, Process, QualityProcedure, AIInitiative,
  AgenticityLevel, AgentPerformanceResult,
} from './types'
import { AGENTICITY_ORDER } from './types'

export interface OrgIndex {
  nodesById: Record<ID, OrgNode>
  childrenByParentId: Record<ID, ID[]>
  positionsBySectionId: Record<ID, Position[]>
  employeesBySectionId: Record<ID, Employee[]>
  agentsBySectionId: Record<ID, Agent[]>
}

let cachedIndex: OrgIndex | null = null

export function buildOrgIndex(): OrgIndex {
  if (cachedIndex) return cachedIndex
  const nodesById: Record<ID, OrgNode> = {}
  const childrenByParentId: Record<ID, ID[]> = {}
  for (const node of dataset.orgNodes) {
    nodesById[node.id] = node
    if (node.parentId) (childrenByParentId[node.parentId] ??= []).push(node.id)
  }
  const positionsBySectionId: Record<ID, Position[]> = {}
  for (const p of dataset.positions) (positionsBySectionId[p.sectionId] ??= []).push(p)
  const employeesBySectionId: Record<ID, Employee[]> = {}
  for (const e of dataset.employees) (employeesBySectionId[e.sectionId] ??= []).push(e)
  const agentsBySectionId: Record<ID, Agent[]> = {}
  for (const a of dataset.agents) (agentsBySectionId[a.orgAssignment.sectionId] ??= []).push(a)
  cachedIndex = { nodesById, childrenByParentId, positionsBySectionId, employeesBySectionId, agentsBySectionId }
  return cachedIndex
}

function descendantSectionIds(nodeId: ID, index: OrgIndex): ID[] {
  const node = index.nodesById[nodeId]
  if (!node) return []
  if (node.level === 'Section') return [nodeId]
  return (index.childrenByParentId[nodeId] ?? []).flatMap((childId) => descendantSectionIds(childId, index))
}

export function headcountRollup(nodeId: ID): { human: number; agent: number } {
  const index = buildOrgIndex()
  let human = 0
  let agent = 0
  for (const sectionId of descendantSectionIds(nodeId, index)) {
    human += (index.employeesBySectionId[sectionId] ?? []).length
    agent += (index.agentsBySectionId[sectionId] ?? []).length
  }
  return { human, agent }
}

export function processesForSection(sectionId: ID): Process[] {
  return dataset.processes.filter((p) => p.ownerSectionId === sectionId)
}

export function qualityProceduresForSection(sectionId: ID): QualityProcedure[] {
  return dataset.qualityProcedures.filter((q) => q.sectionOwnerId === sectionId)
}

export function aiInitiativesForSection(sectionId: ID): AIInitiative[] {
  return dataset.aiInitiatives.filter((i) => i.sectionId === sectionId)
}

export function strategicObjectivesForSection(sectionId: ID): ID[] {
  const processIds = new Set(processesForSection(sectionId).map((p) => p.id))
  const objectiveIds = new Set<ID>()
  for (const initiative of dataset.aiInitiatives) {
    const linkedToSection = initiative.sectionId === sectionId
      || (initiative.relatedProcessId != null && processIds.has(initiative.relatedProcessId))
    if (linkedToSection) objectiveIds.add(initiative.strategicObjectiveId)
  }
  return [...objectiveIds]
}

export function strategicObjectivesForNode(nodeId: ID): ID[] {
  const index = buildOrgIndex()
  const objectiveIds = new Set<ID>()
  for (const sectionId of descendantSectionIds(nodeId, index)) {
    for (const id of strategicObjectivesForSection(sectionId)) objectiveIds.add(id)
  }
  return [...objectiveIds]
}

function agenticityIndex(level: AgenticityLevel): number {
  return AGENTICITY_ORDER.indexOf(level)
}

export function agenticityForSection(sectionId: ID, mode: 'current' | 'target'): AgenticityLevel | null {
  const procs = processesForSection(sectionId)
  if (procs.length === 0) return null
  const key = mode === 'current' ? 'currentAgenticity' : 'targetAgenticity'
  const avg = procs.reduce((sum, p) => sum + agenticityIndex(p[key]), 0) / procs.length
  return AGENTICITY_ORDER[Math.round(avg)]
}

export function aiCoverageForSection(sectionId: ID): number {
  const positions = buildOrgIndex().positionsBySectionId[sectionId] ?? []
  if (positions.length === 0) return 0
  return positions.reduce((sum, p) => sum + p.aiWorkCoveragePct, 0) / positions.length
}

export function realizedValueForSection(sectionId: ID): number {
  const initiativeIds = new Set(aiInitiativesForSection(sectionId).map((i) => i.id))
  return dataset.vrRecords
    .filter((v) => initiativeIds.has(v.aiInitiativeId))
    .reduce((sum, v) => sum + v.netBenefit, 0)
}

export function tokenCostForSection(sectionId: ID): number {
  const agentIds = new Set((buildOrgIndex().agentsBySectionId[sectionId] ?? []).map((a) => a.id))
  return dataset.tokenUsage
    .filter((t) => t.level === 'Agent' && agentIds.has(t.refId))
    .reduce((sum, t) => sum + t.cost, 0)
}

export function agentsForPosition(positionId: ID): Agent[] {
  return dataset.agents.filter((a) => a.orgAssignment.positionId === positionId)
}

export function performanceStatusForPosition(positionId: ID): AgentPerformanceResult | 'N/A' {
  const agents = agentsForPosition(positionId)
  if (agents.length === 0) return 'N/A'
  const record = dataset.agentPerformance.find((r) => agents.some((a) => a.id === r.agentId))
  return record?.result ?? 'N/A'
}

export function positionSummary(positionId: ID): { employeeName: string | null; agentCount: number } {
  const position = dataset.positions.find((p) => p.id === positionId)
  const employee = position?.assignedEmployeeId
    ? dataset.employees.find((e) => e.id === position.assignedEmployeeId)
    : undefined
  return { employeeName: employee?.name ?? null, agentCount: agentsForPosition(positionId).length }
}

export function relatedProcessesForPosition(positionId: ID): Process[] {
  const position = dataset.positions.find((p) => p.id === positionId)
  if (!position) return []
  const fromAgents = agentsForPosition(positionId).flatMap((a) => a.assignedProcessIds)
  const fromSection = processesForSection(position.sectionId).map((p) => p.id)
  const ids = new Set([...fromAgents, ...fromSection])
  return dataset.processes.filter((p) => ids.has(p.id))
}

export function relatedQpsForPosition(positionId: ID): QualityProcedure[] {
  const position = dataset.positions.find((p) => p.id === positionId)
  if (!position) return []
  const fromAgents = agentsForPosition(positionId).flatMap((a) => a.assignedQpIds)
  const fromSection = qualityProceduresForSection(position.sectionId).map((q) => q.id)
  const ids = new Set([...fromAgents, ...fromSection])
  return dataset.qualityProcedures.filter((q) => ids.has(q.id))
}

export function sectionManager(sectionId: ID): Employee | undefined {
  const managerPosition = (buildOrgIndex().positionsBySectionId[sectionId] ?? [])
    .find((p) => p.title.endsWith('Manager'))
  if (!managerPosition?.assignedEmployeeId) return undefined
  return dataset.employees.find((e) => e.id === managerPosition.assignedEmployeeId)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/data/organizationAggregates.spec.ts`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/data/organizationAggregates.ts frontend/src/data/organizationAggregates.spec.ts
git commit -m "$(cat <<'EOF'
feat(organization): add derived org data layer

Fixes three seed gaps (OrgNode headcount/strategicObjectiveIds always
empty, Position.assignedAgentIds never backfilled) by deriving them at
read time from real foreign keys instead of hand-authoring or
mutating seed output.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `pages/organization/orgLayout.ts` — dagre layout helper

**Files:**
- Create: `frontend/src/pages/organization/orgLayout.ts`
- Create: `frontend/src/pages/organization/orgLayout.spec.ts`

**Interfaces:**
- Consumes: `@dagrejs/dagre` (already a dependency).
- Produces (used by Tasks 6 and 7):
  `layoutWithDagre(nodes: LayoutNode[], edges: LayoutEdge[], opts?: LayoutOptions): PositionedNode[]`
  where `LayoutNode = { id: string; width?: number; height?: number }`,
  `LayoutEdge = { id: string; source: string; target: string }`,
  `LayoutOptions = { direction?: 'TB' | 'LR'; nodeWidth?: number; nodeHeight?: number; rankSep?: number; nodeSep?: number }`,
  `PositionedNode = LayoutNode & { position: { x: number; y: number } }`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/organization/orgLayout.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { layoutWithDagre } from './orgLayout'

describe('layoutWithDagre', () => {
  it('lays out a 3-node top-to-bottom chain with strictly increasing y', () => {
    const nodes = [
      { id: 'a', width: 200, height: 80 },
      { id: 'b', width: 200, height: 80 },
      { id: 'c', width: 200, height: 80 },
    ]
    const edges = [
      { id: 'a-b', source: 'a', target: 'b' },
      { id: 'b-c', source: 'b', target: 'c' },
    ]
    const laidOut = layoutWithDagre(nodes, edges, { direction: 'TB' })
    const byId = Object.fromEntries(laidOut.map((n) => [n.id, n.position]))
    expect(byId.a.y).toBeLessThan(byId.b.y)
    expect(byId.b.y).toBeLessThan(byId.c.y)
  })

  it('gives siblings distinct x positions', () => {
    const nodes = [
      { id: 'root', width: 200, height: 80 },
      { id: 'left', width: 200, height: 80 },
      { id: 'right', width: 200, height: 80 },
    ]
    const edges = [
      { id: 'root-left', source: 'root', target: 'left' },
      { id: 'root-right', source: 'root', target: 'right' },
    ]
    const laidOut = layoutWithDagre(nodes, edges, { direction: 'TB' })
    const byId = Object.fromEntries(laidOut.map((n) => [n.id, n.position]))
    expect(byId.left.x).not.toBe(byId.right.x)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/organization/orgLayout.spec.ts`
Expected: FAIL — `Cannot find module './orgLayout'`.

- [ ] **Step 3: Implement `orgLayout.ts`**

Create `frontend/src/pages/organization/orgLayout.ts`:

```typescript
// Shared dagre auto-layout for both Organization graph modes (traditional
// chart, AI-native network) and, later, Harness Designer / Enterprise Map
// per CONVENTIONS.md ("Node-link graphs... @dagrejs/dagre for auto-layout
// where edges aren't a pure tree").
import dagre from '@dagrejs/dagre'

export interface LayoutNode {
  id: string
  width?: number
  height?: number
}

export interface LayoutEdge {
  id: string
  source: string
  target: string
}

export interface LayoutOptions {
  direction?: 'TB' | 'LR'
  nodeWidth?: number
  nodeHeight?: number
  rankSep?: number
  nodeSep?: number
}

export type PositionedNode<T extends LayoutNode = LayoutNode> = T & { position: { x: number; y: number } }

export function layoutWithDagre<T extends LayoutNode>(
  nodes: T[],
  edges: LayoutEdge[],
  opts: LayoutOptions = {},
): PositionedNode<T>[] {
  const { direction = 'TB', nodeWidth = 220, nodeHeight = 80, rankSep = 80, nodeSep = 32 } = opts
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep })

  for (const node of nodes) {
    graph.setNode(node.id, { width: node.width ?? nodeWidth, height: node.height ?? nodeHeight })
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const laidOut = graph.node(node.id)
    const width = node.width ?? nodeWidth
    const height = node.height ?? nodeHeight
    return { ...node, position: { x: laidOut.x - width / 2, y: laidOut.y - height / 2 } }
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/pages/organization/orgLayout.spec.ts`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/organization/orgLayout.ts frontend/src/pages/organization/orgLayout.spec.ts
git commit -m "$(cat <<'EOF'
feat(organization): add shared dagre layout helper

Pure function over dagre — the Organization module's two graph modes
(and later Harness Designer / Enterprise Map) share this instead of
each hand-rolling dagre wiring.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `components/SidePanel.jsx` — shared slide-in panel primitive

**Files:**
- Create: `frontend/src/components/SidePanel.jsx`

**Interfaces:**
- Consumes: `usePresence` from `../dewa/usePresence.js` (signature: `usePresence(present: boolean, { duration? }) => { mounted: boolean; motion: 'entering'|'entered'|'exiting' }` — already exists), Astryx `IconButton`, `Text`.
- Produces (used by Tasks 8 and 9): `<SidePanel isOpen={boolean} onClose={() => void} eyebrow={ReactNode} title={ReactNode} width={number}>{children}</SidePanel>`. Renders `null` when not open and not mid-exit-animation.

- [ ] **Step 1: Implement `SidePanel.jsx`**

Create `frontend/src/components/SidePanel.jsx`:

```jsx
// <SidePanel> — the shared slide-in panel CONVENTIONS.md requires in place
// of modals ("No modals for primary content — use components/SidePanel.jsx
// (slide-in)"). First consumer: pages/organization/{Section,Position}Panel.jsx.
import { useEffect } from 'react'
import { IconButton } from '@astryxdesign/core/IconButton'
import { Text } from '@astryxdesign/core/Text'
import { usePresence } from '../dewa/usePresence.js'

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export function SidePanel({ isOpen, onClose, eyebrow, title, width = 420, children }) {
  const { mounted, motion } = usePresence(isOpen)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.32)',
          opacity: motion === 'entered' ? 1 : 0, transition: 'opacity 0.22s ease-out',
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width, maxWidth: '92vw',
          background: 'var(--color-background-body)', borderLeft: '1px solid var(--color-border)',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)', overflowY: 'auto',
          transform: motion === 'entered' ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s ease-out',
        }}
      >
        <div
          style={{
            position: 'sticky', top: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 'var(--spacing-2)', padding: 'var(--spacing-4) var(--spacing-5)',
            borderBottom: '1px solid var(--color-border)', background: 'var(--color-background-body)',
          }}
        >
          <div>
            {eyebrow && <span className="eyebrow" style={{ display: 'block', marginBottom: 4 }}>{eyebrow}</span>}
            <Text weight="semibold" size="lg">{title}</Text>
          </div>
          <IconButton label="Close" icon={<CloseIcon />} variant="ghost" size="sm" onClick={onClose} />
        </div>
        <div style={{ padding: 'var(--spacing-5)' }}>{children}</div>
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck and build**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: no errors (this file has no consumers yet, so this just validates syntax/imports).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SidePanel.jsx
git commit -m "$(cat <<'EOF'
feat: add shared SidePanel slide-in primitive

CONVENTIONS.md requires this in place of modals for primary content;
it didn't exist yet. First consumers land in the Organization module.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `pages/organization/OrgFlowNode.jsx` — custom React Flow node renderers

**Files:**
- Create: `frontend/src/pages/organization/OrgFlowNode.jsx`

**Interfaces:**
- Consumes: `Handle`, `Position as FlowPosition` from `@xyflow/react`; `WORKFORCE_TYPE_LABELS` from `../../data/types`.
- Produces (used by Tasks 6 and 7):
  - `OrgLevelNode({ data })` — `data: { node: OrgNode; counts: {human, agent}; hasChildren: boolean; isCollapsed: boolean; isDimmed: boolean; agenticityLabel?: string | null; onToggleCollapse: (id) => void; onSelect: (node) => void }`
  - `PositionNode({ data })` — `data: { position: Position; employeeName: string | null; agentCount: number; isDimmed: boolean; color: string; onSelect: (position) => void }`
  - `SectionHeaderNode({ data })` — `data: { node: OrgNode; isDimmed: boolean; agenticityLabel?: string | null }`

- [ ] **Step 1: Implement `OrgFlowNode.jsx`**

Create `frontend/src/pages/organization/OrgFlowNode.jsx`:

```jsx
// Custom React Flow node renderers shared by OrgChart.jsx (Mode A) and
// OrgNetworkGraph.jsx (Mode B). Kept in one file since all three are small
// and change together whenever the node "look" changes.
import { Handle, Position as FlowPosition } from '@xyflow/react'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { WORKFORCE_TYPE_LABELS } from '../../data/types'

const LEVEL_LABEL = {
  Enterprise: 'Enterprise', Division: 'Division', SuperDepartment: 'Super Department',
  Department: 'Department', Section: 'Section',
}

const cardStyle = (isDimmed, extra) => ({
  width: 220, padding: '10px 12px', borderRadius: 'var(--radius-container)',
  border: '1px solid var(--color-border)', background: 'var(--color-background-surface)',
  cursor: 'pointer', opacity: isDimmed ? 0.4 : 1, transition: 'opacity 0.2s ease-out',
  ...extra,
})

export function OrgLevelNode({ data }) {
  const { node, counts, hasChildren, isCollapsed, isDimmed, agenticityLabel, onToggleCollapse, onSelect } = data
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(node)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(node) }}
      style={cardStyle(isDimmed)}
    >
      <Handle type="target" position={FlowPosition.Top} style={{ visibility: node.parentId ? 'visible' : 'hidden' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>{LEVEL_LABEL[node.level]}</span>
        {hasChildren && (
          <button
            type="button"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id) }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2, lineHeight: 0, fontSize: 12 }}
          >
            {isCollapsed ? '▸' : '▾'}
          </button>
        )}
      </div>
      <Text weight="semibold" size="sm" style={{ display: 'block', margin: '2px 0 6px' }}>{node.name}</Text>
      <div style={{ display: 'flex', gap: 6 }}>
        <Badge label={`${counts.human} human`} variant="neutral" />
        <Badge label={`${counts.agent} agent`} variant="info" />
      </div>
      {agenticityLabel && (
        <Text size="xs" color="secondary" style={{ display: 'block', marginTop: 4 }}>{agenticityLabel} agenticity</Text>
      )}
      <Handle type="source" position={FlowPosition.Bottom} style={{ visibility: hasChildren && !isCollapsed ? 'visible' : 'hidden' }} />
    </div>
  )
}

export function PositionNode({ data }) {
  const { position, employeeName, agentCount, isDimmed, color, onSelect } = data
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(position)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(position) }}
      style={cardStyle(isDimmed, { width: 210, borderLeft: `4px solid ${color}` })}
    >
      <Handle type="target" position={FlowPosition.Top} />
      <Text weight="semibold" size="sm" style={{ display: 'block' }}>{position.title}</Text>
      <Text size="xs" color="secondary" style={{ display: 'block', margin: '2px 0 6px' }}>
        {employeeName ?? WORKFORCE_TYPE_LABELS[position.workforceType]}
      </Text>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Badge label={WORKFORCE_TYPE_LABELS[position.workforceType]} variant="neutral" />
        {agentCount > 0 && <Badge label={`${agentCount} agent${agentCount > 1 ? 's' : ''}`} variant="info" />}
      </div>
      <Handle type="source" position={FlowPosition.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
}

export function SectionHeaderNode({ data }) {
  const { node, isDimmed, agenticityLabel } = data
  return (
    <div style={{ padding: '4px 10px', opacity: isDimmed ? 0.5 : 1 }}>
      <Handle type="target" position={FlowPosition.Top} style={{ visibility: 'hidden' }} />
      <Text weight="semibold" size="xs">{node.name}</Text>
      {agenticityLabel && <Text size="xs" color="secondary" style={{ display: 'block' }}>{agenticityLabel} agenticity</Text>}
      <Handle type="source" position={FlowPosition.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck and build**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/organization/OrgFlowNode.jsx
git commit -m "$(cat <<'EOF'
feat(organization): add shared React Flow node renderers

OrgLevelNode, PositionNode, SectionHeaderNode — used by both the
traditional org chart and the AI-native network graph.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `pages/organization/OrgFilters.jsx` — filter bar

**Files:**
- Create: `frontend/src/pages/organization/OrgFilters.jsx`

**Interfaces:**
- Consumes: `dataset` from `../../data/mockApi`, `AGENTICITY_LABELS`, `AGENTICITY_ORDER`, `WORKFORCE_TYPE_LABELS` from `../../data/types`, Astryx `Selector`, `TextInput`.
- Produces (used by Task 10): `<OrgFilters filters={OrgFilterState} onChange={(next: OrgFilterState) => void} />` where
  `OrgFilterState = { search: string; divisionId: string|null; workforceType: string|null; agenticityLevel: string|null; performanceStatus: string|null; strategicObjectiveId: string|null }`.

- [ ] **Step 1: Implement `OrgFilters.jsx`**

Create `frontend/src/pages/organization/OrgFilters.jsx`:

```jsx
// OrgFilters — the Organization module's filter bar. Lifts a plain filter
// state object to the parent; Organization.jsx turns it into a position
// predicate via data/organizationAggregates.ts (dataviz/AND semantics, see
// the 2026-08-01 design spec).
import { Selector } from '@astryxdesign/core/Selector'
import { TextInput } from '@astryxdesign/core/TextInput'
import { dataset } from '../../data/mockApi'
import { AGENTICITY_LABELS, AGENTICITY_ORDER, WORKFORCE_TYPE_LABELS } from '../../data/types'

const DIVISION_OPTIONS = dataset.orgNodes
  .filter((n) => n.level === 'Division')
  .map((n) => ({ value: n.id, label: n.name }))

const WORKFORCE_OPTIONS = Object.entries(WORKFORCE_TYPE_LABELS).map(([value, label]) => ({ value, label }))

const AGENTICITY_OPTIONS = AGENTICITY_ORDER.map((value) => ({ value, label: `${value} — ${AGENTICITY_LABELS[value]}` }))

const PERFORMANCE_OPTIONS = ['ExceedsExpectations', 'MeetsExpectations', 'NeedsOptimization', 'Restricted', 'Suspended', 'Retired', 'N/A']
  .map((value) => ({ value, label: value }))

const OBJECTIVE_OPTIONS = dataset.strategicObjectives.map((o) => ({ value: o.id, label: o.name }))

export function OrgFilters({ filters, onChange }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value })
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', alignItems: 'center' }}>
      <TextInput
        label="Search" isLabelHidden size="sm" width={220} placeholder="Search name or position…"
        value={filters.search} onChange={set('search')}
      />
      <Selector
        label="Division" isLabelHidden size="sm" width={200} hasClear
        options={DIVISION_OPTIONS} value={filters.divisionId} onChange={set('divisionId')} placeholder="Division"
      />
      <Selector
        label="Workforce type" isLabelHidden size="sm" width={190} hasClear
        options={WORKFORCE_OPTIONS} value={filters.workforceType} onChange={set('workforceType')} placeholder="Workforce type"
      />
      <Selector
        label="Agenticity" isLabelHidden size="sm" width={220} hasClear
        options={AGENTICITY_OPTIONS} value={filters.agenticityLevel} onChange={set('agenticityLevel')} placeholder="Agenticity level"
      />
      <Selector
        label="Performance" isLabelHidden size="sm" width={180} hasClear
        options={PERFORMANCE_OPTIONS} value={filters.performanceStatus} onChange={set('performanceStatus')} placeholder="Performance status"
      />
      <Selector
        label="Strategic objective" isLabelHidden size="sm" width={210} hasClear
        options={OBJECTIVE_OPTIONS} value={filters.strategicObjectiveId} onChange={set('strategicObjectiveId')} placeholder="Strategic objective"
      />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck and build**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/organization/OrgFilters.jsx
git commit -m "$(cat <<'EOF'
feat(organization): add filter bar (division, workforce type,
agenticity, performance status, strategic objective, search)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `pages/organization/OrgChart.jsx` — Mode A (traditional org chart)

**Files:**
- Create: `frontend/src/pages/organization/OrgChart.jsx`

**Interfaces:**
- Consumes: `buildOrgIndex`, `headcountRollup`, `agenticityForSection` from `../../data/organizationAggregates` (Task 1); `layoutWithDagre` from `./orgLayout` (Task 2); `OrgLevelNode`, `PositionNode` from `./OrgFlowNode.jsx` (Task 4); `ReactFlow`, `Background`, `Controls`, `useNodesState`, `useEdgesState` from `@xyflow/react`.
- Produces (used by Task 10): `<OrgChart collapsedIds={Set<string>} onToggleCollapse={(id) => void} matchedPositionIds={Set<string>} hasActiveFilter={boolean} agenticityMode={'current'|'target'} onSelectNode={(orgNode) => void} onSelectPosition={(position) => void} />`.

- [ ] **Step 1: Implement `OrgChart.jsx`**

Create `frontend/src/pages/organization/OrgChart.jsx`:

```jsx
// Mode A — traditional org chart: full Enterprise -> Division -> Super
// Department -> Department -> Section -> Position hierarchy. Dagre top-down
// layout; a node's subtree is excluded from the graph entirely while
// collapsed (see the 2026-08-01 Organization module design spec).
import { useEffect, useMemo } from 'react'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { buildOrgIndex, headcountRollup, agenticityForSection } from '../../data/organizationAggregates.ts'
import { layoutWithDagre } from './orgLayout.ts'
import { OrgLevelNode, PositionNode } from './OrgFlowNode.jsx'

const nodeTypes = { orgLevel: OrgLevelNode, position: PositionNode }
const ROOT_ID = 'ENT-00'

export function OrgChart({ collapsedIds, onToggleCollapse, matchedPositionIds, hasActiveFilter, agenticityMode, onSelectNode, onSelectPosition }) {
  const index = useMemo(() => buildOrgIndex(), [])

  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes = []
    const edges = []

    function subtreeHasMatch(nodeId) {
      const node = index.nodesById[nodeId]
      if (node.level === 'Section') {
        return (index.positionsBySectionId[nodeId] ?? []).some((p) => matchedPositionIds.has(p.id))
      }
      return (index.childrenByParentId[nodeId] ?? []).some((childId) => subtreeHasMatch(childId))
    }

    function visit(nodeId, parentId) {
      const node = index.nodesById[nodeId]
      const children = index.childrenByParentId[nodeId] ?? []
      const isCollapsed = collapsedIds.has(nodeId)
      const isDimmed = hasActiveFilter && !subtreeHasMatch(nodeId)
      const agenticityLabel = node.level === 'Section' ? agenticityForSection(nodeId, agenticityMode) : null

      nodes.push({
        id: nodeId, type: 'orgLevel', position: { x: 0, y: 0 }, width: 220, height: agenticityLabel ? 100 : 84,
        data: {
          node, counts: headcountRollup(nodeId), hasChildren: children.length > 0,
          isCollapsed, isDimmed, agenticityLabel, onToggleCollapse, onSelect: onSelectNode,
        },
      })
      if (parentId) edges.push({ id: `${parentId}->${nodeId}`, source: parentId, target: nodeId })

      if (isCollapsed) return
      for (const childId of children) visit(childId, nodeId)

      if (node.level === 'Section') {
        for (const p of index.positionsBySectionId[nodeId] ?? []) {
          const isDimmedPosition = hasActiveFilter && !matchedPositionIds.has(p.id)
          nodes.push({
            id: p.id, type: 'position', position: { x: 0, y: 0 }, width: 210, height: 92,
            data: {
              position: p, employeeName: null, agentCount: 0, isDimmed: isDimmedPosition,
              color: 'var(--color-border)', onSelect: onSelectPosition,
            },
          })
          edges.push({ id: `${nodeId}->${p.id}`, source: nodeId, target: p.id })
        }
      }
    }

    visit(ROOT_ID, null)
    return { flowNodes: layoutWithDagre(nodes, edges, { direction: 'TB', rankSep: 70, nodeSep: 24 }), flowEdges: edges }
  }, [index, collapsedIds, matchedPositionIds, hasActiveFilter, agenticityMode, onToggleCollapse, onSelectNode, onSelectPosition])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Re-sync whenever the computed layout changes (collapse toggle, filter
  // change) — this is an auto-layout tool, not a free-form diagram editor,
  // so resetting any manual drag on every recompute is intentional.
  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  return (
    <div style={{ height: 640, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-container)' }}>
      <ReactFlow
        nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes} fitView minZoom={0.15}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
```

Note the position nodes here intentionally pass `employeeName: null, agentCount: 0` — Mode A prioritizes hierarchy legibility over per-position detail (that detail is one click away via the Position panel, and Mode B's network view shows it inline). This keeps `OrgChart.jsx` from duplicating `positionSummary()` wiring that Mode B already needs more centrally.

- [ ] **Step 2: Typecheck and build**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/organization/OrgChart.jsx
git commit -m "$(cat <<'EOF'
feat(organization): add Mode A traditional org chart

Full hierarchy via @xyflow/react + dagre, with per-node expand/
collapse and filter-driven dimming.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `pages/organization/OrgNetworkGraph.jsx` — Mode B (AI-native network)

**Files:**
- Create: `frontend/src/pages/organization/OrgNetworkGraph.jsx`

**Interfaces:**
- Consumes: `dataset` from `../../data/mockApi`; `buildOrgIndex`, `positionSummary` from `../../data/organizationAggregates` (Task 1); `layoutWithDagre` from `./orgLayout` (Task 2); `PositionNode`, `SectionHeaderNode` from `./OrgFlowNode.jsx` (Task 4); `useChartMode` from `../../lib/useChartMode.js`; `workforceTypeColor` from `../../lib/chartColors.js`.
- Produces (used by Task 10): `<OrgNetworkGraph matchedPositionIds={Set<string>} hasActiveFilter={boolean} agenticityMode={'current'|'target'} onSelectPosition={(position) => void} />`.

- [ ] **Step 1: Implement `OrgNetworkGraph.jsx`**

Create `frontend/src/pages/organization/OrgNetworkGraph.jsx`:

```jsx
// Mode B — AI-native organization network: flattened to Section + Position
// (the four upper tiers add hierarchy noise a workforce-relationship view
// doesn't need). Adds dashed "supervises" edges from each agent to its
// manager's position (or, when the agent has no specific position on
// record, to its section — most of the 15 seeded agents only carry a
// section-level orgAssignment, not a position). See the 2026-08-01
// Organization module design spec.
import { useEffect, useMemo } from 'react'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, MarkerType } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { dataset } from '../../data/mockApi'
import { buildOrgIndex, positionSummary } from '../../data/organizationAggregates.ts'
import { layoutWithDagre } from './orgLayout.ts'
import { PositionNode, SectionHeaderNode } from './OrgFlowNode.jsx'
import { useChartMode } from '../../lib/useChartMode.js'
import { workforceTypeColor } from '../../lib/chartColors.js'

const nodeTypes = { position: PositionNode, sectionHeader: SectionHeaderNode }

export function OrgNetworkGraph({ matchedPositionIds, hasActiveFilter, agenticityMode, onSelectPosition }) {
  const index = useMemo(() => buildOrgIndex(), [])
  const mode = useChartMode()
  const colors = useMemo(() => workforceTypeColor(mode), [mode])

  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes = []
    const edges = []
    const positionToSection = {}

    const sectionIds = Object.values(index.nodesById).filter((n) => n.level === 'Section').map((n) => n.id)
    for (const sectionId of sectionIds) {
      const positions = index.positionsBySectionId[sectionId] ?? []
      if (positions.length === 0) continue
      nodes.push({
        id: sectionId, type: 'sectionHeader', position: { x: 0, y: 0 }, width: 210, height: 32,
        data: { node: index.nodesById[sectionId], isDimmed: false },
      })
      for (const p of positions) {
        positionToSection[p.id] = sectionId
        const summary = positionSummary(p.id)
        const isDimmed = hasActiveFilter && !matchedPositionIds.has(p.id)
        nodes.push({
          id: p.id, type: 'position', position: { x: 0, y: 0 }, width: 210, height: 92,
          data: {
            position: p, employeeName: summary.employeeName, agentCount: summary.agentCount,
            isDimmed, color: colors[p.workforceType], onSelect: onSelectPosition,
          },
        })
        edges.push({ id: `${sectionId}->${p.id}`, source: sectionId, target: p.id })
      }
    }

    for (const agent of dataset.agents) {
      const managerEmployee = dataset.employees.find((e) => e.id === agent.managerEmployeeId)
      const targetPositionId = managerEmployee?.positionId
      if (!targetPositionId || !positionToSection[targetPositionId]) continue
      const sourcePositionId = agent.orgAssignment.positionId
      const sourceId = sourcePositionId && positionToSection[sourcePositionId]
        ? sourcePositionId
        : agent.orgAssignment.sectionId
      if (sourceId === targetPositionId || !index.nodesById[sourceId] && !positionToSection[sourceId]) continue
      edges.push({
        id: `supervise-${agent.id}`, source: sourceId, target: targetPositionId,
        style: { strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed }, label: 'supervises',
      })
    }

    return { flowNodes: layoutWithDagre(nodes, edges, { direction: 'TB', rankSep: 70, nodeSep: 20 }), flowEdges: edges }
  }, [index, matchedPositionIds, hasActiveFilter, agenticityMode, colors, onSelectPosition])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)
  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  return (
    <div style={{ height: 640, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-container)' }}>
      <ReactFlow
        nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes} fitView minZoom={0.15}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck and build**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/organization/OrgNetworkGraph.jsx
git commit -m "$(cat <<'EOF'
feat(organization): add Mode B AI-native workforce network

Section+Position graph with agent-supervision edges, colored by
workforce type via the existing chartColors palette.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `pages/organization/SectionPanel.jsx`

**Files:**
- Create: `frontend/src/pages/organization/SectionPanel.jsx`

**Interfaces:**
- Consumes: `SidePanel` from `../../components/SidePanel.jsx` (Task 3); `dataset` from `../../data/mockApi`; `buildOrgIndex`, `headcountRollup`, `strategicObjectivesForSection`, `processesForSection`, `qualityProceduresForSection`, `aiInitiativesForSection`, `aiCoverageForSection`, `agenticityForSection`, `realizedValueForSection`, `tokenCostForSection`, `sectionManager` from `../../data/organizationAggregates.ts` (Task 1); `ValueTag` from `../../dewa/ValueTag.jsx`; `Aed` from `../../dewa/Aed.jsx`.
- Produces (used by Task 10): `<SectionPanel sectionId={string|null} onClose={() => void} agenticityMode={'current'|'target'} />`.

- [ ] **Step 1: Implement `SectionPanel.jsx`**

Create `frontend/src/pages/organization/SectionPanel.jsx`:

```jsx
// Section side panel — requirements doc Section 5's field list: mandate,
// manager, employee/agent counts, activities, QPs, processes, initiatives,
// AI coverage, process agenticity, realized value, token cost, strategic
// objective contribution.
import { useEffect, useRef } from 'react'
import { VStack } from '@astryxdesign/core/VStack'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { useNavigate } from 'react-router-dom'
import { SidePanel } from '../../components/SidePanel.jsx'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { dataset } from '../../data/mockApi'
import {
  buildOrgIndex, headcountRollup, strategicObjectivesForSection, processesForSection,
  qualityProceduresForSection, aiInitiativesForSection, aiCoverageForSection,
  agenticityForSection, realizedValueForSection, tokenCostForSection, sectionManager,
} from '../../data/organizationAggregates.ts'

function LinkRow({ onClick, children }) {
  return (
    <div
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      style={{ cursor: 'pointer', padding: '4px 0' }}
    >
      {children}
    </div>
  )
}

export function SectionPanel({ sectionId, onClose, agenticityMode }) {
  const navigate = useNavigate()
  const lastIdRef = useRef(sectionId)
  useEffect(() => { if (sectionId) lastIdRef.current = sectionId }, [sectionId])
  const displayId = sectionId ?? lastIdRef.current
  if (!displayId) return null

  const node = buildOrgIndex().nodesById[displayId]
  const counts = headcountRollup(displayId)
  const manager = sectionManager(displayId)
  const processes = processesForSection(displayId)
  const qps = qualityProceduresForSection(displayId)
  const initiatives = aiInitiativesForSection(displayId)
  const objectives = strategicObjectivesForSection(displayId)
    .map((id) => dataset.strategicObjectives.find((o) => o.id === id))
    .filter(Boolean)
  const coverage = aiCoverageForSection(displayId)
  const agenticity = agenticityForSection(displayId, agenticityMode)
  const realizedValue = realizedValueForSection(displayId)
  const tokenCost = tokenCostForSection(displayId)

  return (
    <SidePanel isOpen={Boolean(sectionId)} onClose={onClose} eyebrow="Section" title={node.name}>
      <VStack gap={5}>
        <Text color="secondary">{node.mandate ?? 'No mandate on file.'}</Text>

        <MetadataList columns="single">
          <MetadataListItem label="Section manager">{manager ? manager.name : 'Unassigned'}</MetadataListItem>
          <MetadataListItem label="Employees">{counts.human}</MetadataListItem>
          <MetadataListItem label="Agents">{counts.agent}</MetadataListItem>
          <MetadataListItem label="AI work coverage">
            {Math.round(coverage)}% <ValueTag tag="Estimated" />
          </MetadataListItem>
          <MetadataListItem label={`Process agenticity (${agenticityMode})`}>
            {agenticity ?? 'No processes assigned'}
          </MetadataListItem>
          <MetadataListItem label="Realized value">
            <Aed usd={realizedValue} /> <ValueTag tag="Validated" />
          </MetadataListItem>
          <MetadataListItem label="Token cost">
            <Aed usd={tokenCost} /> <ValueTag tag="Observed" />
          </MetadataListItem>
        </MetadataList>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Strategic objective contribution
          </Text>
          {objectives.length === 0 ? (
            <Text size="sm" color="secondary">None linked yet.</Text>
          ) : (
            <VStack gap={1}>{objectives.map((o) => <Text key={o.id} size="sm">{o.name}</Text>)}</VStack>
          )}
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Processes ({processes.length})
          </Text>
          <VStack gap={1}>
            {processes.map((p) => (
              <LinkRow key={p.id} onClick={() => navigate(`/processes/agenticity/${p.id}`)}>
                <Text size="sm">{p.name} <Badge label={p.currentAgenticity} variant="neutral" /></Text>
              </LinkRow>
            ))}
          </VStack>
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Quality Procedures ({qps.length})
          </Text>
          <VStack gap={1}>
            {qps.map((q) => (
              <LinkRow key={q.id} onClick={() => navigate(`/processes/quality-procedures/${q.id}`)}>
                <Text size="sm">{q.title}</Text>
              </LinkRow>
            ))}
          </VStack>
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            AI initiatives ({initiatives.length})
          </Text>
          <VStack gap={1}>
            {initiatives.map((i) => (
              <LinkRow key={i.id} onClick={() => navigate(`/ai-initiatives/${i.id}`)}>
                <Text size="sm">{i.title} <Badge label={i.status} variant="neutral" /></Text>
              </LinkRow>
            ))}
          </VStack>
        </div>
      </VStack>
    </SidePanel>
  )
}
```

- [ ] **Step 2: Typecheck and build**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/organization/SectionPanel.jsx
git commit -m "$(cat <<'EOF'
feat(organization): add Section side panel

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `pages/organization/PositionPanel.jsx`

**Files:**
- Create: `frontend/src/pages/organization/PositionPanel.jsx`

**Interfaces:**
- Consumes: `SidePanel` from `../../components/SidePanel.jsx` (Task 3); `dataset` from `../../data/mockApi`; `WORKFORCE_TYPE_LABELS` from `../../data/types`; `agentsForPosition`, `performanceStatusForPosition`, `relatedProcessesForPosition`, `relatedQpsForPosition` from `../../data/organizationAggregates.ts` (Task 1); `ValueTag` from `../../dewa/ValueTag.jsx`.
- Produces (used by Task 10): `<PositionPanel positionId={string|null} onClose={() => void} />`. This is the component that renders the required worked example — no special-casing: `POS-BA-D2D-01`'s job description already has the six activity rows (70/40/10/95/100/0%) and `agentsForPosition` already resolves `AGT-D2D-DOC-01`.

- [ ] **Step 1: Implement `PositionPanel.jsx`**

Create `frontend/src/pages/organization/PositionPanel.jsx`:

```jsx
// Position side panel — requirements doc Section 5's field list: title, job
// description, key responsibilities, activities, competencies, assigned
// employee, assigned Copilot/agents, AI work-coverage %, human/agent
// contribution, quality-adjusted AI coverage, verified capacity released,
// related processes, related Quality Procedures. No hardcoding of the
// Senior Business Analyst worked example — its six activity rows and
// assigned agent fall out of the generic rendering below because the
// underlying data (positions.seed.ts, organizationAggregates.ts) already
// carries the exact figures from the requirements doc.
import { useEffect, useRef } from 'react'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { useNavigate } from 'react-router-dom'
import { SidePanel } from '../../components/SidePanel.jsx'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { dataset } from '../../data/mockApi'
import { WORKFORCE_TYPE_LABELS } from '../../data/types'
import {
  agentsForPosition, performanceStatusForPosition, relatedProcessesForPosition, relatedQpsForPosition,
} from '../../data/organizationAggregates.ts'

function LinkRow({ onClick, children }) {
  return (
    <div
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      style={{ cursor: 'pointer', padding: '4px 0' }}
    >
      {children}
    </div>
  )
}

export function PositionPanel({ positionId, onClose }) {
  const navigate = useNavigate()
  const lastIdRef = useRef(positionId)
  useEffect(() => { if (positionId) lastIdRef.current = positionId }, [positionId])
  const displayId = positionId ?? lastIdRef.current
  if (!displayId) return null

  const position = dataset.positions.find((p) => p.id === displayId)
  const jobDescription = dataset.jobDescriptions.find((j) => j.id === position.jobDescriptionId)
  const employee = position.assignedEmployeeId
    ? dataset.employees.find((e) => e.id === position.assignedEmployeeId)
    : null
  const agents = agentsForPosition(displayId)
  const performanceStatus = performanceStatusForPosition(displayId)
  const processes = relatedProcessesForPosition(displayId)
  const qps = relatedQpsForPosition(displayId)

  return (
    <SidePanel isOpen={Boolean(positionId)} onClose={onClose} eyebrow={WORKFORCE_TYPE_LABELS[position.workforceType]} title={position.title}>
      <VStack gap={5}>
        <Text color="secondary">{jobDescription?.summary}</Text>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Key responsibilities</Text>
          <VStack gap={1}>
            {jobDescription?.keyResponsibilities.map((r) => <Text key={r} size="sm">• {r}</Text>)}
          </VStack>
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Competencies</Text>
          <HStack gap={1} style={{ flexWrap: 'wrap' }}>
            {jobDescription?.competencies.map((c) => <Badge key={c} label={c} variant="neutral" />)}
          </HStack>
        </div>

        {jobDescription && jobDescription.activities.length > 0 && (
          <div>
            <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Activities — AI contribution</Text>
            <VStack gap={2}>
              {jobDescription.activities.map((a) => (
                <HStack key={a.id} justify="space-between" align="center">
                  <Text size="sm">{a.name}</Text>
                  <Badge
                    label={`${a.aiContributionPct}%`}
                    variant={a.aiContributionPct >= 70 ? 'success' : a.aiContributionPct > 0 ? 'info' : 'neutral'}
                  />
                </HStack>
              ))}
            </VStack>
          </div>
        )}

        <MetadataList columns="single">
          <MetadataListItem label="Assigned employee">{employee ? employee.name : 'Unassigned'}</MetadataListItem>
          <MetadataListItem label="Assigned Copilot / agents">
            {agents.length === 0 ? 'None' : (
              <VStack gap={1}>
                {agents.map((a) => (
                  <LinkRow key={a.id} onClick={() => navigate(`/agents/${a.id}`)}>{a.name}</LinkRow>
                ))}
              </VStack>
            )}
          </MetadataListItem>
          <MetadataListItem label="AI work coverage">
            {position.aiWorkCoveragePct}% <ValueTag tag="Estimated" />
          </MetadataListItem>
          <MetadataListItem label="Human contribution">{position.humanContributionPct}%</MetadataListItem>
          <MetadataListItem label="Agent contribution">{position.agentContributionPct}%</MetadataListItem>
          <MetadataListItem label="Quality-adjusted AI coverage">
            {position.qualityAdjustedAiCoveragePct}% <ValueTag tag="Observed" />
          </MetadataListItem>
          <MetadataListItem label="Verified capacity released">
            {position.verifiedCapacityReleasedHours.value} h <ValueTag tag={position.verifiedCapacityReleasedHours.tag} />
          </MetadataListItem>
          <MetadataListItem label="Performance status">
            <Badge label={performanceStatus} variant="neutral" />
          </MetadataListItem>
        </MetadataList>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Related processes ({processes.length})
          </Text>
          <VStack gap={1}>
            {processes.map((p) => (
              <LinkRow key={p.id} onClick={() => navigate(`/processes/agenticity/${p.id}`)}>
                <Text size="sm">{p.name}</Text>
              </LinkRow>
            ))}
          </VStack>
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Related Quality Procedures ({qps.length})
          </Text>
          <VStack gap={1}>
            {qps.map((q) => (
              <LinkRow key={q.id} onClick={() => navigate(`/processes/quality-procedures/${q.id}`)}>
                <Text size="sm">{q.title}</Text>
              </LinkRow>
            ))}
          </VStack>
        </div>
      </VStack>
    </SidePanel>
  )
}
```

- [ ] **Step 2: Typecheck and build**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/organization/PositionPanel.jsx
git commit -m "$(cat <<'EOF'
feat(organization): add Position side panel

Renders the required Senior Business Analyst worked example (six
activity rows, assigned D2D Documentation Agent) generically — no
special-casing, it falls out of real seed data + organizationAggregates.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `pages/organization/Organization.jsx` — orchestrator + routing + PROJECT.md

**Files:**
- Create: `frontend/src/pages/organization/Organization.jsx`
- Modify: `frontend/src/app/router.jsx:25`
- Modify: `PROJECT.md` (repo root) — append Step 4 to the Phase 2 log

**Interfaces:**
- Consumes: `getOrganization` from `../../data/mockApi` (existing); `dataset` from `../../data/mockApi`; `agenticityForSection`, `performanceStatusForPosition`, `strategicObjectivesForSection` from `../../data/organizationAggregates.ts` (Task 1); `OrgFilters` (Task 5); `OrgChart` (Task 6); `OrgNetworkGraph` (Task 7); `SectionPanel` (Task 8); `PositionPanel` (Task 9).
- Produces: default export `Organization` — the route element for `/organization`.

- [ ] **Step 1: Implement `Organization.jsx`**

Create `frontend/src/pages/organization/Organization.jsx`:

```jsx
// Organization module — requirements doc Section 5. Route: "/organization"
// (see router.jsx). Toolbar (view mode, current/target toggle, filters) +
// Mode A/B graph + Section/Position side panels.
import { useEffect, useMemo, useState } from 'react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { getOrganization, dataset } from '../../data/mockApi'
import { OrgFilters } from './OrgFilters.jsx'
import { OrgChart } from './OrgChart.jsx'
import { OrgNetworkGraph } from './OrgNetworkGraph.jsx'
import { SectionPanel } from './SectionPanel.jsx'
import { PositionPanel } from './PositionPanel.jsx'
import { agenticityForSection, performanceStatusForPosition, strategicObjectivesForSection } from '../../data/organizationAggregates.ts'

const EMPTY_FILTERS = {
  search: '', divisionId: null, workforceType: null, agenticityLevel: null,
  performanceStatus: null, strategicObjectiveId: null,
}

function positionMatches(position, filters, agenticityMode) {
  if (filters.divisionId && position.divisionId !== filters.divisionId) return false
  if (filters.workforceType && position.workforceType !== filters.workforceType) return false
  if (filters.agenticityLevel && agenticityForSection(position.sectionId, agenticityMode) !== filters.agenticityLevel) return false
  if (filters.performanceStatus && performanceStatusForPosition(position.id) !== filters.performanceStatus) return false
  if (filters.strategicObjectiveId && !strategicObjectivesForSection(position.sectionId).includes(filters.strategicObjectiveId)) return false
  if (filters.search) {
    const q = filters.search.toLowerCase()
    const employee = position.assignedEmployeeId ? dataset.employees.find((e) => e.id === position.assignedEmployeeId) : null
    if (!position.title.toLowerCase().includes(q) && !(employee && employee.name.toLowerCase().includes(q))) return false
  }
  return true
}

function ancestorChain(nodeId, nodesById) {
  const chain = []
  let current = nodesById[nodeId]
  while (current?.parentId) { chain.push(current.parentId); current = nodesById[current.parentId] }
  return chain
}

export default function Organization() {
  const [ready, setReady] = useState(false)
  useEffect(() => { getOrganization().then(() => setReady(true)) }, [])

  const [mode, setMode] = useState('traditional')
  const [agenticityMode, setAgenticityMode] = useState('current')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [collapsedIds, setCollapsedIds] = useState(() => new Set(
    dataset.orgNodes.filter((n) => n.level === 'SuperDepartment' || n.level === 'Department' || n.level === 'Section').map((n) => n.id),
  ))
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [selectedPositionId, setSelectedPositionId] = useState(null)

  const hasActiveFilter = Boolean(
    filters.search || filters.divisionId || filters.workforceType
    || filters.agenticityLevel || filters.performanceStatus || filters.strategicObjectiveId,
  )

  const matchedPositionIds = useMemo(() => {
    if (!hasActiveFilter) return new Set()
    return new Set(dataset.positions.filter((p) => positionMatches(p, filters, agenticityMode)).map((p) => p.id))
  }, [filters, agenticityMode, hasActiveFilter])

  useEffect(() => {
    if (!hasActiveFilter) return
    const nodesById = Object.fromEntries(dataset.orgNodes.map((n) => [n.id, n]))
    const toExpand = new Set()
    for (const position of dataset.positions) {
      if (!matchedPositionIds.has(position.id)) continue
      toExpand.add(position.sectionId)
      for (const ancestorId of ancestorChain(position.sectionId, nodesById)) toExpand.add(ancestorId)
    }
    setCollapsedIds((prev) => new Set([...prev].filter((id) => !toExpand.has(id))))
  }, [matchedPositionIds, hasActiveFilter])

  const toggleCollapse = (nodeId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId)
      return next
    })
  }

  const handleSelectNode = (node) => { if (node.level === 'Section') setSelectedSectionId(node.id) }
  const handleSelectPosition = (position) => setSelectedPositionId(position.id)

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Organization</Heading>
        <Text color="secondary" size="lg">
          Enterprise → Division → Super Department → Department → Section → Position, and how human,
          human+agent, and agent-only work is distributed across it.
        </Text>
      </div>

      {!ready ? (
        <Skeleton height={640} radius={2} />
      ) : (
        <VStack gap={4}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
            <SegmentedControl value={mode} onChange={setMode} label="View mode">
              <SegmentedControlItem value="traditional" label="Traditional org chart" />
              <SegmentedControlItem value="network" label="AI-native network" />
            </SegmentedControl>
            <SegmentedControl value={agenticityMode} onChange={setAgenticityMode} label="Agenticity state">
              <SegmentedControlItem value="current" label="Current state" />
              <SegmentedControlItem value="target" label="Target state" />
            </SegmentedControl>
          </div>

          <OrgFilters filters={filters} onChange={setFilters} />

          {mode === 'traditional' ? (
            <OrgChart
              collapsedIds={collapsedIds} onToggleCollapse={toggleCollapse}
              matchedPositionIds={matchedPositionIds} hasActiveFilter={hasActiveFilter}
              agenticityMode={agenticityMode}
              onSelectNode={handleSelectNode} onSelectPosition={handleSelectPosition}
            />
          ) : (
            <OrgNetworkGraph
              matchedPositionIds={matchedPositionIds} hasActiveFilter={hasActiveFilter}
              agenticityMode={agenticityMode} onSelectPosition={handleSelectPosition}
            />
          )}
        </VStack>
      )}

      <SectionPanel sectionId={selectedSectionId} onClose={() => setSelectedSectionId(null)} agenticityMode={agenticityMode} />
      <PositionPanel positionId={selectedPositionId} onClose={() => setSelectedPositionId(null)} />
    </div>
  )
}
```

- [ ] **Step 2: Wire the route**

Modify `frontend/src/app/router.jsx`:
- Add near the top (after the `ExecutiveOverview` import, line 10): `import Organization from "../pages/organization/Organization.jsx"`
- Replace line 25:
  ```jsx
  { path: "organization", element: coming("Organization", "Traditional org chart and AI-native workforce network, with section/position drill-down panels.") },
  ```
  with:
  ```jsx
  { path: "organization", element: <Organization /> },
  ```

- [ ] **Step 3: Verify the full check suite**

Run, in order:
```bash
cd frontend
npm run typecheck
npx vitest run
npm run build
```
Expected: all three pass with zero errors.

- [ ] **Step 4: Manual browser verification**

Run: `cd frontend && npm run dev`, open `http://localhost:3400/#/organization`, and confirm:
- The page loads past the skeleton into a rendered org chart (Mode A), rooted at "DEWA", Divisions expanded by default.
- Toggling to "AI-native network" (Mode B) renders Section headers + Position nodes with dashed "supervises" edges.
- Expand/collapse works on Division/Super Department/Department/Section nodes.
- Typing "Senior Business Analyst" in search highlights/un-dims exactly that position and auto-expands its ancestor chain.
- Clicking the Senior Business Analyst position node opens the Position panel showing exactly six activity rows at 70% / 40% / 10% / 95% / 100% / 0%, and "D2D Documentation Agent" under Assigned Copilot / agents.
- Clicking a Section node opens the Section panel with a non-zero employee/agent count.
- All five filters (division, workforce type, agenticity, performance status, strategic objective) narrow the graph (dim non-matches) when set, and clear correctly.
- Toggling "Current state" / "Target state" changes the agenticity label/badge on Section nodes without changing graph structure.
- Both light and dark mode (`data-astryx-mode` toggle in the topbar) look correct — no invisible text, no pure-white/pure-black surfaces.

- [ ] **Step 5: Update PROJECT.md**

Modify `PROJECT.md` (repo root) — append a new subsection after "Phase 2 — Step 3: Executive Overview" (after line 64):

```markdown

### Phase 2 — Step 4: Organization module (2026-08-01)

`data/organizationAggregates.ts` (fixes three seed gaps found during this
step — `OrgNode.headcountHuman/headcountAgent` and `strategicObjectiveIds`
were always `0`/`[]`, `Position.assignedAgentIds` was never backfilled —
all now derived at read time, not hand-authored), `components/SidePanel.jsx`
(the shared slide-in primitive CONVENTIONS.md required but that didn't exist
yet), and the full `/organization` module: two `@xyflow/react` + dagre
visualization modes (traditional org chart, AI-native workforce network with
agent-supervision edges), five-dimension filters + search, a current/target
agenticity toggle, and Section/Position side panels. The required Senior
Business Analyst worked example (six activity rows at 70/40/10/95/100/0%,
D2D Documentation Agent assignment) renders with no special-casing — it
falls out of generic panel rendering over real seed data.

**Lessons**
- Design spec: `docs/superpowers/specs/2026-08-01-organization-module-design.md`.
- Found `KpiGrid.jsx` (Step 3) hardcodes `prefix="AED "` on two KPIs instead
  of using `<Aed>` — a CONVENTIONS.md violation that predates this step;
  left as-is (out of scope for Step 4) but flagged for a follow-up fix.
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/organization/Organization.jsx frontend/src/app/router.jsx PROJECT.md
git commit -m "$(cat <<'EOF'
feat(organization): wire up the Organization module route

Replaces the ComingSoon stub at /organization with the full module:
mode toggle, filters, both graph views, and side panels.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** every bullet in the design spec's sections 1–8 maps to a task above (data layer → Task 1; SidePanel → Task 3; Mode A/B → Tasks 6/7; filters → Task 5; current/target → woven through Tasks 1/6/7/8; side panels → Tasks 8/9; routing → Task 10). Section 9 (testing) is covered by Tasks 1/2's vitest specs plus Task 10 Step 4's manual pass.
- **Type consistency checked:** `OrgIndex`, `agenticityForSection(sectionId, mode)`, `agentsForPosition(positionId)`, `positionSummary(positionId)` are defined once in Task 1 and referenced with matching names/signatures in Tasks 6–10. `layoutWithDagre(nodes, edges, opts)` defined in Task 2 matches its call sites in Tasks 6–7.
- **No placeholders:** every step has complete, runnable code — no "add validation," no "similar to Task N."
