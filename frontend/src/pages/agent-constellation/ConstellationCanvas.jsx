// The constellation SVG. Renders positions from constellationLayout — it owns
// no layout maths and no interaction state, so both stay testable without a DOM.
//
// The whole scene sits in one <g> whose transform is derived from the layout's
// viewBox; focusing a division animates that transform rather than re-laying
// out, which is what makes the zoom read as a camera move.
import { useMemo } from 'react'
import { layoutFor, RADII } from '../../lib/constellationLayout.js'
import { nodeColor, nodeRadius, domainColor } from './constellationColors.js'
import { ConstellationCore } from './ConstellationCore.jsx'
import { useChartMode } from '../../lib/useChartMode.js'
import { useReducedMotionSafe } from '../../dewa/useReducedMotionSafe.js'
import { gridColor } from '../../lib/chartColors.js'
import { CORE_ID } from '../../data/constellationGraph.ts'

const VIEW_W = 1200
const VIEW_H = 780

/** Vertical space the focus-mode division title occupies, in viewBox units. */
const TITLE_BAND = 92

const RING_GUIDES = [
  { tier: 'domain', label: 'DIVISIONS' },
  { tier: 'agent', label: 'AI AGENTS' },
  { tier: 'leaf', label: 'PROCESSES & QUALITY PROCEDURES' },
]

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
  graph,
  mode,
  focusDomainId,
  hoveredId,
  selectedId,
  query,
  onHover,
  onSelect,
  onFocusDomain,
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

  const branch = useMemo(
    () => branchOf(graph, hoveredId ?? selectedId),
    [graph, hoveredId, selectedId],
  )

  const matches = useMemo(() => {
    const q = query?.trim().toLowerCase()
    if (!q) return null
    return new Set(
      graph.nodes
        .filter((n) => `${n.label} ${n.sublabel ?? ''}`.toLowerCase().includes(q))
        .map((n) => n.id),
    )
  }, [graph, query])

  const focusDomain = focusDomainId ? graph.byId.get(focusDomainId) : null

  // Fit the layout's own bounds into a fixed viewport, so the SVG keeps a
  // constant viewBox (and therefore constant text size) while the camera moves.
  // Focus mode reserves a band at the top for the division title, so the scene
  // is fitted below it rather than underneath it.
  const topBand = focusDomain ? TITLE_BAND : 0
  const stageH = VIEW_H - topBand
  const scale = Math.min(VIEW_W / viewBox.w, stageH / viewBox.h)
  const tx = VIEW_W / 2 - (viewBox.x + viewBox.w / 2) * scale
  const ty = topBand + stageH / 2 - (viewBox.y + viewBox.h / 2) * scale

  const stateClass = (node) => {
    if (matches && !matches.has(node.id)) return 'cn-dim'
    if (focusDomain && node.domainId !== focusDomain.domainId) return 'cn-dim'
    if (branch && !branch.has(node.id)) return 'cn-muted'
    return ''
  }

  const inFocus = (node) => !focusDomain || node.domainId === focusDomain.domainId

  const showLabel = (node) => {
    // Neural mode parks the divisions it isn't showing on top of one another,
    // so their labels would stack into noise — only the focused one is labelled.
    if (node.tier === 'domain') return mode === 'radial' || inFocus(node)
    if (node.tier === 'agent') return Boolean(focusDomain) && inFocus(node)
    return false
  }

  const corePos = positions.get(CORE_ID) ?? { x: 0, y: 0 }
  const agentTotal = graph.nodes.filter((n) => n.tier === 'agent').length
  const leafTotal = graph.nodes.filter((n) => n.tier === 'leaf').length
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
          : `AI agent constellation: ${graph.domains.length} divisions, ${agentTotal} agents, ${leafTotal} processes and Quality Procedures.`
      }
    >
      <defs>
        <pattern id="cn-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={grid} className="cn-grid" />
        </pattern>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill="url(#cn-grid)" />

      <g className="cn-viewport" transform={`translate(${tx} ${ty}) scale(${scale})`}>
        {/* Guide rings. With 15 agents rather than the hundreds a graph this
            shape usually carries, the tiers do not read as rings from the marks
            alone — these make the structure explicit instead of faking density. */}
        {mode === 'radial' &&
          RING_GUIDES.map((ring) => (
            <g key={ring.tier}>
              <circle className="cn-ring-guide" r={RADII[ring.tier]} />
              <text className="cn-ring-label" x={0} y={-RADII[ring.tier] - 8} textAnchor="middle">
                {ring.label}
              </text>
            </g>
          ))}

        {/* The core has a laid-out position like any other node — it only
            happens to be the origin in radial mode. */}
        <g transform={`translate(${corePos.x} ${corePos.y})`}>
          <ConstellationCore mode={chartMode} reduced={reduced} />
        </g>

        {graph.links.map((link) => {
          const a = positions.get(link.source)
          const b = positions.get(link.target)
          if (!a || !b) return null
          const target = graph.byId.get(link.target)
          const lit = branch?.has(link.source) && branch?.has(link.target)
          const isCoreLink = link.source === CORE_ID
          return (
            <line
              key={link.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={[
                'cn-link',
                isCoreLink && !reduced ? 'cn-link-core' : '',
                lit ? 'cn-link-lit' : '',
                stateClass(target),
              ]
                .filter(Boolean)
                .join(' ')}
              stroke={lit ? domainColor(chartMode, domainIndexOf.get(target?.domainId) ?? 0) : undefined}
            />
          )
        })}

        {graph.nodes.map((node) => {
          if (node.tier === 'core') return null
          const p = positions.get(node.id)
          if (!p) return null
          const index = domainIndexOf.get(node.domainId) ?? 0
          const isFocused = node.id === focusDomainId
          const radius = nodeRadius(node) * (isFocused ? 1.35 : 1)
          const isDomain = node.tier === 'domain'
          return (
            <g
              key={node.id}
              className={`cn-node ${stateClass(node)}`}
              transform={`translate(${p.x} ${p.y})`}
              tabIndex={node.tier === 'leaf' ? -1 : 0}
              role="button"
              aria-label={
                isDomain
                  ? `${node.label} division, ${node.metrics.agentCount} agents, ${node.metrics.leafCount} processes and Quality Procedures`
                  : `${node.label}${node.sublabel ? `, ${node.sublabel}` : ''}`
              }
              onMouseEnter={() => onHover(node.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(node.id)}
              onBlur={() => onHover(null)}
              onClick={() => (isDomain ? onFocusDomain(node.id) : onSelect(node.id))}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                if (isDomain) onFocusDomain(node.id)
                else onSelect(node.id)
              }}
            >
              <circle
                className="cn-node-mark"
                r={radius}
                fill={nodeColor(chartMode, node, index)}
                fillOpacity={node.tier === 'leaf' ? 0.9 : 1}
                stroke="var(--color-background-surface)"
                strokeWidth={node.tier === 'leaf' ? 1 : 2}
              />
              {showLabel(node) && (
                <text
                  className={`cn-label ${isDomain ? 'cn-label-domain' : ''}`}
                  y={radius + 15}
                  textAnchor="middle"
                >
                  {node.label}
                </text>
              )}
              {isDomain && showLabel(node) && (
                <text className="cn-label-count" y={radius + 28} textAnchor="middle">
                  {node.metrics.agentCount === 0
                    ? 'no agents yet'
                    : `${node.metrics.agentCount} agents · ${node.metrics.leafCount} items`}
                </text>
              )}
            </g>
          )
        })}
      </g>

      {focusDomain && (
        <>
          <text className="cn-focus-title" x={VIEW_W / 2} y={52} textAnchor="middle">
            {focusDomain.label}
          </text>
          <text className="cn-focus-sub" x={VIEW_W / 2} y={74} textAnchor="middle">
            {focusDomain.metrics.agentCount} agents · {focusDomain.metrics.leafCount} processes &amp; Quality Procedures
          </text>
        </>
      )}
    </svg>
  )
}
