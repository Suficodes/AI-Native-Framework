# Agent Constellation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `/agent-constellation` section that visualises DEWA's AI agent workforce as a radial constellation (core → 4 divisions → 15 agents → their processes and Quality Procedures) with a second top-down "neural" layout and a per-division focus mode.

**Architecture:** A pure data selector over the existing mock `dataset` produces a strict 4-tier tree. Two pure geometry functions turn that tree into `{x, y}` positions plus a `viewBox`, in one shared coordinate space. A hand-rolled SVG canvas renders positions; switching mode or focusing a division animates the `viewBox` and node transforms with CSS transitions only.

**Tech Stack:** React 19, Vite, `@astryxdesign/core` (Astryx, `dewa` theme), TypeScript for the data layer, vitest. No new dependencies — deliberately **not** `@xyflow/react` (wrong tool for fixed polar geometry) and **not** `framer-motion` (rAF animation does not advance reliably under this repo's headless-Chrome verification scripts).

## Global Constraints

- Frontend only. All data comes from `frontend/src/data/mockApi.ts`'s `dataset`. No new seed data, no backend.
- Data/logic layer is TypeScript (`.ts`); UI components are `.jsx`. Run `npm run typecheck` before calling any data-layer change done.
- File size caps: React component 250 lines, util/composable module 200 lines.
- CSS classes are `kebab-case`. Route paths are kebab-case nouns.
- Chart/graph mark colours come from `frontend/src/lib/chartColors.js` only — never raw hex in a component, never DEWA brand green as a categorical mark colour.
- No pure black (`#000`) or pure white (`#fff`) surfaces. No glassmorphism, gradient text, glow borders or bounce animations.
- No modals — use the existing `components/SidePanel.jsx`.
- All motion must be CSS and must no-op under `prefers-reduced-motion`, via the existing `dewa/useReducedMotionSafe.js`.
- Do not modify `/enterprise-map`, `enterpriseMapGraph.ts`, `enterpriseMapLenses.ts` or `enterpriseMapStory.ts`.
- Work on branch `feat/agent-constellation`. Commit after every task.
- All paths below are relative to `frontend/` unless stated otherwise.

---

### Task 1: The constellation graph (data layer)

**Files:**
- Create: `src/data/constellationGraph.ts`
- Test: `src/data/constellationGraph.spec.ts`

**Interfaces:**
- Consumes: `dataset` from `src/data/mockApi.ts`; `AGENTICITY_ORDER` and types from `src/data/types.ts`.
- Produces:
  - `type ConstellationTier = 'core' | 'domain' | 'agent' | 'leaf'`
  - `interface ConstellationNode` (fields below)
  - `interface ConstellationLink { id: string; source: string; target: string }`
  - `interface ConstellationGraph { nodes: ConstellationNode[]; links: ConstellationLink[]; domains: ConstellationNode[]; byId: Map<string, ConstellationNode>; childrenOf: Map<string, ConstellationNode[]> }`
  - `function buildConstellationGraph(): ConstellationGraph` — memoized, referentially stable across calls.

- [ ] **Step 1: Write the failing test**

Create `src/data/constellationGraph.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import { buildConstellationGraph } from './constellationGraph'

describe('the constellation graph', () => {
  it('has exactly one core node and one node per division', () => {
    const g = buildConstellationGraph()
    expect(g.nodes.filter((n) => n.tier === 'core')).toHaveLength(1)
    const divisions = dataset.orgNodes.filter((n) => n.level === 'Division')
    expect(g.domains).toHaveLength(divisions.length)
    expect(g.domains.every((d) => d.tier === 'domain')).toBe(true)
  })

  it('places every agent under exactly one domain', () => {
    const g = buildConstellationGraph()
    const agents = g.nodes.filter((n) => n.tier === 'agent')
    expect(agents).toHaveLength(dataset.agents.length)
    const domainIds = new Set(g.domains.map((d) => d.id))
    for (const agent of agents) {
      expect(domainIds.has(agent.parentId!), `${agent.id} parent`).toBe(true)
    }
  })

  it('is a strict tree — every non-core node has exactly one present parent', () => {
    const g = buildConstellationGraph()
    const ids = new Set(g.nodes.map((n) => n.id))
    const roots = g.nodes.filter((n) => !n.parentId)
    expect(roots).toHaveLength(1)
    expect(roots[0].tier).toBe('core')
    for (const node of g.nodes) {
      if (node.parentId) expect(ids.has(node.parentId), `${node.id} parent`).toBe(true)
    }
  })

  it('has no duplicate node ids and no dangling link endpoints', () => {
    const g = buildConstellationGraph()
    const ids = new Set(g.nodes.map((n) => n.id))
    expect(ids.size).toBe(g.nodes.length)
    for (const link of g.links) {
      expect(ids.has(link.source), `${link.id} source`).toBe(true)
      expect(ids.has(link.target), `${link.id} target`).toBe(true)
    }
  })

  it('gives every agent at least one leaf, tagged process or qualityProcedure', () => {
    const g = buildConstellationGraph()
    for (const agent of g.nodes.filter((n) => n.tier === 'agent')) {
      const leaves = g.childrenOf.get(agent.id) ?? []
      expect(leaves.length, `${agent.label} leaves`).toBeGreaterThan(0)
      for (const leaf of leaves) {
        expect(['process', 'qualityProcedure']).toContain(leaf.leafKind)
      }
    }
  })

  it('carries domainId on every node below the core', () => {
    const g = buildConstellationGraph()
    for (const node of g.nodes) {
      if (node.tier === 'core') continue
      expect(node.domainId, `${node.id} domainId`).toBeTruthy()
    }
  })

  it('rolls counts up to the domains', () => {
    const g = buildConstellationGraph()
    for (const domain of g.domains) {
      const agents = g.childrenOf.get(domain.id) ?? []
      expect(domain.metrics.agentCount).toBe(agents.length)
      const leaves = agents.reduce((sum, a) => sum + (g.childrenOf.get(a.id)?.length ?? 0), 0)
      expect(domain.metrics.leafCount).toBe(leaves)
    }
  })

  it('is memoized — repeated calls return the same object', () => {
    expect(buildConstellationGraph()).toBe(buildConstellationGraph())
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/data/constellationGraph.spec.ts`
Expected: FAIL — `Failed to resolve import "./constellationGraph"`.

- [ ] **Step 3: Write the implementation**

Create `src/data/constellationGraph.ts`:

```ts
// The Agent Constellation's graph — a strict four-tier tree over the mock
// dataset: enterprise core → divisions → AI agents → the processes and Quality
// Procedures each agent touches.
//
// Deliberately NOT derived from enterpriseMapGraph.ts: that graph interleaves
// super-departments, departments and sections between a division and its
// agents, and carries nineteen node kinds the constellation has no use for.
// This is a different projection of the same dataset, in the same style as the
// other data/*Aggregates.ts selectors.
import { dataset } from './mockApi'
import { AGENTICITY_ORDER } from './types'

export type ConstellationTier = 'core' | 'domain' | 'agent' | 'leaf'

export interface ConstellationNode {
  id: string
  tier: ConstellationTier
  label: string
  sublabel?: string
  parentId?: string
  /** Route into the real record, where the app has a page for it. */
  href?: string
  /** Owning division — present on every node below the core. */
  domainId?: string
  leafKind?: 'process' | 'qualityProcedure'
  metrics: {
    agenticity?: number
    performance?: number
    agentCount?: number
    leafCount?: number
  }
}

export interface ConstellationLink {
  id: string
  source: string
  target: string
}

export interface ConstellationGraph {
  nodes: ConstellationNode[]
  links: ConstellationLink[]
  /** Tier-1 nodes in stable display order. */
  domains: ConstellationNode[]
  byId: Map<string, ConstellationNode>
  childrenOf: Map<string, ConstellationNode[]>
}

export const CORE_ID = 'core'

const domainId = (id: string) => `dom:${id}`
const agentId = (id: string) => `agt:${id}`
// Leaves are namespaced per agent: the same process can legitimately be worked
// by two agents, and a strict tree needs one parent per node.
const leafId = (kind: string, id: string, ownerId: string) => `${kind}:${id}@${ownerId}`

const agenticityIndex = (level: string) => AGENTICITY_ORDER.indexOf(level as (typeof AGENTICITY_ORDER)[number])

let cached: ConstellationGraph | null = null

export function buildConstellationGraph(): ConstellationGraph {
  if (cached) return cached

  const nodes: ConstellationNode[] = []
  const links: ConstellationLink[] = []
  const add = (node: ConstellationNode) => { nodes.push(node); return node }
  const link = (source: string, target: string) => {
    links.push({ id: `${source}->${target}`, source, target })
  }

  const enterprise = dataset.orgNodes.find((n) => n.level === 'Enterprise')
  add({ id: CORE_ID, tier: 'core', label: enterprise?.name ?? 'DEWA', sublabel: 'AI-native enterprise', metrics: {} })

  const processById = new Map(dataset.processes.map((p) => [p.id, p]))
  const qpById = new Map(dataset.qualityProcedures.map((q) => [q.id, q]))

  const divisions = dataset.orgNodes.filter((n) => n.level === 'Division')
  const domains: ConstellationNode[] = []

  for (const division of divisions) {
    const domId = domainId(division.id)
    const domain = add({
      id: domId,
      tier: 'domain',
      // "Generation & Production Division" reads better as "Generation & Production"
      // at constellation label sizes; the full name stays in the side panel.
      label: division.name.replace(/\s+Division$/, ''),
      sublabel: 'Division',
      parentId: CORE_ID,
      href: '/organization',
      domainId: division.id,
      metrics: { agentCount: 0, leafCount: 0 },
    })
    domains.push(domain)
    link(CORE_ID, domId)

    const divisionAgents = dataset.agents.filter((a) => a.orgAssignment.divisionId === division.id)
    let domainLeafCount = 0

    for (const agent of divisionAgents) {
      const agtId = agentId(agent.id)
      add({
        id: agtId,
        tier: 'agent',
        label: agent.name,
        sublabel: agent.digitalJobTitle,
        parentId: domId,
        href: `/agents/${agent.id}`,
        domainId: division.id,
        metrics: {
          agenticity: agenticityIndex(agent.autonomyLevel),
          performance: agent.performanceScore,
          leafCount: 0,
        },
      })
      link(domId, agtId)

      let agentLeafCount = 0

      for (const processId of agent.assignedProcessIds) {
        const process = processById.get(processId)
        if (!process) continue
        const id = leafId('proc', processId, agent.id)
        add({
          id,
          tier: 'leaf',
          label: process.name,
          sublabel: 'Process',
          parentId: agtId,
          href: `/processes/agenticity/${processId}`,
          domainId: division.id,
          leafKind: 'process',
          metrics: { agenticity: agenticityIndex(process.currentAgenticity) },
        })
        link(agtId, id)
        agentLeafCount += 1
      }

      for (const qpId of agent.assignedQpIds) {
        const qp = qpById.get(qpId)
        if (!qp) continue
        const id = leafId('qp', qpId, agent.id)
        add({
          id,
          tier: 'leaf',
          label: qp.title,
          sublabel: `Quality Procedure · ${qp.status}`,
          parentId: agtId,
          href: `/processes/quality-procedures/${qpId}`,
          domainId: division.id,
          leafKind: 'qualityProcedure',
          metrics: {},
        })
        link(agtId, id)
        agentLeafCount += 1
      }

      const agentNode = nodes[nodes.length - 1 - agentLeafCount]
      agentNode.metrics.leafCount = agentLeafCount
      domainLeafCount += agentLeafCount
    }

    domain.metrics.agentCount = divisionAgents.length
    domain.metrics.leafCount = domainLeafCount
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const childrenOf = new Map<string, ConstellationNode[]>()
  for (const node of nodes) {
    if (!node.parentId) continue
    const siblings = childrenOf.get(node.parentId)
    if (siblings) siblings.push(node)
    else childrenOf.set(node.parentId, [node])
  }

  cached = { nodes, links, domains, byId, childrenOf }
  return cached
}
```

**Note on the `agentNode` lookup:** indexing backwards from the end of `nodes` is fragile. Replace those three lines with a direct reference — capture the node returned by `add()` for the agent and assign to it after the leaf loops:

```ts
      const agentNode = add({ id: agtId, tier: 'agent', /* …as above… */ })
      // …leaf loops…
      agentNode.metrics.leafCount = agentLeafCount
```

Write it the direct way; the backwards index above is shown only to be explicitly rejected.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/data/constellationGraph.spec.ts`
Expected: PASS, 8 tests.

If "gives every agent at least one leaf" fails, some seeded agent has empty `assignedProcessIds` and `assignedQpIds`. Do **not** edit the seed. Instead, weaken that assertion to allow zero leaves and record it in the test name (`gives every agent leaves that are all tagged process or qualityProcedure`), because the layout must handle a childless agent anyway.

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/data/constellationGraph.ts frontend/src/data/constellationGraph.spec.ts
git commit -m "feat: constellation graph selector over the mock dataset"
```

---

### Task 2: Layout geometry

**Files:**
- Create: `src/lib/constellationLayout.js`
- Test: `src/lib/constellationLayout.spec.js`

**Interfaces:**
- Consumes: `ConstellationGraph` from Task 1 (`buildConstellationGraph`, `CORE_ID`).
- Produces:
  - `const RADII = { domain: 190, agent: 330, leaf: 470 }`
  - `function radialLayout(graph, focusDomainId = null)` → `{ positions: Map<string, {x, y, angle}>, viewBox: {x, y, w, h} }`
  - `function neuralLayout(graph, focusDomainId = null)` → same shape (`angle` omitted).
  - `function layoutFor(mode, graph, focusDomainId)` — dispatches on `mode` (`'radial' | 'neural'`).

- [ ] **Step 1: Write the failing test**

Create `src/lib/constellationLayout.spec.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildConstellationGraph, CORE_ID } from '../data/constellationGraph.ts'
import { radialLayout, neuralLayout, layoutFor, RADII } from './constellationLayout.js'

const graph = buildConstellationGraph()
const dist = (p) => Math.hypot(p.x, p.y)

describe('radialLayout', () => {
  it('puts the core at the origin', () => {
    const { positions } = radialLayout(graph)
    expect(positions.get(CORE_ID)).toEqual({ x: 0, y: 0, angle: 0 })
  })

  it('places every node of a tier on that tier’s radius', () => {
    const { positions } = radialLayout(graph)
    for (const node of graph.nodes) {
      if (node.tier === 'core') continue
      expect(dist(positions.get(node.id))).toBeCloseTo(RADII[node.tier], 5)
    }
  })

  it('gives every node a position', () => {
    const { positions } = radialLayout(graph)
    expect(positions.size).toBe(graph.nodes.length)
  })

  it('keeps every child strictly inside its parent’s angular sector', () => {
    const { positions, sectors } = radialLayout(graph)
    for (const node of graph.nodes) {
      if (!node.parentId || node.parentId === CORE_ID) continue
      const sector = sectors.get(node.parentId)
      const angle = positions.get(node.id).angle
      expect(angle, `${node.id}`).toBeGreaterThanOrEqual(sector.start)
      expect(angle, `${node.id}`).toBeLessThanOrEqual(sector.end)
    }
  })

  it('separates same-radius siblings by a minimum angle', () => {
    const { positions } = radialLayout(graph)
    for (const tier of ['domain', 'agent']) {
      const angles = graph.nodes
        .filter((n) => n.tier === tier)
        .map((n) => positions.get(n.id).angle)
        .sort((a, b) => a - b)
      for (let i = 1; i < angles.length; i += 1) {
        expect(angles[i] - angles[i - 1], `${tier} ${i}`).toBeGreaterThan(0)
      }
    }
  })

  it('returns a viewBox containing every position', () => {
    const { positions, viewBox } = radialLayout(graph)
    for (const p of positions.values()) {
      expect(p.x).toBeGreaterThanOrEqual(viewBox.x)
      expect(p.x).toBeLessThanOrEqual(viewBox.x + viewBox.w)
      expect(p.y).toBeGreaterThanOrEqual(viewBox.y)
      expect(p.y).toBeLessThanOrEqual(viewBox.y + viewBox.h)
    }
  })

  it('is deterministic', () => {
    const a = radialLayout(graph)
    const b = radialLayout(graph)
    for (const [id, p] of a.positions) expect(b.positions.get(id)).toEqual(p)
  })

  it('tightens the viewBox around the focused domain', () => {
    const focus = graph.domains[0].id
    const wide = radialLayout(graph).viewBox
    const near = radialLayout(graph, focus).viewBox
    expect(near.w).toBeLessThan(wide.w)
  })
})

describe('neuralLayout', () => {
  it('stacks the tiers top to bottom: leaves above agents above domains above the core', () => {
    const { positions } = neuralLayout(graph, graph.domains[0].id)
    const yOf = (tier) => graph.nodes
      .filter((n) => n.tier === tier && (tier === 'core' || n.domainId === graph.domains[0].domainId))
      .map((n) => positions.get(n.id).y)
    expect(Math.max(...yOf('leaf'))).toBeLessThan(Math.min(...yOf('agent')))
    expect(Math.max(...yOf('agent'))).toBeLessThan(Math.min(...yOf('domain')))
    expect(Math.max(...yOf('domain'))).toBeLessThan(positions.get(CORE_ID).y)
  })

  it('gives every node a position and is deterministic', () => {
    const a = neuralLayout(graph)
    const b = neuralLayout(graph)
    expect(a.positions.size).toBe(graph.nodes.length)
    for (const [id, p] of a.positions) expect(b.positions.get(id)).toEqual(p)
  })
})

describe('layoutFor', () => {
  it('dispatches on mode', () => {
    expect(layoutFor('radial', graph, null).positions.get(CORE_ID).y).toBe(0)
    expect(layoutFor('neural', graph, null).positions.get(CORE_ID).y).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/constellationLayout.spec.js`
Expected: FAIL — `Failed to resolve import "./constellationLayout.js"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/constellationLayout.js`:

```js
// Agent Constellation geometry — pure functions from the constellation graph to
// screen positions. No force simulation, no randomness: same graph in, same
// coordinates out, every time. Both layouts share one coordinate space so
// switching mode is an interpolation rather than a rebuild.
import { CORE_ID } from '../data/constellationGraph.ts'

export const RADII = { domain: 190, agent: 330, leaf: 470 }

const TAU = Math.PI * 2
// Start at -90° so the first division sits at the top of the ring.
const START_ANGLE = -Math.PI / 2
// Each parent keeps a little of its sector clear at both ends, so adjacent
// families read as separate fans rather than one continuous band.
const SECTOR_INSET = 0.12

const polar = (radius, angle) => ({
  x: Math.round(Math.cos(angle) * radius * 1000) / 1000,
  y: Math.round(Math.sin(angle) * radius * 1000) / 1000,
  angle,
})

/** Spread `count` items evenly across [start, end], centred, never on the edges. */
function spread(start, end, count) {
  if (count === 0) return []
  const span = end - start
  const step = span / count
  return Array.from({ length: count }, (_, i) => start + step * (i + 0.5))
}

function boundingViewBox(points, margin) {
  if (points.length === 0) return { x: -margin, y: -margin, w: margin * 2, h: margin * 2 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs) - margin
  const minY = Math.min(...ys) - margin
  return { x: minX, y: minY, w: Math.max(...xs) + margin - minX, h: Math.max(...ys) + margin - minY }
}

export function radialLayout(graph, focusDomainId = null) {
  const positions = new Map()
  const sectors = new Map()

  positions.set(CORE_ID, { x: 0, y: 0, angle: 0 })

  const domainSpan = TAU / graph.domains.length
  graph.domains.forEach((domain, i) => {
    const centre = START_ANGLE + domainSpan * i + domainSpan / 2
    const half = (domainSpan / 2) * (1 - SECTOR_INSET)
    sectors.set(domain.id, { start: centre - half, end: centre + half })
    positions.set(domain.id, polar(RADII.domain, centre))

    const agents = graph.childrenOf.get(domain.id) ?? []
    const agentAngles = spread(centre - half, centre + half, agents.length)
    agents.forEach((agent, j) => {
      const angle = agentAngles[j]
      positions.set(agent.id, polar(RADII.agent, angle))

      const agentHalf = (half / Math.max(agents.length, 1)) * (1 - SECTOR_INSET)
      sectors.set(agent.id, { start: angle - agentHalf, end: angle + agentHalf })

      const leaves = graph.childrenOf.get(agent.id) ?? []
      const leafAngles = spread(angle - agentHalf, angle + agentHalf, leaves.length)
      leaves.forEach((leaf, k) => positions.set(leaf.id, polar(RADII.leaf, leafAngles[k])))
    })
  })

  const focusPoints = focusDomainId
    ? graph.nodes
        .filter((n) => n.id === focusDomainId || n.domainId === graph.byId.get(focusDomainId)?.domainId)
        .map((n) => positions.get(n.id))
        .filter(Boolean)
        .concat([{ x: 0, y: 0 }])
    : [...positions.values()]

  return { positions, sectors, viewBox: boundingViewBox(focusPoints, 90) }
}

const ROWS = { leaf: 0, agent: 260, domain: 480, core: 660 }
const COLUMN_GAP = 120

export function neuralLayout(graph, focusDomainId = null) {
  const positions = new Map()
  const visible = focusDomainId
    ? graph.domains.filter((d) => d.id === focusDomainId)
    : graph.domains

  // Lay each visible domain out as its own column block, left to right.
  let cursor = 0
  const domainCentres = []

  for (const domain of visible) {
    const agents = graph.childrenOf.get(domain.id) ?? []
    const blockStart = cursor

    for (const agent of agents) {
      const leaves = graph.childrenOf.get(agent.id) ?? []
      const leafXs = leaves.map((_, i) => cursor + i * COLUMN_GAP)
      leaves.forEach((leaf, i) => positions.set(leaf.id, { x: leafXs[i], y: ROWS.leaf }))
      const agentX = leaves.length > 0
        ? (leafXs[0] + leafXs[leafXs.length - 1]) / 2
        : cursor
      positions.set(agent.id, { x: agentX, y: ROWS.agent })
      cursor += Math.max(leaves.length, 1) * COLUMN_GAP + COLUMN_GAP
    }

    const blockEnd = cursor - COLUMN_GAP
    const centre = agents.length > 0 ? (blockStart + blockEnd) / 2 : blockStart
    positions.set(domain.id, { x: centre, y: ROWS.domain })
    domainCentres.push(centre)
    cursor += COLUMN_GAP * 2
  }

  // Anything not in the visible set still needs a position (nodes are rendered
  // dimmed, not unmounted, so the mode switch can animate). Park it on its
  // domain's spot, or the core's, so it collapses inward instead of jumping.
  const coreX = domainCentres.length > 0
    ? (Math.min(...domainCentres) + Math.max(...domainCentres)) / 2
    : 0
  positions.set(CORE_ID, { x: coreX, y: ROWS.core })

  for (const node of graph.nodes) {
    if (positions.has(node.id)) continue
    const fallback = positions.get(node.parentId ?? CORE_ID) ?? { x: coreX, y: ROWS.core }
    positions.set(node.id, { x: fallback.x, y: fallback.y })
  }

  return { positions, sectors: new Map(), viewBox: boundingViewBox([...positions.values()], 120) }
}

export function layoutFor(mode, graph, focusDomainId = null) {
  return mode === 'neural' ? neuralLayout(graph, focusDomainId) : radialLayout(graph, focusDomainId)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/constellationLayout.spec.js`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/constellationLayout.js frontend/src/lib/constellationLayout.spec.js
git commit -m "feat: radial and neural constellation geometry"
```

---

### Task 3: Colours and the core mark

**Files:**
- Create: `src/pages/agent-constellation/constellationColors.js`
- Create: `src/pages/agent-constellation/ConstellationCore.jsx`
- Create: `src/pages/agent-constellation/constellation.css`

**Interfaces:**
- Consumes: `categorical`, `status`, `axisText`, `gridColor` from `src/lib/chartColors.js`.
- Produces:
  - `function domainColor(mode, index)` — the four division colours, by display index.
  - `function nodeColor(mode, node, domainIndex)` — colour for any node.
  - `function nodeRadius(node)` — mark radius per tier (`core` 0, `domain` 13, `agent` 8, `leaf` 3.6).
  - `function legendEntries(mode, domains)` — `[{ color, label, shape }]`.
  - `<ConstellationCore mode radius reduced />` — the core cluster mark.

- [ ] **Step 1: Write `constellationColors.js`**

```js
// Constellation mark colours. Tier is an identity, so it takes the categorical
// palette (one fixed colour per division, reused wherever that division
// appears). Agenticity is an ordered level, so leaves take the status ramp —
// never the categorical palette (dataviz skill: don't colour a magnitude with
// categorical hues).
import { categorical, status, axisText } from '../../lib/chartColors.js'

export function domainColor(mode, index) {
  const c = categorical(mode)
  // Four visually distinct, non-adjacent slots from the validated palette.
  return [c[0], c[2], c[3], c[6]][index % 4]
}

export function nodeColor(mode, node, domainIndex) {
  if (node.tier === 'core') return axisText(mode)
  if (node.tier === 'domain' || node.tier === 'agent') return domainColor(mode, domainIndex)
  const s = status(mode)
  if (node.leafKind === 'qualityProcedure') return axisText(mode)
  const level = node.metrics.agenticity
  if (level == null) return axisText(mode)
  return level >= 4 ? s.good : level >= 2 ? s.warning : s.critical
}

// Tier is also encoded in size, so colour is never the only carrier.
export function nodeRadius(node) {
  return { core: 0, domain: 13, agent: 8, leaf: 3.6 }[node.tier] ?? 4
}

export function legendEntries(mode, domains) {
  const s = status(mode)
  const neutral = axisText(mode)
  return [
    ...domains.map((d, i) => ({ color: domainColor(mode, i), label: d.label, shape: 'domain' })),
    { color: s.good, label: 'Process at L4+ (agent-led)', shape: 'leaf' },
    { color: s.warning, label: 'Process at L2–L3 (AI-assisted)', shape: 'leaf' },
    { color: s.critical, label: 'Process at L0–L1 (manual)', shape: 'leaf' },
    { color: neutral, label: 'Quality Procedure', shape: 'leaf' },
  ]
}
```

- [ ] **Step 2: Write `ConstellationCore.jsx`**

```jsx
// The enterprise core — a dense cluster of small marks rather than a blur glow
// (DESIGN.md forbids glow borders and glassmorphism). Positions come from a
// fixed deterministic spiral, so the cluster is identical on every render and
// screenshots are stable.
import { useMemo } from 'react'
import { axisText } from '../../lib/chartColors.js'

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

export function ConstellationCore({ mode, radius = 74, count = 180, reduced }) {
  const marks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = radius * Math.sqrt((i + 0.5) / count)
        const angle = i * GOLDEN
        return {
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          size: 0.7 + (i % 5) * 0.28,
          delay: (i % 12) * 0.35,
        }
      }),
    [radius, count],
  )
  const color = axisText(mode)

  return (
    <g className="cn-core" aria-hidden="true">
      <circle r={radius + 14} className="cn-core-ring" />
      {marks.map((m, i) => (
        <circle
          key={i}
          cx={m.x}
          cy={m.y}
          r={m.size}
          fill={color}
          className={reduced ? undefined : 'cn-core-mark'}
          style={reduced ? undefined : { animationDelay: `${m.delay}s` }}
        />
      ))}
    </g>
  )
}
```

- [ ] **Step 3: Write `constellation.css`**

```css
/* Agent Constellation canvas. All motion is CSS and stops dead under
   prefers-reduced-motion — the repo's headless verification scripts screenshot
   this canvas and need it to settle deterministically. */

