# Agent Constellation — design

_2026-08-02_

## Purpose

A new section of the Control Tower that answers one question visually, in a single screen:
**which AI agents does DEWA run, who owns them, and what work do they touch?**

The existing `/enterprise-map` answers a different question — it is a structured
dagre node-link graph across the full nineteen-kind entity chain, driven by ten
analytical lenses and a scripted Story Mode. It is a *analysis* surface.

The Agent Constellation is a *presentation* surface: an organic, radial view of
the agent workforce that reads instantly from across a room. The two coexist;
neither replaces the other.

Reference: the "Optimal Engine" agent-company visualization (radial rings + a
top-down neural tree + per-domain focus mode). We borrow the **structure and
interaction model**, not the neon aesthetic — this renders in the project's
existing Astryx/DEWA tokens and the validated `chartColors` palette, and works
in both light and dark mode.

## Scope

**In scope**
- A new route `/agent-constellation`, inside the App shell, with a fullscreen toggle.
- A new SideNav entry under "Control Tower", directly above Enterprise Map.
- Two layouts over one graph: Radial and Neural.
- Division focus mode with a carousel.
- Left directory panel (counts, search, per-division bars) and right panel
  (legend + agent roster).
- Data selector + layout geometry as pure, tested modules.

**Out of scope**
- Any change to `/enterprise-map`, `enterpriseMapGraph.ts`, or its lenses.
- New seed data. Everything derives from the existing `dataset`.
- Backend work. The prototype stays frontend-only.
- `framer-motion` or any new animation dependency (see Motion below).

## The graph

Built in `data/constellationGraph.ts` as a selector over `dataset`, following
the same pattern as the existing `*Aggregates.ts` modules.

| Tier | Content | Count | Derived from |
|---|---|---|---|
| 0 — core | DEWA enterprise | 1 | `orgNodes` level `Enterprise` |
| 1 — domains | Divisions | 4 | `orgNodes` level `Division` |
| 2 — agents | AI agents | 15 | `agent.orgAssignment.divisionId` |
| 3 — leaves | Processes + Quality Procedures | 20 + 15 | `agent.assignedProcessIds`, `agent.assignedQpIds` |

Ring 3 includes Quality Procedures as well as processes for two reasons: twenty
leaves alone reads as sparse against the reference's density, and "the work each
agent touches, plus the controls governing it" is the framing this prototype
already uses everywhere else.

### Shape

```ts
export type ConstellationTier = 'core' | 'domain' | 'agent' | 'leaf'

export interface ConstellationNode {
  id: string                  // 'core' | 'dom:DIV-…' | 'agt:AGT-…' | 'proc:…' | 'qp:…'
  tier: ConstellationTier
  label: string
  sublabel?: string
  parentId?: string
  href?: string               // route into the real record
  domainId?: string           // owning division, on every tier ≥ 1
  leafKind?: 'process' | 'qualityProcedure'
  metrics: {
    agenticity?: number       // index into AGENTICITY_ORDER
    performance?: number
    agentCount?: number       // domains only
    leafCount?: number        // domains and agents
  }
}

export interface ConstellationGraph {
  nodes: ConstellationNode[]
  links: Array<{ id: string; source: string; target: string }>
  domains: ConstellationNode[]   // tier-1 nodes, stable display order
}
```

A leaf shared by two agents in the same division appears once, parented to the
first agent by id order — this keeps the layout a strict tree, which both
geometry functions depend on. A leaf shared across divisions is duplicated,
namespaced per domain (`proc:PROC-x@DIV-y`), because a node cannot occupy two
angular sectors.

### Invariants (tested)

- Every agent resolves to exactly one domain.
- Every leaf has exactly one parent agent.
- No orphans: every node except the core has a `parentId` present in the graph.
- Counts match the dataset: 4 domains, 15 agents, ≥ 1 leaf per agent.
- Output is referentially stable across calls (memoized, like `buildEnterpriseGraph`).

## Layout

`lib/constellationLayout.js` — two pure functions, no force simulation, no
randomness. Both take the graph (and, for focus, a domain id) and return
`{ positions: Map<id, {x, y}>, viewBox: {x, y, w, h} }` in one shared coordinate
space, so switching modes is an interpolation rather than a rebuild.

**Radial.** Core at the origin. Each domain owns an equal angular sector,
starting at −90° so division one sits at the top. Its agents distribute across
that sector at radius `r2`, each agent owning a sub-sector; its leaves sit at
`r3` within the sub-sector. Radii are constants, so ring identity is preserved
regardless of counts.

**Neural.** The same tree flattened top-down: leaves on the top row, the agent
row beneath, the domain hub below that, and the core at the bottom, with the
core→agent links drawn as converging dotted lines. In focus mode this renders
one domain at a time; unfocused it renders all four side by side.

