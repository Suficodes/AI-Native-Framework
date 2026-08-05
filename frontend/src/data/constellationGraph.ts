// The Agent Constellation's graph — a strict four-tier tree over the mock
// dataset: enterprise core → divisions → AI agents → the processes and Quality
// Procedures each agent touches.
//
// Deliberately NOT derived from enterpriseMapGraph.ts: that graph interleaves
// super-departments, departments and sections between a division and its
// agents, and carries nineteen node kinds the constellation has no use for.
// This is a different projection of the same dataset, in the same style as the
// other data/*Aggregates.ts selectors.
import { dataset } from './mockApi'
import { AGENTICITY_ORDER } from './types'

export type ConstellationTier = 'core' | 'domain' | 'agent' | 'leaf'

export interface ConstellationNode {
  id: string
  tier: ConstellationTier
  label: string
  sublabel?: string
  parentId?: string
  /** Route into the real record, where the app has a page for it. */
  href?: string
  /** Owning division id — present on every node below the core. */
  domainId?: string
  leafKind?: 'process' | 'qualityProcedure'
  metrics: {
    agenticity?: number
    performance?: number
    agentCount?: number
    leafCount?: number
  }
}

export interface ConstellationLink {
  id: string
  source: string
  target: string
}

export interface ConstellationGraph {
  nodes: ConstellationNode[]
  links: ConstellationLink[]
  /** Tier-1 nodes in stable display order. */
  domains: ConstellationNode[]
  byId: Map<string, ConstellationNode>
  childrenOf: Map<string, ConstellationNode[]>
}

export const CORE_ID = 'core'

const domainNodeId = (id: string) => `dom:${id}`
const agentNodeId = (id: string) => `agt:${id}`
// Leaves are namespaced per agent: the same process can legitimately be worked
// by two agents, and a strict tree needs exactly one parent per node.
const leafNodeId = (kind: string, id: string, ownerId: string) => `${kind}:${id}@${ownerId}`

const agenticityIndex = (level: string) =>
  AGENTICITY_ORDER.indexOf(level as (typeof AGENTICITY_ORDER)[number])

let cached: ConstellationGraph | null = null

export function buildConstellationGraph(): ConstellationGraph {
  if (cached) return cached

  const nodes: ConstellationNode[] = []
  const links: ConstellationLink[] = []
  const add = (node: ConstellationNode) => {
    nodes.push(node)
    return node
  }
  const link = (source: string, target: string) => {
    links.push({ id: `${source}->${target}`, source, target })
  }

  const enterprise = dataset.orgNodes.find((n) => n.level === 'Enterprise')
  add({
    id: CORE_ID,
    tier: 'core',
    label: enterprise?.name ?? 'DEWA',
    sublabel: 'AI-native enterprise',
    metrics: {},
  })

  const processById = new Map(dataset.processes.map((p) => [p.id, p]))
  const qpById = new Map(dataset.qualityProcedures.map((q) => [q.id, q]))

  const divisions = dataset.orgNodes.filter((n) => n.level === 'Division')
  const domains: ConstellationNode[] = []

  for (const division of divisions) {
    const domId = domainNodeId(division.id)
    const domain = add({
      id: domId,
      tier: 'domain',
      // "Generation & Production Division" reads better as "Generation &
      // Production" at constellation label sizes; the full name stays available
      // through the side panel's link into /organization.
      label: division.name.replace(/\s+Division$/, ''),
      sublabel: 'Division',
      parentId: CORE_ID,
      href: '/organization',
      domainId: division.id,
      metrics: { agentCount: 0, leafCount: 0 },
    })
    domains.push(domain)
    link(CORE_ID, domId)

    const divisionAgents = dataset.agents.filter((a) => a.orgAssignment.divisionId === division.id)
    let domainLeafCount = 0

    for (const agent of divisionAgents) {
      const agtId = agentNodeId(agent.id)
      const agentNode = add({
        id: agtId,
        tier: 'agent',
        label: agent.name,
        sublabel: agent.digitalJobTitle,
        parentId: domId,
        href: `/agents/${agent.id}`,
        domainId: division.id,
        metrics: {
          agenticity: agenticityIndex(agent.autonomyLevel),
          performance: agent.performanceScore,
          leafCount: 0,
        },
      })
      link(domId, agtId)

      let agentLeafCount = 0

      for (const processId of agent.assignedProcessIds) {
        const process = processById.get(processId)
        if (!process) continue
        const id = leafNodeId('proc', processId, agent.id)
        add({
          id,
          tier: 'leaf',
          label: process.name,
          sublabel: 'Process',
          parentId: agtId,
          href: `/processes/agenticity/${processId}`,
          domainId: division.id,
          leafKind: 'process',
          metrics: { agenticity: agenticityIndex(process.currentAgenticity) },
        })
        link(agtId, id)
        agentLeafCount += 1
      }

      for (const qpId of agent.assignedQpIds) {
        const qp = qpById.get(qpId)
        if (!qp) continue
        const id = leafNodeId('qp', qpId, agent.id)
        add({
          id,
          tier: 'leaf',
          label: qp.title,
          sublabel: `Quality Procedure · ${qp.status}`,
          parentId: agtId,
          href: `/processes/quality-procedures/${qpId}`,
          domainId: division.id,
          leafKind: 'qualityProcedure',
          metrics: {},
        })
        link(agtId, id)
        agentLeafCount += 1
      }

      agentNode.metrics.leafCount = agentLeafCount
      domainLeafCount += agentLeafCount
    }

    domain.metrics.agentCount = divisionAgents.length
    domain.metrics.leafCount = domainLeafCount
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const childrenOf = new Map<string, ConstellationNode[]>()
  for (const node of nodes) {
    if (!node.parentId) continue
    const siblings = childrenOf.get(node.parentId)
    if (siblings) siblings.push(node)
    else childrenOf.set(node.parentId, [node])
  }

  cached = { nodes, links, domains, byId, childrenOf }
  return cached
}
