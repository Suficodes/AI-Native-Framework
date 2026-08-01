// The Section 17 strategy map: Strategic Objective → Excellence Criterion →
// Division → Process → AI Initiative → Agent → Outcome → Value, drawn as a
// left-to-right node-link graph.
//
// Reuses pages/organization/orgLayout.ts's dagre helper — the third module to
// do so, exactly as that file's Step 4 comment anticipated.
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card } from '@astryxdesign/core/Card'
import { HStack } from '@astryxdesign/core/HStack'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { layoutWithDagre } from '../organization/orgLayout.ts'

/** One colour per layer of the chain, so a glance reads the chain, not the nodes. */
const KIND_STYLE = {
  objective: { label: 'Strategic objective', accent: 'var(--color-accent)' },
  criterion: { label: 'Excellence criterion', accent: '#4a3aa7' },
  division: { label: 'Division', accent: '#2a78d6' },
  process: { label: 'Process', accent: '#008300' },
  initiative: { label: 'AI initiative', accent: '#eda100' },
  agent: { label: 'Agent', accent: '#eb6834' },
  outcome: { label: 'Outcome and value', accent: '#1baf7a' },
}

function StrategyNodeCard({ data }) {
  const style = KIND_STYLE[data.kind] ?? KIND_STYLE.objective
  return (
    <div
      onClick={data.href ? () => data.onOpen(data.href) : undefined}
      role={data.href ? 'button' : undefined}
      tabIndex={data.href ? 0 : undefined}
      style={{
        width: 210, minHeight: 62, padding: '10px 12px', boxSizing: 'border-box',
        background: 'var(--color-background-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${style.accent}`,
        borderRadius: 8, cursor: data.href ? 'pointer' : 'default',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--color-text-secondary)', marginBottom: 2,
      }}
      >
        {style.label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>{data.label}</div>
      {data.sublabel && (
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{data.sublabel}</div>
      )}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}

const nodeTypes = { strategy: StrategyNodeCard }

export function StrategyMap({ graph }) {
  const navigate = useNavigate()

  const { nodes, edges } = useMemo(() => {
    const positioned = layoutWithDagre(
      graph.nodes.map((n) => ({ ...n, width: 210, height: 76 })),
      graph.edges,
      { direction: 'LR', nodeWidth: 210, nodeHeight: 76, rankSep: 110, nodeSep: 22 },
    )
    return {
      nodes: positioned.map((n) => ({
        id: n.id,
        type: 'strategy',
        position: n.position,
        data: { ...n, onOpen: navigate },
      })),
      edges: graph.edges.map((e) => ({
        id: e.id, source: e.source, target: e.target,
        style: { stroke: 'var(--color-border)', strokeWidth: 1.5 },
      })),
    }
  }, [graph, navigate])

  if (graph.nodes.length === 0) {
    return <Card padding={4}><EmptyState title="Nothing to map" description="No initiative carries this strategic objective yet." /></Card>
  }

  return (
    <VStack gap={3}>
      <HStack gap={3} style={{ flexWrap: 'wrap' }}>
        {Object.entries(KIND_STYLE).map(([kind, style]) => (
          <HStack key={kind} gap={2} align="center">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: style.accent }} />
            <Text size="sm" color="secondary">{style.label}</Text>
          </HStack>
        ))}
      </HStack>
      <Card padding={0}>
        <div style={{ height: 620 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.15}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
          >
            <Background gap={20} size={1} color="var(--color-border)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </Card>
    </VStack>
  )
}
