// Traversals over the constellation graph. Kept out of the canvas component so
// the highlight and search rules are testable without a DOM, and out of
// constellationGraph.ts so that file stays purely about construction.
import type { ConstellationGraph } from './constellationGraph'

/**
 * Ancestors + descendants of `id` — the branch a hover or selection lights up.
 * Returns null when nothing is active, which callers read as "highlight nothing,
 * dim nothing".
 */
export function branchOf(graph: ConstellationGraph, id: string | null): Set<string> | null {
  if (!id || !graph.byId.has(id)) return null

  const branch = new Set<string>([id])

  let cursor = graph.byId.get(id)
  while (cursor?.parentId) {
    branch.add(cursor.parentId)
    cursor = graph.byId.get(cursor.parentId)
  }

  const walk = (nodeId: string) => {
    for (const child of graph.childrenOf.get(nodeId) ?? []) {
      branch.add(child.id)
      walk(child.id)
    }
  }
  walk(id)

  return branch
}

/**
 * Ids whose label or sublabel contains `query`. Returns null for an empty query,
 * which callers read as "no filter", distinct from an empty set meaning
 * "nothing matched".
 */
export function matchesFor(graph: ConstellationGraph, query: string | null): Set<string> | null {
  const q = query?.trim().toLowerCase()
  if (!q) return null
  return new Set(
    graph.nodes
      .filter((n) => `${n.label} ${n.sublabel ?? ''}`.toLowerCase().includes(q))
      .map((n) => n.id),
  )
}