### Invariants (tested)

- Every child's angle lies strictly within its parent's angular sector (radial).
- No two nodes at the same radius come within a minimum angular separation.
- Both functions are deterministic — same input, same output, no `Math.random`.
- The returned `viewBox` contains every position with margin.

## Rendering

Hand-rolled SVG in `ConstellationCanvas.jsx`, **not `@xyflow/react`**.

xyflow is built for pannable graphs of DOM nodes with user-draggable positions;
this view has fixed polar geometry, ~55 small marks, and a "zoom into a domain"
move that is most naturally expressed as an animated `viewBox`. Using xyflow
here would mean fighting its layout ownership for no benefit. The existing
Enterprise Map, org chart and harness designer keep using xyflow — this is an
addition, not a precedent change.

## Interactions

1. **Mode tabs** — `Radial` / `Neural`.
2. **Hover** — the hovered node's full branch (ancestors + descendants)
   highlights; everything else drops to a low opacity. Tooltip on the mark.
3. **Click a domain** — focus mode. The domain title takes the canvas, its
   agents fan out labelled, the other three domains fade into the backdrop, and
   the `viewBox` animates in. A `‹ Division ›` carousel at the bottom cycles the
   four. `Esc` or a Back control exits.
4. **Click an agent or leaf** — the existing shared `SidePanel` opens with the
   record's detail and a link through to its real page (`/agents/:id`,
   `/processes/agenticity/:id`, `/processes/quality-procedures/:id`).
5. **Left directory panel** — totals per tier, a search box that filters the
   graph live (non-matching marks dim, matching ones stay lit), and a
   per-division breakdown bar list. Clicking a row focuses that node.
6. **Right panel** — tier/colour legend and the full 15-agent roster; clicking a
   roster row focuses that agent.
7. **Fullscreen toggle** — expands the canvas over the App shell for demos.

## Visual

- Four domains take four colours from the existing validated categorical palette
  in `lib/chartColors.js`. Agents render as a lighter tint of their parent
  domain; leaves are small outlined dots tinted by agenticity status.
- Grid backdrop drawn from `--color-border` at low alpha.
- JetBrains Mono (already loaded) for labels, counts and the domain title;
  Figtree for panel prose.
- No pure black or pure white surfaces; no glassmorphism, gradient text or glow
  borders, per the design system. The "core" is a dense cluster of small marks,
  not a blur glow.
- Renders correctly in both light and dark mode.

## Motion

All animation is CSS transitions and keyframes on SVG attributes and transforms
— no `framer-motion`, no `requestAnimationFrame` loops.

Rationale: this repo's verification scripts screenshot in headless Chrome, and
PROJECT.md already records that `--virtual-time-budget` does not reliably
advance rAF-driven animation there (it silently broke recharts entrance
animations and NumberFlow). Declarative CSS keeps the canvas in a deterministic
settled state for those checks.

Every animated element goes through the existing `useReducedMotionSafe` hook;
under `prefers-reduced-motion` the canvas renders statically with no drift, no
dash animation and instant focus transitions.

## Accessibility

- The SVG carries `role="img"` with a generated `aria-label` summarising the
  current view; a visually-hidden text alternative lists domains, their agent
  counts and leaf counts.
- Every interactive mark is a real focusable element with an accessible name;
  `Tab` walks the roster and directory rows, which drive the same focus state as
  clicking a mark. The canvas is operable without a pointer.
- Focus mode announces the active domain via a polite live region.
- Colour is never the only carrier of tier — tier is also encoded in mark size
  and shape.

## Files

```
pages/agent-constellation/
  AgentConstellation.jsx      ~180   page shell, mode + focus state, fullscreen
  ConstellationCanvas.jsx     ~200   the SVG scene
  ConstellationCore.jsx        ~70   the core cluster
  ConstellationDirectory.jsx  ~140   left panel
  ConstellationLegend.jsx     ~120   right panel
  DomainCarousel.jsx           ~50   the ‹ Division › pill
lib/constellationLayout.js    ~180   radial + neural geometry (pure)
data/constellationGraph.ts    ~150   the 3-tier graph
```

All within the CONVENTIONS.md caps (250 JSX / 200 util / 200 aggregator).

## Testing

- `data/constellationGraph.spec.ts` — the graph invariants above.
- `lib/constellationLayout.spec.js` — the layout invariants above.
- Manual: open both modes, focus each of the four divisions, exit with `Esc`,
  open a side panel from each tier, search, toggle fullscreen, check light and
  dark, check at 390px and 1680px.
- `npm run typecheck`, `npm run test`, `npm run verify:a11y`, and
  `npm run verify:responsive` must all pass with the new route included.
