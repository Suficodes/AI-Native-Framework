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
      if (sourceId === targetPositionId || (!index.nodesById[sourceId] && !positionToSection[sourceId])) continue
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
