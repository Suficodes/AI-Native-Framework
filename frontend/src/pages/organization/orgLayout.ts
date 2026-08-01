// Shared dagre auto-layout for both Organization graph modes (traditional
// chart, AI-native network) and, later, Harness Designer / Enterprise Map
// per CONVENTIONS.md ("Node-link graphs... @dagrejs/dagre for auto-layout
// where edges aren't a pure tree").
import dagre from '@dagrejs/dagre'

export interface LayoutNode {
  id: string
  width?: number
  height?: number
}

export interface LayoutEdge {
  id: string
  source: string
  target: string
}

export interface LayoutOptions {
  direction?: 'TB' | 'LR'
  nodeWidth?: number
  nodeHeight?: number
  rankSep?: number
  nodeSep?: number
}

export type PositionedNode<T extends LayoutNode = LayoutNode> = T & { position: { x: number; y: number } }

export function layoutWithDagre<T extends LayoutNode>(
  nodes: T[],
  edges: LayoutEdge[],
  opts: LayoutOptions = {},
): PositionedNode<T>[] {
  const { direction = 'TB', nodeWidth = 220, nodeHeight = 80, rankSep = 80, nodeSep = 32 } = opts
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep })

  for (const node of nodes) {
    graph.setNode(node.id, { width: node.width ?? nodeWidth, height: node.height ?? nodeHeight })
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const laidOut = graph.node(node.id)
    const width = node.width ?? nodeWidth
    const height = node.height ?? nodeHeight
    return { ...node, position: { x: laidOut.x - width / 2, y: laidOut.y - height / 2 } }
  })
}
