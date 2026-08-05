// Agent Constellation geometry — pure functions from the constellation graph to
// screen positions. No force simulation, no randomness: same graph in, same
// coordinates out, every time. Both layouts share one coordinate space, so
// switching mode is an interpolation rather than a rebuild.
import { CORE_ID } from '../data/constellationGraph.ts'

export const RADII = { domain: 210, agent: 340, leaf: 470 }

const TAU = Math.PI * 2
// Start at -90° so the first division sits at the top of the ring.
const START_ANGLE = -Math.PI / 2
// Each parent keeps a little of its sector clear at both ends, so adjacent
// families read as separate fans rather than one continuous band.
const SECTOR_INSET = 0.12
// Minimum share of the full ring per domain — roughly 29°, enough to carry a
// legible label. A division running no agents at all still gets its spoke: an
// empty division is a finding worth showing, not a gap to hide.
const MIN_DOMAIN_SHARE = 0.08

const round = (n) => Math.round(n * 1000) / 1000

const polar = (radius, angle) => ({
  x: round(Math.cos(angle) * radius),
  y: round(Math.sin(angle) * radius),
  angle,
})

/** Spread `count` items evenly across [start, end], centred, never on the edges. */
function spread(start, end, count) {
  if (count === 0) return []
  const step = (end - start) / count
  return Array.from({ length: count }, (_, i) => start + step * (i + 0.5))
}

/**
 * Share of the full ring each domain gets. Weighted by how much sits under it,
 * so a division running seven agents is not squeezed into the same wedge as one
 * running none — but every domain keeps at least MIN_DOMAIN_SHARE of what an
 * equal split would have given it.
 */
function domainShares(domains) {
  const weights = domains.map((d) => (d.metrics.agentCount ?? 0) + (d.metrics.leafCount ?? 0))
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total === 0) return domains.map(() => 1 / domains.length)
  // With enough domains the floors alone would exceed the ring; past that point
  // fall back to an equal split rather than producing negative spans.
  const floor = Math.min(MIN_DOMAIN_SHARE, 1 / domains.length)
  const remaining = 1 - floor * domains.length
  return weights.map((w) => floor + (w / total) * remaining)
}

function boundingViewBox(points, margin) {
  if (points.length === 0) return { x: -margin, y: -margin, w: margin * 2, h: margin * 2 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs) - margin
  const minY = Math.min(...ys) - margin
  return {
    x: minX,
    y: minY,
    w: Math.max(...xs) + margin - minX,
    h: Math.max(...ys) + margin - minY,
  }
}

export function radialLayout(graph, focusDomainId = null) {
  const positions = new Map()
  const sectors = new Map()

  positions.set(CORE_ID, { x: 0, y: 0, angle: 0 })

  const shares = domainShares(graph.domains)
  let cursor = START_ANGLE

  graph.domains.forEach((domain, i) => {
    const span = shares[i] * TAU
    const centre = cursor + span / 2
    cursor += span

    const half = (span / 2) * (1 - SECTOR_INSET)
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

  const focusDomain = focusDomainId ? graph.byId.get(focusDomainId) : null

  if (focusDomain) {
    const framed = graph.nodes
      .filter((n) => n.domainId === focusDomain.domainId)
      .map((n) => positions.get(n.id))
      .filter(Boolean)
      .concat([{ x: 0, y: 0 }])
    return { positions, sectors, viewBox: boundingViewBox(framed, 90) }
  }

  // Unfocused, the frame is deliberately symmetric about the origin rather than
  // fitted to the points: sectors are weighted, so a fitted box would push the
  // core off-centre and the tiers would stop reading as concentric rings.
  const extent = RADII.leaf + 46
  return { positions, sectors, viewBox: { x: -extent, y: -extent, w: extent * 2, h: extent * 2 } }
}

// Neural mode renders one division at a time (see neuralLayout) — laying four
// divisions side by side degenerates into an unreadable 5:1 strip.
const ROWS = { leaf: 0, agent: 300, domain: 560, core: 760 }
const COLUMN_GAP = 64
const AGENT_MIN_COLUMNS = 3

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
      const agentX = leaves.length > 0 ? (leafXs[0] + leafXs.at(-1)) / 2 : cursor
      positions.set(agent.id, { x: agentX, y: ROWS.agent })
      // Every agent claims at least AGENT_MIN_COLUMNS of width whether or not it
      // has leaves, so agent labels have room and never overlap their neighbour.
      cursor += Math.max(leaves.length, AGENT_MIN_COLUMNS) * COLUMN_GAP + COLUMN_GAP
    }

    const blockEnd = Math.max(blockStart, cursor - COLUMN_GAP * 2)
    positions.set(domain.id, { x: (blockStart + blockEnd) / 2, y: ROWS.domain })
    domainCentres.push((blockStart + blockEnd) / 2)
    cursor += COLUMN_GAP * 2
  }

  const coreX =
    domainCentres.length > 0
      ? (Math.min(...domainCentres) + Math.max(...domainCentres)) / 2
      : 0
  positions.set(CORE_ID, { x: coreX, y: ROWS.core })

  // Anything outside the visible set still needs a position — nodes are dimmed
  // rather than unmounted, so the focus change animates instead of popping.
  // Parking a node on its parent makes it collapse inward.
  for (const node of graph.nodes) {
    if (positions.has(node.id)) continue
    const fallback = positions.get(node.parentId) ?? { x: coreX, y: ROWS.core }
    positions.set(node.id, { x: fallback.x, y: fallback.y })
  }

  return { positions, sectors: new Map(), viewBox: boundingViewBox([...positions.values()], 120) }
}

export function layoutFor(mode, graph, focusDomainId = null) {
  return mode === 'neural' ? neuralLayout(graph, focusDomainId) : radialLayout(graph, focusDomainId)
}
