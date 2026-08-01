// The ten lenses of the AI-Native Enterprise Map (requirements doc Section 18).
//
// CONVENTIONS.md's most important architectural rule, implemented literally:
// there is ONE graph (enterpriseMapGraph.ts) and ONE `applyLens()`. A lens is
// pure DATA — a declarative spec saying which node and edge kinds it keeps and
// what it colours by. There is no per-lens code path, so ten lenses cannot
// drift into ten inconsistent implementations, and an eleventh is one entry in
// a table.
import { buildEnterpriseGraph } from './enterpriseMapGraph'
import type { EnterpriseGraph, MapEdge, MapEdgeKind, MapNode, MapNodeKind } from './enterpriseMapGraph'

export type LensId =
  | 'organization' | 'workforce' | 'process' | 'qualityProcedure' | 'initiative'
  | 'agentHarness' | 'strategic' | 'value' | 'token' | 'risk'

export type ColorBy = 'kind' | 'agenticity' | 'value' | 'cost' | 'risk' | 'performance' | 'coverage'

export interface LensSpec {
  id: LensId
  label: string
  question: string
  nodeKinds: MapNodeKind[]
  edgeKinds: MapEdgeKind[]
  colorBy: ColorBy
  /** Node kinds worth expanding to by default when this lens is chosen. */
  focusKinds: MapNodeKind[]
  /**
   * How deep to open the tree by default. Tuned per lens to land near 30–70
   * visible nodes: Section 18 warns the map "should remain understandable and
   * not appear as an uncontrolled network of hundreds of nodes", and the user
   * drills from there.
   */
  defaultDepth: number
}

/** The org spine every lens keeps, so the map never loses its frame of reference. */
const SPINE: MapNodeKind[] = ['enterprise', 'division', 'superDepartment', 'department', 'section']

export const LENSES: LensSpec[] = [
  {
    id: 'organization',
    label: 'Organization',
    question: 'How is the enterprise structured, and where does the work sit?',
    nodeKinds: [...SPINE, 'position'],
    edgeKinds: ['contains'],
    colorBy: 'kind',
    focusKinds: ['division'],
    defaultDepth: 3,
  },
  {
    id: 'workforce',
    label: 'Human–Agent Workforce',
    question: 'Where are humans and agents working, and what does each do?',
    nodeKinds: [...SPINE, 'position', 'employee', 'agent', 'activity'],
    edgeKinds: ['contains', 'staffs', 'supervises'],
    colorBy: 'coverage',
    focusKinds: ['section'],
    defaultDepth: 4,
  },
  {
    id: 'process',
    label: 'Process',
    question: 'How agentic is each process today, and where is it heading?',
    nodeKinds: [...SPINE, 'process', 'agent'],
    edgeKinds: ['contains', 'executes', 'depends'],
    colorBy: 'agenticity',
    focusKinds: ['section', 'process'],
    defaultDepth: 5,
  },
  {
    id: 'qualityProcedure',
    label: 'Quality Procedure',
    question: 'Which Quality Procedures govern the work, and what do they control?',
    nodeKinds: [...SPINE, 'process', 'qualityProcedure', 'agent'],
    edgeKinds: ['contains', 'governs'],
    colorBy: 'coverage',
    focusKinds: ['process'],
    defaultDepth: 5,
  },
  {
    id: 'initiative',
    label: 'AI Initiative',
    question: 'Which AI initiatives are running, and which agents did they create?',
    nodeKinds: [...SPINE, 'process', 'initiative', 'agent'],
    edgeKinds: ['contains', 'delivers'],
    colorBy: 'value',
    focusKinds: ['process', 'initiative'],
    defaultDepth: 5,
  },
  {
    id: 'agentHarness',
    label: 'Agent and Harness',
    question: 'Which harness controls each agent, and what can it reach?',
    nodeKinds: [...SPINE, 'process', 'agent', 'harness', 'system'],
    edgeKinds: ['contains', 'controls', 'executes'],
    colorBy: 'performance',
    focusKinds: ['agent', 'harness'],
    defaultDepth: 5,
  },
  {
    id: 'strategic',
    label: 'Strategic Objective',
    question: 'Which strategic objectives does this work support?',
    nodeKinds: ['enterprise', 'objective', 'criterion', 'division', 'initiative'],
    edgeKinds: ['contains', 'contributes'],
    colorBy: 'kind',
    focusKinds: ['objective', 'criterion'],
    defaultDepth: 3,
  },
  {
    id: 'value',
    label: 'Value',
    question: 'How much value has been validated, and where did it come from?',
    nodeKinds: [...SPINE, 'process', 'initiative', 'agent', 'value', 'outcome'],
    edgeKinds: ['contains', 'value'],
    colorBy: 'value',
    focusKinds: ['initiative', 'value'],
    defaultDepth: 5,
  },
  {
    id: 'token',
    label: 'Token Economics',
    question: 'What is the total AI and token cost, and who is consuming it?',
    nodeKinds: [...SPINE, 'process', 'agent', 'cost'],
    edgeKinds: ['contains', 'token'],
    colorBy: 'cost',
    focusKinds: ['agent', 'cost'],
    defaultDepth: 5,
  },
  {
    id: 'risk',
    label: 'Risk and Compliance',
    question: 'Where is the risk, and which controls are not holding?',
    nodeKinds: [...SPINE, 'process', 'qualityProcedure', 'agent', 'harness'],
    edgeKinds: ['contains', 'governs', 'controls'],
    colorBy: 'risk',
    focusKinds: ['agent', 'qualityProcedure'],
    defaultDepth: 5,
  },
]

