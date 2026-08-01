// The visual Harness Designer's left-to-right block flow (requirements doc
// Section 9). Reuses the dagre layout helper built for the Organization
// module's graphs — same pure function, just direction: 'LR' here instead
// of 'TB'.
import { useEffect, useMemo } from 'react'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutWithDagre } from '../organization/orgLayout.ts'
import { HarnessFlowNode } from './HarnessFlowNode.jsx'
import { HARNESS_FLOW } from '../../data/types'

const nodeTypes = { harnessBlock: HarnessFlowNode }

export function HarnessFlowDiagram({ selectedBlockType, onSelectBlock }) {
  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes = HARNESS_FLOW.map((block, i) => ({
      id: block.type, type: 'harnessBlock', position: { x: 0, y: 0 }, width: 170, height: 60,
      data: { order: i + 1, label: block.label, isSelected: block.type === selectedBlockType, onSelect: () => onSelectBlock(block.type) },
    }))
    const edges = HARNESS_FLOW.slice(1).map((block, i) => ({
      id: `${HARNESS_FLOW[i].type}->${block.type}`, source: HARNESS_FLOW[i].type, target: block.type,
    }))
    return { flowNodes: layoutWithDagre(nodes, edges, { direction: 'LR', rankSep: 50, nodeSep: 24 }), flowEdges: edges }
  }, [selectedBlockType, onSelectBlock])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)
  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  return (
    <div style={{ height: 260, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-container)' }}>
      <ReactFlow
        nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes} fitView minZoom={0.3} maxZoom={1.2}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