.cn-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.cn-viewport {
  transition: transform 620ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.cn-core-ring {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 1;
  stroke-dasharray: 3 5;
  opacity: 0.7;
}

.cn-core-mark {
  opacity: 0.55;
  animation: cn-breathe 6s ease-in-out infinite;
}

@keyframes cn-breathe {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.8; }
}

.cn-link {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 1;
  transition: opacity 320ms ease-out, stroke 320ms ease-out;
}

.cn-link-core {
  stroke-dasharray: 2 6;
  animation: cn-flow 3.4s linear infinite;
}

@keyframes cn-flow {
  to { stroke-dashoffset: -16; }
}

.cn-node {
  transition: transform 620ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 320ms ease-out;
  cursor: pointer;
}

.cn-node:focus-visible .cn-node-mark {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.cn-node-mark {
  transition: r 260ms ease-out, opacity 320ms ease-out;
}

.cn-dim { opacity: 0.16; }
.cn-muted { opacity: 0.42; }

.cn-label {
  font-family: var(--font-family-mono, "JetBrains Mono", monospace);
  font-size: 10px;
  letter-spacing: 0.02em;
  fill: var(--color-text-secondary);
  pointer-events: none;
  transition: opacity 320ms ease-out;
}

.cn-label-domain {
  font-size: 12px;
  font-weight: 600;
  fill: var(--color-text-primary);
  text-transform: uppercase;
}

.cn-focus-title {
  font-family: var(--font-family-mono, "JetBrains Mono", monospace);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: var(--color-text-primary);
}

.cn-grid { stroke-width: 1; opacity: 0.32; }

@media (prefers-reduced-motion: reduce) {
  .cn-viewport,
  .cn-node,
  .cn-node-mark,
  .cn-link { transition: none; }
  .cn-core-mark,
  .cn-link-core { animation: none; }
  .cn-core-mark { opacity: 0.55; }
}
```

- [ ] **Step 4: Verify it compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds (nothing imports these yet, so this only proves syntax).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/agent-constellation/
git commit -m "feat: constellation colour scale, core mark and canvas styles"
```

---

### Task 4: The canvas

**Files:**
- Create: `src/pages/agent-constellation/ConstellationCanvas.jsx`

**Interfaces:**
- Consumes: `layoutFor`, `RADII` (Task 2); `nodeColor`, `nodeRadius`, `domainColor` (Task 3); `ConstellationCore` (Task 3); `useChartMode` from `src/lib/useChartMode.js`; `useReducedMotionSafe` from `src/dewa/useReducedMotionSafe.js`.
- Produces: `<ConstellationCanvas graph mode focusDomainId hoveredId selectedId query onHover onSelect onFocusDomain />` — pure presentation, owns no state but hover-free rendering.

- [ ] **Step 1: Write the component**

```jsx
// The constellation SVG. Renders positions from constellationLayout — it owns
// no layout maths and no interaction state, so both are testable without a DOM.
//
// The whole scene lives in one <g> whose transform is driven by the layout's
// viewBox; focusing a domain animates that transform rather than re-laying out,
// which is what makes the zoom read as a camera move.
import { useMemo } from 'react'
import { layoutFor } from '../../lib/constellationLayout.js'
import { nodeColor, nodeRadius, domainColor } from './constellationColors.js'
import { ConstellationCore } from './ConstellationCore.jsx'
import { useChartMode } from '../../lib/useChartMode.js'
import { useReducedMotionSafe } from '../../dewa/useReducedMotionSafe.js'
import { gridColor } from '../../lib/chartColors.js'
import { CORE_ID } from '../../data/constellationGraph.ts'

const VIEW_W = 1200
const VIEW_H = 820

/** Ancestors + descendants of `id` — the branch a hover lights up. */
function branchOf(graph, id) {
  if (!id) return null
  const branch = new Set([id])
  let cursor = graph.byId.get(id)
  while (cursor?.parentId) {
    branch.add(cursor.parentId)
    cursor = graph.byId.get(cursor.parentId)
  }
  const walk = (nodeId) => {
    for (const child of graph.childrenOf.get(nodeId) ?? []) {
      branch.add(child.id)
      walk(child.id)
    }
  }
  walk(id)
  return branch
}

export function ConstellationCanvas({
  graph, mode, focusDomainId, hoveredId, selectedId, query,
  onHover, onSelect, onFocusDomain,
}) {
  const chartMode = useChartMode()
  const reduced = useReducedMotionSafe()

  const { positions, viewBox } = useMemo(
    () => layoutFor(mode, graph, focusDomainId),
    [mode, graph, focusDomainId],
  )

  const domainIndexOf = useMemo(() => {
    const map = new Map()
    graph.domains.forEach((d, i) => map.set(d.domainId, i))
    return map
  }, [graph])

  const branch = useMemo(() => branchOf(graph, hoveredId ?? selectedId), [graph, hoveredId, selectedId])

  const matches = useMemo(() => {
    const q = query?.trim().toLowerCase()
    if (!q) return null
    return new Set(
      graph.nodes
        .filter((n) => `${n.label} ${n.sublabel ?? ''}`.toLowerCase().includes(q))
        .map((n) => n.id),
    )
  }, [graph, query])

  // Fit the layout's own bounds into a fixed viewport, so the SVG can keep a
  // constant viewBox (stable text size) while the camera moves.
  const scale = Math.min(VIEW_W / viewBox.w, VIEW_H / viewBox.h)
  const tx = VIEW_W / 2 - (viewBox.x + viewBox.w / 2) * scale
  const ty = VIEW_H / 2 - (viewBox.y + viewBox.h / 2) * scale

  const focusDomain = focusDomainId ? graph.byId.get(focusDomainId) : null

  const stateClass = (node) => {
    if (matches && !matches.has(node.id)) return 'cn-dim'
    if (focusDomain && node.tier !== 'core' && node.domainId !== focusDomain.domainId) return 'cn-dim'
    if (branch && !branch.has(node.id)) return 'cn-muted'
    return ''
  }

  const showLabel = (node) => {
    if (node.tier === 'domain') return true
    if (node.tier === 'agent') return Boolean(focusDomain) && node.domainId === focusDomain.domainId
    return false
  }

  const grid = gridColor(chartMode)

  return (
    <svg
      className="cn-canvas"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={
        focusDomain
          ? `${focusDomain.label} division: ${focusDomain.metrics.agentCount} AI agents across ${focusDomain.metrics.leafCount} processes and Quality Procedures.`
          : `AI agent constellation: ${graph.domains.length} divisions, ${graph.nodes.filter((n) => n.tier === 'agent').length} agents, ${graph.nodes.filter((n) => n.tier === 'leaf').length} processes and Quality Procedures.`
      }
    >
      <defs>
        <pattern id="cn-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={grid} className="cn-grid" />
        </pattern>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill="url(#cn-grid)" />

      <g className="cn-viewport" transform={`translate(${tx} ${ty}) scale(${scale})`}>
        <ConstellationCore mode={chartMode} reduced={reduced} />

        {graph.links.map((link) => {
          const a = positions.get(link.source)
          const b = positions.get(link.target)
          if (!a || !b) return null
          const target = graph.byId.get(link.target)
          const isCoreLink = link.source === CORE_ID
          const dimmed = stateClass(target)
          return (
            <line
              key={link.id}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              className={`cn-link ${isCoreLink && !reduced ? 'cn-link-core' : ''} ${dimmed}`}
              stroke={
                branch?.has(link.target) && branch?.has(link.source)
                  ? domainColor(chartMode, domainIndexOf.get(target?.domainId) ?? 0)
                  : undefined
              }
            />
          )
        })}

        {graph.nodes.map((node) => {
          if (node.tier === 'core') return null
          const p = positions.get(node.id)
          if (!p) return null
          const index = domainIndexOf.get(node.domainId) ?? 0
          const isFocusedDomain = node.id === focusDomainId
          return (
            <g
              key={node.id}
              className={`cn-node ${stateClass(node)}`}
              transform={`translate(${p.x} ${p.y})`}
              tabIndex={node.tier === 'leaf' ? -1 : 0}
              role="button"
              aria-label={`${node.label}${node.sublabel ? `, ${node.sublabel}` : ''}`}
              onMouseEnter={() => onHover(node.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(node.id)}
              onBlur={() => onHover(null)}
              onClick={() => (node.tier === 'domain' ? onFocusDomain(node.id) : onSelect(node.id))}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                if (node.tier === 'domain') onFocusDomain(node.id)
                else onSelect(node.id)
              }}
            >
              <circle
                className="cn-node-mark"
                r={nodeRadius(node) * (isFocusedDomain ? 1.35 : 1)}
                fill={nodeColor(chartMode, node, index)}
                fillOpacity={node.tier === 'leaf' ? 0.9 : 1}
                stroke="var(--color-background-body)"
                strokeWidth={node.tier === 'leaf' ? 1 : 2}
              />
              {showLabel(node) && (
                <text
                  className={`cn-label ${node.tier === 'domain' ? 'cn-label-domain' : ''}`}
                  y={nodeRadius(node) + 15}
                  textAnchor="middle"
                >
                  {node.label}
                </text>
              )}
            </g>
          )
        })}
      </g>

      {focusDomain && (
        <text className="cn-focus-title" x={VIEW_W / 2} y={54} textAnchor="middle">
          {focusDomain.label}
        </text>
      )}
    </svg>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/agent-constellation/ConstellationCanvas.jsx
git commit -m "feat: constellation SVG canvas with branch highlight and focus camera"
```

---

### Task 5: Page shell, route and nav

**Files:**
- Create: `src/pages/agent-constellation/AgentConstellation.jsx`
- Create: `src/pages/agent-constellation/DomainCarousel.jsx`
- Modify: `src/app/router.jsx` — add the import and the route
- Modify: `src/app/nav.jsx` — add the icon and the `CONTROL_TOWER_NAV` entry

**Interfaces:**
- Consumes: `buildConstellationGraph` (Task 1), `ConstellationCanvas` (Task 4).
- Produces: default-exported `<AgentConstellation />`; `<DomainCarousel domains activeId onChange onExit />`.

- [ ] **Step 1: Write `DomainCarousel.jsx`**

```jsx
// The ‹ Division › pill that cycles focus between the four divisions.
import { Text } from '@astryxdesign/core/Text'
import { IconButton } from '@astryxdesign/core/IconButton'

const chevron = (d) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export function DomainCarousel({ domains, activeId, onChange }) {
  const index = domains.findIndex((d) => d.id === activeId)
  if (index < 0) return null
  const step = (delta) => onChange(domains[(index + delta + domains.length) % domains.length].id)

  return (
    <div className="cn-carousel" role="group" aria-label="Division focus">
      <IconButton label="Previous division" icon={chevron('M15 18l-6-6 6-6')} variant="ghost" size="sm" onClick={() => step(-1)} />
      <Text weight="medium" size="sm">{domains[index].label}</Text>
      <IconButton label="Next division" icon={chevron('M9 18l6-6-6-6')} variant="ghost" size="sm" onClick={() => step(1)} />
    </div>
  )
}
```

- [ ] **Step 2: Append the carousel styles to `constellation.css`**

```css
.cn-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 260px;
  gap: var(--spacing-4);
  align-items: stretch;
}

.cn-stage {
  position: relative;
  min-height: 620px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 15px);
  background: var(--color-background-surface);
  overflow: hidden;
}

.cn-shell.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 60;
  padding: var(--spacing-4);
  background: var(--color-background-body);
}

.cn-carousel {
  position: absolute;
  left: 50%;
  bottom: var(--spacing-4);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  background: var(--color-background-body);
}

.cn-stage-controls {
  position: absolute;
  top: var(--spacing-3);
  right: var(--spacing-3);
  display: flex;
  gap: var(--spacing-2);
}

@media (max-width: 1100px) {
  .cn-shell { grid-template-columns: minmax(0, 1fr); }
}
```

- [ ] **Step 3: Write `AgentConstellation.jsx`**

```jsx
// Agent Constellation — the AI agent workforce as one picture: the enterprise
// core, its four divisions, the agents each runs, and the processes and Quality
// Procedures those agents touch.
//
// Complements /enterprise-map rather than replacing it: that map is the
// analytical surface (nineteen entity kinds, ten lenses); this is the
// presentation surface.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import { Button } from '@astryxdesign/core/Button'
import { buildConstellationGraph } from '../../data/constellationGraph.ts'
import { ConstellationCanvas } from './ConstellationCanvas.jsx'
import { DomainCarousel } from './DomainCarousel.jsx'
import './constellation.css'

const MODES = [
  { id: 'radial', label: 'Radial' },
  { id: 'neural', label: 'Neural' },
]

export default function AgentConstellation() {
  const graph = useMemo(() => buildConstellationGraph(), [])
  const [mode, setMode] = useState('radial')
  const [focusDomainId, setFocusDomainId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  const focusDomain = focusDomainId ? graph.byId.get(focusDomainId) : null

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (selectedId) setSelectedId(null)
      else if (fullscreen) setFullscreen(false)
      else setFocusDomainId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, fullscreen])

  const onFocusDomain = useCallback(
    (id) => setFocusDomainId((current) => (current === id ? null : id)),
    [],
  )

  return (
    <div>
      <Heading level={1} size="xl">Agent Constellation</Heading>
      <Text color="secondary">
        Every AI agent DEWA runs, the division that owns it, and the processes and
        Quality Procedures it touches — in one picture.
      </Text>

      <HStack gap="2" style={{ margin: 'var(--spacing-4) 0' }}>
        {MODES.map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant={mode === m.id ? 'primary' : 'secondary'}
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
          >
            {m.label}
          </Button>
        ))}
        {focusDomain && (
          <Button size="sm" variant="ghost" onClick={() => setFocusDomainId(null)}>
            Back to all divisions
          </Button>
        )}
      </HStack>

      <div className={`cn-shell ${fullscreen ? 'is-fullscreen' : ''}`}>
        <div /* left panel lands here in Task 6 */ />

        <div className="cn-stage">
          <ConstellationCanvas
            graph={graph}
            mode={mode}
            focusDomainId={focusDomainId}
            hoveredId={hoveredId}
            selectedId={selectedId}
            query={query}
            onHover={setHoveredId}
            onSelect={setSelectedId}
            onFocusDomain={onFocusDomain}
          />
          <div className="cn-stage-controls">
            <Button size="sm" variant="secondary" onClick={() => setFullscreen((v) => !v)}>
              {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </Button>
          </div>
          {focusDomain && (
            <DomainCarousel domains={graph.domains} activeId={focusDomainId} onChange={setFocusDomainId} />
          )}
          <p aria-live="polite" className="sr-only">
            {focusDomain ? `Focused on ${focusDomain.label} division.` : 'Showing all divisions.'}
          </p>
        </div>

        <div /* right panel lands here in Task 6 */ />
      </div>
    </div>
  )
}
```

If `.sr-only` is not already defined in `src/styles/app.css`, add it there:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

Check first with `grep -rn "sr-only" frontend/src/styles/` and only add it if missing.

- [ ] **Step 4: Wire the route**

In `src/app/router.jsx`, add the import beside the other page imports:

```jsx
import AgentConstellation from "../pages/agent-constellation/AgentConstellation.jsx"
```

and the route inside the `children` array, immediately after the `strategic-alignment` block:

```jsx
      { path: "agent-constellation", element: <AgentConstellation /> },
```

- [ ] **Step 5: Wire the nav**

In `src/app/nav.jsx`, add to the `Icons` object:

```jsx
  constellation: icon(<circle key="a" cx="12" cy="12" r="2.2" />, <circle key="b" cx="12" cy="12" r="6.2" />, <circle key="c" cx="12" cy="12" r="10" strokeDasharray="2 3" />),
```

and add this entry to `CONTROL_TOWER_NAV`, immediately **before** the `/enterprise-map` entry:

```jsx
  { path: '/agent-constellation', label: 'Agent Constellation', icon: Icons.constellation },
```

- [ ] **Step 6: Verify in the browser**

Run: `cd frontend && npm run dev`
Open `http://localhost:3400/#/agent-constellation`.
Expected: the radial constellation renders — core cluster at centre, four labelled division marks, agents on the middle ring, small leaf dots on the outer ring. Hovering a mark lights its branch and mutes the rest. Clicking a division zooms in, shows the title and the carousel; `Esc` exits. The `Neural` tab re-lays the graph top-down. The nav entry appears above "Final Enterprise Map".

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/agent-constellation/ frontend/src/app/router.jsx frontend/src/app/nav.jsx frontend/src/styles/app.css
git commit -m "feat: Agent Constellation page, route and nav entry"
```

---

### Task 6: Directory and legend panels

**Files:**
- Create: `src/pages/agent-constellation/ConstellationDirectory.jsx`
- Create: `src/pages/agent-constellation/ConstellationLegend.jsx`
- Modify: `src/pages/agent-constellation/AgentConstellation.jsx` — replace the two placeholder `<div />`s
- Modify: `src/pages/agent-constellation/constellation.css` — append panel styles

**Interfaces:**
- Consumes: `legendEntries`, `domainColor` (Task 3); `useChartMode`.
- Produces:
  - `<ConstellationDirectory graph query onQueryChange focusDomainId onFocusDomain />`
  - `<ConstellationLegend graph selectedId onSelect />`

- [ ] **Step 1: Write `ConstellationDirectory.jsx`**

```jsx
// Left panel — what is in the constellation, and a search that filters it.
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { domainColor } from './constellationColors.js'
import { useChartMode } from '../../lib/useChartMode.js'

export function ConstellationDirectory({ graph, query, onQueryChange, focusDomainId, onFocusDomain }) {
  const mode = useChartMode()
  const agentTotal = graph.nodes.filter((n) => n.tier === 'agent').length
  const leafTotal = graph.nodes.filter((n) => n.tier === 'leaf').length
  const maxAgents = Math.max(1, ...graph.domains.map((d) => d.metrics.agentCount))

  return (
    <aside className="cn-panel" aria-label="Constellation directory">
      <span className="eyebrow">Directory</span>

      <div className="cn-stat-row">
        <div className="cn-stat"><b>{graph.domains.length}</b><span>Divisions</span></div>
        <div className="cn-stat"><b>{agentTotal}</b><span>AI agents</span></div>
        <div className="cn-stat"><b>{leafTotal}</b><span>Processes &amp; QPs</span></div>
      </div>

      <TextInput
        label="Search the constellation"
        placeholder="Search agents, processes…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <span className="eyebrow" style={{ marginTop: 'var(--spacing-4)' }}>Agents per division</span>
      <ul className="cn-bars">
        {graph.domains.map((domain, i) => (
          <li key={domain.id}>
            <button
              type="button"
              className={`cn-bar-row ${focusDomainId === domain.id ? 'is-active' : ''}`}
              onClick={() => onFocusDomain(domain.id)}
              aria-pressed={focusDomainId === domain.id}
            >
              <Text size="sm">{domain.label}</Text>
              <span className="cn-bar-track">
                <span
                  className="cn-bar-fill"
                  style={{
                    width: `${(domain.metrics.agentCount / maxAgents) * 100}%`,
                    background: domainColor(mode, i),
                  }}
                />
              </span>
              <span className="cn-bar-value">{domain.metrics.agentCount}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
```

- [ ] **Step 2: Write `ConstellationLegend.jsx`**

```jsx
// Right panel — the colour key, then the full agent roster. Selecting a roster
// row drives the same selection state as clicking a mark on the canvas.
import { Text } from '@astryxdesign/core/Text'
import { legendEntries, domainColor } from './constellationColors.js'
import { useChartMode } from '../../lib/useChartMode.js'

export function ConstellationLegend({ graph, selectedId, onSelect }) {
  const mode = useChartMode()
  const entries = legendEntries(mode, graph.domains)
  const domainIndex = new Map(graph.domains.map((d, i) => [d.domainId, i]))
  const agents = graph.nodes.filter((n) => n.tier === 'agent')

  return (
    <aside className="cn-panel" aria-label="Legend and agent roster">
      <span className="eyebrow">Legend</span>
      <ul className="cn-legend">
        {entries.map((entry) => (
          <li key={entry.label}>
            <span
              className="cn-swatch"
              style={{ background: entry.color, width: entry.shape === 'domain' ? 11 : 7, height: entry.shape === 'domain' ? 11 : 7 }}
            />
            <Text size="sm" color="secondary">{entry.label}</Text>
          </li>
        ))}
      </ul>

      <span className="eyebrow" style={{ marginTop: 'var(--spacing-4)' }}>
        Agent roster ({agents.length})
      </span>
      <ul className="cn-roster">
        {agents.map((agent) => (
          <li key={agent.id}>
            <button
              type="button"
              className={`cn-roster-row ${selectedId === agent.id ? 'is-active' : ''}`}
              onClick={() => onSelect(agent.id)}
              aria-pressed={selectedId === agent.id}
            >
              <span className="cn-swatch" style={{ background: domainColor(mode, domainIndex.get(agent.domainId) ?? 0) }} />
              <span className="cn-roster-label">
                <Text size="sm" weight="medium">{agent.label}</Text>
                <Text size="xs" color="secondary">{agent.sublabel}</Text>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
```

- [ ] **Step 3: Append the panel styles to `constellation.css`**

```css
.cn-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 15px);
  background: var(--color-background-surface);
  max-height: 720px;
  overflow-y: auto;
}

.cn-stat-row { display: flex; gap: var(--spacing-3); flex-wrap: wrap; }

.cn-stat { display: flex; flex-direction: column; }
.cn-stat b {
  font-family: var(--font-family-mono, "JetBrains Mono", monospace);
  font-size: 20px;
  line-height: 1.1;
}
.cn-stat span { font-size: 11px; color: var(--color-text-secondary); }

.cn-bars, .cn-legend, .cn-roster { list-style: none; margin: 0; padding: 0; }
.cn-legend li { display: flex; align-items: center; gap: var(--spacing-2); padding: 3px 0; }

.cn-swatch { display: inline-block; width: 9px; height: 9px; border-radius: 50%; flex: none; }

.cn-bar-row, .cn-roster-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: 6px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm, 7px);
  background: none;
  text-align: left;
  cursor: pointer;
}
.cn-bar-row:hover, .cn-roster-row:hover { background: var(--color-background-subtle, var(--color-background-body)); }
.cn-bar-row.is-active, .cn-roster-row.is-active { border-color: var(--color-accent); }
.cn-bar-row:focus-visible, .cn-roster-row:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }

.cn-bar-track { flex: 1; height: 6px; border-radius: 100px; background: var(--color-border); overflow: hidden; }
.cn-bar-fill { display: block; height: 100%; border-radius: 100px; }
.cn-bar-value { font-family: var(--font-family-mono, "JetBrains Mono", monospace); font-size: 12px; min-width: 18px; text-align: right; }

.cn-roster-label { display: flex; flex-direction: column; min-width: 0; }
```

- [ ] **Step 4: Wire the panels into the page**

In `AgentConstellation.jsx`, add the imports:

```jsx
import { ConstellationDirectory } from './ConstellationDirectory.jsx'
import { ConstellationLegend } from './ConstellationLegend.jsx'
```

Replace `<div /* left panel lands here in Task 6 */ />` with:

```jsx
        <ConstellationDirectory
          graph={graph}
          query={query}
          onQueryChange={setQuery}
          focusDomainId={focusDomainId}
          onFocusDomain={onFocusDomain}
        />
```

Replace `<div /* right panel lands here in Task 6 */ />` with:

```jsx
        <ConstellationLegend graph={graph} selectedId={selectedId} onSelect={setSelectedId} />
```

- [ ] **Step 5: Verify in the browser**

Run: `cd frontend && npm run dev`, open `#/agent-constellation`.
Expected: left panel shows 4 / 15 / N counts, a search box that dims non-matching marks as you type, and four clickable division bars; right panel shows the colour key and all 15 agents, and clicking a roster row selects that agent on the canvas.

If `TextInput` is not an `@astryxdesign/core` export, check the real name first with `grep -rn "from '@astryxdesign/core/" frontend/src --include=*.jsx | grep -i "input\|field"` and use whatever the codebase already uses.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/agent-constellation/
git commit -m "feat: constellation directory and legend panels"
```

---

### Task 7: Detail side panel

**Files:**
- Create: `src/pages/agent-constellation/ConstellationDetailPanel.jsx`
- Modify: `src/pages/agent-constellation/AgentConstellation.jsx` — render the panel

**Interfaces:**
- Consumes: `SidePanel` from `src/components/SidePanel.jsx`; `dataset` from `src/data/mockApi.ts`.
- Produces: `<ConstellationDetailPanel graph nodeId onClose />`.

- [ ] **Step 1: Write the panel**

```jsx
// Detail for a selected constellation node. Deliberately thin: it summarises
// and then hands off to the module that actually owns the record, rather than
// duplicating the agent or process page here.
import { useNavigate } from 'react-router-dom'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { SidePanel } from '../../components/SidePanel.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { AGENTICITY_ORDER } from '../../data/types.ts'

const TIER_LABELS = { domain: 'Division', agent: 'AI agent', leaf: 'Work item' }

export function ConstellationDetailPanel({ graph, nodeId, onClose }) {
  const navigate = useNavigate()
  const node = nodeId ? graph.byId.get(nodeId) : null
  const children = node ? graph.childrenOf.get(node.id) ?? [] : []

  return (
    <SidePanel
      isOpen={Boolean(node)}
      onClose={onClose}
      eyebrow={node ? TIER_LABELS[node.tier] : undefined}
      title={node?.label ?? ''}
    >
      {node && (
        <>
          {node.sublabel && <Text color="secondary">{node.sublabel}</Text>}

          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', margin: 'var(--spacing-3) 0' }}>
            {node.metrics.agenticity != null && (
              <Badge label={`Agenticity ${AGENTICITY_ORDER[node.metrics.agenticity]}`} variant="info" />
            )}
            {node.metrics.performance != null && (
              <Badge label={`Performance ${node.metrics.performance}`} variant="neutral" />
            )}
            {node.metrics.agentCount != null && (
              <Badge label={`${node.metrics.agentCount} agents`} variant="neutral" />
            )}
            {node.metrics.leafCount != null && (
              <Badge label={`${node.metrics.leafCount} processes & QPs`} variant="neutral" />
            )}
          </div>

          {children.length > 0 && (
            <>
              <span className="eyebrow">Connected ({children.length})</span>
              <ul style={{ listStyle: 'none', margin: '4px 0 var(--spacing-4)', padding: 0 }}>
                {children.map((child) => (
                  <li key={child.id} style={{ padding: '3px 0' }}>
                    <Text size="sm">{child.label}</Text>
                  </li>
                ))}
              </ul>
            </>
          )}

          {node.href && (
            <DewaButton variant="primary" onClick={() => navigate(node.href)}>
              Open in the Control Tower
            </DewaButton>
          )}
        </>
      )}
    </SidePanel>
  )
}
```

Confirm `DewaButton`'s export shape first: `grep -n "export" frontend/src/dewa/DewaButton.jsx`. If it is a default export, adjust the import accordingly.

- [ ] **Step 2: Render it from the page**

In `AgentConstellation.jsx`, add the import and render it just before the closing `</div>` of the component:

```jsx
import { ConstellationDetailPanel } from './ConstellationDetailPanel.jsx'
```

```jsx
      <ConstellationDetailPanel graph={graph} nodeId={selectedId} onClose={() => setSelectedId(null)} />
```

- [ ] **Step 3: Verify in the browser**

Run: `cd frontend && npm run dev`, open `#/agent-constellation`.
Expected: clicking an agent mark or a roster row opens the slide-in panel with badges, its connected work items, and a button that navigates to `/agents/AGT-…`. `Esc` closes it. Clicking a leaf dot opens the panel for that process or Quality Procedure.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/agent-constellation/
git commit -m "feat: constellation detail side panel"
```

---

### Task 8: Verification and documentation

**Files:**
- Modify: `PROJECT.md` — add a step entry and update Current state
- Modify: `frontend/public/journey-data.json` — add the milestone
- Modify: `README.md` — add the section to the module list if one exists

- [ ] **Step 1: Run the full check suite**

```bash
cd frontend
npm run typecheck
npm run test
npm run build
```
Expected: typecheck clean, all tests pass (including the ~19 new ones), build succeeds.

- [ ] **Step 2: Run the repo's own UI verification**

```bash
cd frontend
npm run verify:a11y
npm run verify:responsive
```
Expected: zero accessibility findings, no horizontal overflow. If the new route is not in either script's route list, add `/agent-constellation` to it — check with `grep -n "enterprise-map\|routes" scripts/a11y.mjs scripts/responsive.mjs`.

- [ ] **Step 3: Manual pass**

Walk the checklist and fix anything that fails:
- Radial and Neural both render; switching animates rather than jumping.
- All four divisions focus and exit; the carousel cycles all four.
- Search dims non-matching marks; clearing it restores everything.
- Side panel opens from a mark, from a roster row, and navigates through.
- Light mode and dark mode both legible (toggle in the topbar).
- 1680px and 390px wide: no horizontal scrollbar on the page body.
- With `prefers-reduced-motion: reduce` forced in devtools: no drift, no dash flow, instant transitions.
- Keyboard only: `Tab` reaches division and agent marks, `Enter` activates, `Esc` unwinds selection → fullscreen → focus.

- [ ] **Step 4: Update `PROJECT.md`**

Add a new `### Phase 3 — Agent Constellation (2026-08-02)` section to the Log describing what was built, and update the `## Current state` block to mention the new section.

- [ ] **Step 5: Update `frontend/public/journey-data.json`**

Read `~/.claude/templates/journey.md` for the schema, then append a milestone entry for this section.

- [ ] **Step 6: Commit**

```bash
git add PROJECT.md README.md frontend/public/journey-data.json
git commit -m "docs: record the Agent Constellation section"
```

---

## Self-review

**Spec coverage.** Route + nav → Task 5. Fullscreen → Task 5. Graph tiers and invariants → Task 1. Radial + neural geometry and invariants → Task 2. SVG rendering rationale → Task 4. Hover branch highlight → Task 4. Domain focus + carousel → Tasks 4, 5. Side panel handoff → Task 7. Left directory (counts, search, bars) → Task 6. Right legend + roster → Task 6. Colour rules → Task 3. Motion rules → Tasks 3, 4. Accessibility (`role="img"`, aria-label, focusable marks, live region, size-encoded tier) → Tasks 4, 5. Testing → Tasks 1, 2, 8.

**Placeholders.** None — every code step carries the literal content. The two "check the real export name first" notes in Tasks 6 and 7 are verification instructions with a stated fallback command, not deferred decisions.

**Type consistency.** `ConstellationGraph`'s `byId` / `childrenOf` / `domains` are produced in Task 1 and consumed under those exact names in Tasks 4, 6, 7. `layoutFor(mode, graph, focusDomainId)` returns `{ positions, sectors, viewBox }` in Task 2 and is destructured as `{ positions, viewBox }` in Task 4 — `sectors` is used only by Task 2's own tests, which is why `neuralLayout` still returns an empty `sectors` map. `domainColor(mode, index)`, `nodeColor(mode, node, domainIndex)`, `nodeRadius(node)` and `legendEntries(mode, domains)` keep the same signatures across Tasks 3, 4, 6. `node.domainId` is the raw division id (used for grouping); `node.id` is the namespaced graph id (used for lookup) — Task 4's `domainIndexOf` is keyed by `domainId`, and `focusDomainId` holds a graph `id`, which is why Task 4 compares `node.domainId !== focusDomain.domainId` rather than comparing ids directly.