export const lensById = (id: LensId) => LENSES.find((l) => l.id === id) ?? LENSES[0]

// ─────────────────────────── Filters ───────────────────────────

/** The seven "show only…" filters Section 18 lists, as tag predicates. */
export type FilterId =
  | 'agent-supported' | 'high-value' | 'high-risk-agent' | 'low-agenticity'
  | 'expired-qp' | 'unvalidated-value'

export const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'agent-supported', label: 'Only agent-supported work' },
  { id: 'high-value', label: 'Only high-value initiatives' },
  { id: 'high-risk-agent', label: 'Only high-risk agents' },
  { id: 'low-agenticity', label: 'Only low-agenticity processes' },
  { id: 'expired-qp', label: 'Only expired Quality Procedures' },
  { id: 'unvalidated-value', label: 'Only initiatives without validated value' },
]

/** Node kinds each filter actually constrains — it must not delete the org spine. */
const FILTER_SCOPE: Record<FilterId, MapNodeKind[]> = {
  'agent-supported': ['position', 'activity', 'agent'],
  'high-value': ['initiative'],
  'high-risk-agent': ['agent'],
  'low-agenticity': ['process'],
  'expired-qp': ['qualityProcedure'],
  'unvalidated-value': ['initiative'],
}

export interface LensOptions {
  filters?: FilterId[]
  /** Restrict to one division's subtree ("show only selected division"). */
  divisionNodeId?: string
  /** Free-text search across labels; non-matching leaves are dropped. */
  search?: string
  /** Extra edge kinds the view toggles on top of the lens (value/token flows etc.). */
  extraEdgeKinds?: MapEdgeKind[]
}

export interface LensResult extends EnterpriseGraph {
  spec: LensSpec
  /** Node ids that matched the search, for highlighting. */
  matched: Set<string>
}

/** Every ancestor of `nodeId`, nearest first. */
function ancestors(nodeId: string, parentById: Map<string, string | undefined>): string[] {
  const chain: string[] = []
  let current = parentById.get(nodeId)
  while (current) {
    chain.push(current)
    current = parentById.get(current)
  }
  return chain
}

/**
 * Apply a lens. Pure: same graph plus same options always yields the same
 * result, and the shared graph is never mutated.
 */
export function applyLens(lensId: LensId, options: LensOptions = {}): LensResult {
  const spec = lensById(lensId)
  const graph = buildEnterpriseGraph()
  const parentById = new Map(graph.nodes.map((n) => [n.id, n.parentId]))
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))

  const keptKinds = new Set(spec.nodeKinds)
  const activeFilters = options.filters ?? []
  const search = options.search?.trim().toLowerCase() ?? ''

  const matched = new Set<string>()
  const survivors = new Set<string>()

  // "Show only high-risk agents" means the map narrows to those agents — not
  // that everything stays and the agents are merely thinned. So when a filter
  // is on, the kinds it targets must match, AND unrelated leaf kinds drop out.
  // The org spine always survives, or the results would float free of the
  // enterprise they belong to.
  const spine = new Set(SPINE)
  const targetedKinds = new Set(activeFilters.flatMap((f) => FILTER_SCOPE[f]))

  for (const node of graph.nodes) {
    if (!keptKinds.has(node.kind)) continue

    if (activeFilters.length > 0 && !spine.has(node.kind)) {
      if (targetedKinds.has(node.kind)) {
        const matchesEvery = activeFilters
          .filter((f) => FILTER_SCOPE[f].includes(node.kind))
          .every((f) => node.tags.includes(f))
        if (!matchesEvery) continue
      } else {
        continue
      }
    }

    if (options.divisionNodeId) {
      const inDivision = node.id === options.divisionNodeId
        || ancestors(node.id, parentById).includes(options.divisionNodeId)
      // The enterprise root stays so the subtree still has something to hang from.
      if (!inDivision && node.kind !== 'enterprise') continue
    }

    if (search && node.label.toLowerCase().includes(search)) matched.add(node.id)
    survivors.add(node.id)
  }

  // Keep every ancestor of a survivor, so no node is left without a path to the
  // root even when its parent's kind is not in the lens.
  for (const id of [...survivors]) {
    for (const ancestorId of ancestors(id, parentById)) {
      if (byId.has(ancestorId)) survivors.add(ancestorId)
    }
  }

  const nodes = graph.nodes.filter((n) => survivors.has(n.id))
  const edgeKinds = new Set<MapEdgeKind>([...spec.edgeKinds, ...(options.extraEdgeKinds ?? [])])
  const edges = graph.edges.filter(
    (e) => edgeKinds.has(e.kind) && survivors.has(e.source) && survivors.has(e.target),
  )

  return { spec, nodes, edges, matched }
}

