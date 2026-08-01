// Mode A — traditional org chart: full Enterprise -> Division -> Super
// Department -> Department -> Section -> Position hierarchy. Dagre top-down
// layout; a node's subtree is excluded from the graph entirely while
// collapsed (see the 2026-08-01 Organization module design spec).
import { useEffect, useMemo } from 'react'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { buildOrgIndex, headcountRollup, agenticityForSection } from '../../data/organizationAggregates.ts'
import { layoutWithDagre } from './orgLayout.ts'
import { OrgLevelNode, PositionNode } from './OrgFlowNode.jsx'

const nodeTypes = { orgLevel: OrgLevelNode, position: PositionNode }
const ROOT_ID = 'ENT-00'

export function OrgChart({ collapsedIds, onToggleCollapse, matchedPositionIds, hasActiveFilter, agenticityMode, onSelectNode, onSelectPosition }) {
  const index = useMemo(() => buildOrgIndex(), [])

  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes = []
    const edges = []

    function subtreeHasMatch(nodeId) {
      const node = index.nodesById[nodeId]
      if (node.level === 'Section') {
        return (index.positionsBySectionId[nodeId] ?? []).some((p) => matchedPositionIds.has(p.id))
      }
      return (index.childrenByParentId[nodeId] ?? []).some((childId) => subtreeHasMatch(childId))
    }

    function visit(nodeId, parentId) {
      const node = index.nodesById[nodeId]
      const children = index.childrenByParentId[nodeId] ?? []
      const isCollapsed = collapsedIds.has(nodeId)
      const isDimmed = hasActiveFilter && !subtreeHasMatch(nodeId)
      const agenticityLabel = node.level === 'Section' ? agenticityForSection(nodeId, agenticityMode) : null

      nodes.push({
        id: nodeId, type: 'orgLevel', position: { x: 0, y: 0 }, width: 220, height: agenticityLabel ? 100 : 84,
        data: {
          node, counts: headcountRollup(nodeId), hasChildren: children.length > 0,
          isCollapsed, isDimmed, agenticityLabel, onToggleCollapse, onSelect: onSelectNode,
        },
      })
      if (parentId) edges.push({ id: `${parentId}->${nodeId}`, source: parentId, target: nodeId })

      if (isCollapsed) return
      for (const childId of children) visit(childId, nodeId)

      if (node.level === 'Section') {
        for (const p of index.positionsBySectionId[nodeId] ?? []) {
          const isDimmedPosition = hasActiveFilter && !matchedPositionIds.has(p.id)
          nodes.push({
            id: p.id, type: 'position', position: { x: 0, y: 0 }, width: 210, height: 92,
            data: {
              position: p, employeeName: null, agentCount: 0, isDimmed: isDimmedPosition,
              color: 'var(--color-border)', onSelect: onSelectPosition,
            },
          })
          edges.push({ id: `${nodeId}->${p.id}`, source: nodeId, target: p.id })
        }
      }
    }

    visit(ROOT_ID, null)
    return { flowNodes: layoutWithDagre(nodes, edges, { direction: 'TB', rankSep: 70, nodeSep: 24 }), flowEdges: edges }
  }, [index, collapsedIds, matchedPositionIds, hasActiveFilter, agenticityMode, onToggleCollapse, onSelectNode, onSelectPosition])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Re-sync whenever the computed layout changes (collapse toggle, filter
  // change) — this is an auto-layout tool, not a free-form diagram editor,
  // so resetting any manual drag on every recompute is intentional.
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
