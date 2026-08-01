// The Enterprise Map canvas: zoom, pan, minimap, expand/collapse, hover
// details, click drill-down and relationship highlighting (Section 18's
// required functionality). Layout comes from the shared dagre helper.
import { useCallback, useMemo } from 'react'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutWithDagre } from '../organization/orgLayout.ts'
import { nodeColor, computeScales, edgeStyle, KIND_LABELS } from './mapColors.js'

const NODE_W = 188
const NODE_H = 62

function MapNodeCard({ data }) {
  const {
    node, color, expandable, expanded, onToggle, onSelect,
    dimmed, highlighted, matched, presentation,
  } = data

  return (
    <div
      onClick={() => onSelect(node)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(node) }}
      title={`${KIND_LABELS[node.kind] ?? node.kind}: ${node.label}`}
      style={{
        width: NODE_W, minHeight: NODE_H, boxSizing: 'border-box',
        padding: presentation ? '10px 12px' : '8px 10px',
        background: 'var(--color-background-surface)',
        // Sides are set individually: mixing the `border` shorthand with
        // `borderLeft` makes React warn on every rerender, and this node
        // rerenders on every hover and selection change.
        borderTop: `1px solid ${matched || highlighted ? color : 'var(--color-border)'}`,
        borderRight: `1px solid ${matched || highlighted ? color : 'var(--color-border)'}`,
        borderBottom: `1px solid ${matched || highlighted ? color : 'var(--color-border)'}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 8,
        opacity: dimmed ? 0.28 : 1,
        boxShadow: matched ? `0 0 0 2px ${color}` : highlighted ? `0 0 0 1px ${color}` : 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'opacity 120ms ease',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{
        fontSize: presentation ? 10 : 9, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--color-text-secondary)', marginBottom: 1,
      }}
      >
        {KIND_LABELS[node.kind] ?? node.kind}
      </div>
      <div style={{ fontSize: presentation ? 13 : 12, fontWeight: 600, lineHeight: 1.22 }}>{node.label}</div>
      {node.sublabel && (
        <div style={{ fontSize: presentation ? 11 : 10, color: 'var(--color-text-secondary)', marginTop: 1 }}>
          {node.sublabel}
        </div>
      )}
      {expandable && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(node.id) }}
          aria-label={expanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
          style={{
            position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)',
            width: 18, height: 18, borderRadius: '50%', border: '1px solid var(--color-border)',
            background: 'var(--color-background-surface)', color: 'var(--color-text-secondary)',
            fontSize: 12, lineHeight: '16px', padding: 0, cursor: 'pointer', zIndex: 2,
          }}
        >
          {expanded ? '−' : '+'}
        </button>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}

const nodeTypes = { map: MapNodeCard }

export function MapCanvas({
  graph, colorBy, mode, expandedIds, expandableIds, onToggle, onSelect,
  selectedId, matched, presentation, fitKey,
}) {
  const scales = useMemo(() => computeScales(graph.nodes), [graph.nodes])

  // Relationship highlighting: selecting a node dims everything it is not
  // connected to, which is how you read a dense graph.
  const related = useMemo(() => {
    if (!selectedId) return null
    const set = new Set([selectedId])
    for (const edge of graph.edges) {
      if (edge.source === selectedId) set.add(edge.target)
      if (edge.target === selectedId) set.add(edge.source)
    }
    return set
  }, [selectedId, graph.edges])

  const { nodes, edges } = useMemo(() => {
    const positioned = layoutWithDagre(
      graph.nodes.map((n) => ({ ...n, width: NODE_W, height: NODE_H })),
      graph.edges,
      { direction: 'LR', nodeWidth: NODE_W, nodeHeight: NODE_H, rankSep: 96, nodeSep: 16 },
    )
    return {
      nodes: positioned.map((n) => ({
        id: n.id,
        type: 'map',
        position: n.position,
        // The minimap cannot draw a custom node until it knows its size, and
        // renders blank without these.
        width: NODE_W,
        height: NODE_H,
        data: {
          node: n,
          color: nodeColor(n, colorBy, mode, scales),
          expandable: expandableIds.has(n.id),
          expanded: expandedIds.has(n.id),
          onToggle,
          onSelect,
          dimmed: related != null && !related.has(n.id),
          highlighted: related != null && related.has(n.id),
          matched: matched.has(n.id),
          presentation,
        },
      })),
      edges: graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        style: {
          ...edgeStyle(e.kind, mode),
          opacity: related != null && !(related.has(e.source) && related.has(e.target)) ? 0.12 : 0.9,
        },
      })),
    }
  }, [graph, colorBy, mode, scales, expandedIds, expandableIds, onToggle, onSelect, related, matched, presentation])

  const minimapColor = useCallback(
    (n) => nodeColor(n.data.node, colorBy, mode, scales),
    [colorBy, mode, scales],
  )

  return (
    <ReactFlow
      // Remounting on fitKey (lens + filters + division) re-frames the canvas
      // for a new view, while expanding inside a view preserves the viewport.
      key={fitKey}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.05}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      onPaneClick={() => onSelect(null)}
    >
      <Background gap={22} size={1} color="var(--color-border)" />
      <Controls showInteractive={false} />
      {!presentation && (
        <MiniMap
          pannable
          zoomable
          nodeColor={minimapColor}
          nodeStrokeWidth={0}
          maskColor="rgba(0,0,0,0.06)"
          style={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)' }}
        />
      )}
    </ReactFlow>
  )
}