// ─────────────────────────── Progressive disclosure ───────────────────────────

/**
 * Collapse a lens result to what is currently expanded, then LIFT every edge
 * whose endpoint is hidden up to its nearest visible ancestor.
 *
 * The lift is what keeps the map honest at every zoom level: collapse a
 * division and the value flowing out of an agent inside it still shows as
 * value flowing out of the division, rather than silently disappearing.
 * Section 18's warning — "should remain understandable and not appear as an
 * uncontrolled network of hundreds of nodes" — is this function's whole job.
 */
export function discloseGraph(result: LensResult, expandedIds: Set<string>): LensResult {
  const parentById = new Map(result.nodes.map((n) => [n.id, n.parentId]))
  const present = new Set(result.nodes.map((n) => n.id))

  const isVisible = (node: MapNode): boolean => {
    let parentId = node.parentId
    while (parentId) {
      // An ancestor outside this lens cannot hide the node.
      if (present.has(parentId) && !expandedIds.has(parentId)) return false
      parentId = parentById.get(parentId)
    }
    return true
  }

  const visible = result.nodes.filter(isVisible)
  const visibleIds = new Set(visible.map((n) => n.id))

  const liftToVisible = (nodeId: string): string | null => {
    if (visibleIds.has(nodeId)) return nodeId
    let parentId = parentById.get(nodeId)
    while (parentId) {
      if (visibleIds.has(parentId)) return parentId
      parentId = parentById.get(parentId)
    }
    return null
  }

  const lifted = new Map<string, MapEdge>()
  for (const edge of result.edges) {
    const source = liftToVisible(edge.source)
    const target = liftToVisible(edge.target)
    if (!source || !target || source === target) continue
    // Containment edges are already implied by nesting; lifting them would
    // draw a division to itself once its children collapse.
    if (edge.kind === 'contains' && (source !== edge.source || target !== edge.target)) continue
    const id = `${edge.kind}:${source}->${target}`
    if (!lifted.has(id)) lifted.set(id, { id, source, target, kind: edge.kind })
  }

  return { ...result, nodes: visible, edges: [...lifted.values()] }
}

/** Node ids that must be expanded to reveal `nodeId` — used by search and Story Mode. */
export function expansionPathTo(nodeId: string): string[] {
  const graph = buildEnterpriseGraph()
  const parentById = new Map(graph.nodes.map((n) => [n.id, n.parentId]))
  return ancestors(nodeId, parentById)
}

/** Containment depth of every node, enterprise root = 0. */
export function nodeDepths(): Map<string, number> {
  const graph = buildEnterpriseGraph()
  const parentById = new Map(graph.nodes.map((n) => [n.id, n.parentId]))
  const depths = new Map<string, number>()
  for (const node of graph.nodes) depths.set(node.id, ancestors(node.id, parentById).length)
  return depths
}

/**
 * The default expansion for a lens: everything shallower than its
 * `defaultDepth`. Depth-based rather than kind-based because expanding the
 * *path* to every focus node ends up opening every section, which floods the
 * canvas with the whole enterprise — the exact failure Section 18 warns about.
 */
export function defaultExpansion(lensId: LensId, depthOverride?: number): Set<string> {
  const maxDepth = depthOverride ?? lensById(lensId).defaultDepth
  const expanded = new Set<string>()
  for (const [id, depth] of nodeDepths()) {
    if (depth < maxDepth) expanded.add(id)
  }
  return expanded
}
