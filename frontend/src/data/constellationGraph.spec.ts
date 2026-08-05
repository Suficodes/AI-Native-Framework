import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import { buildConstellationGraph } from './constellationGraph'

describe('the constellation graph', () => {
  it('has exactly one core node and one node per division', () => {
    const g = buildConstellationGraph()
    expect(g.nodes.filter((n) => n.tier === 'core')).toHaveLength(1)
    const divisions = dataset.orgNodes.filter((n) => n.level === 'Division')
    expect(g.domains).toHaveLength(divisions.length)
    expect(g.domains.every((d) => d.tier === 'domain')).toBe(true)
  })

  it('places every agent under exactly one domain', () => {
    const g = buildConstellationGraph()
    const agents = g.nodes.filter((n) => n.tier === 'agent')
    expect(agents).toHaveLength(dataset.agents.length)
    const domainIds = new Set(g.domains.map((d) => d.id))
    for (const agent of agents) {
      expect(domainIds.has(agent.parentId!), `${agent.id} parent`).toBe(true)
    }
  })

  it('is a strict tree — every non-core node has exactly one present parent', () => {
    const g = buildConstellationGraph()
    const ids = new Set(g.nodes.map((n) => n.id))
    const roots = g.nodes.filter((n) => !n.parentId)
    expect(roots).toHaveLength(1)
    expect(roots[0].tier).toBe('core')
    for (const node of g.nodes) {
      if (node.parentId) expect(ids.has(node.parentId), `${node.id} parent`).toBe(true)
    }
  })

  it('has no duplicate node ids and no dangling link endpoints', () => {
    const g = buildConstellationGraph()
    const ids = new Set(g.nodes.map((n) => n.id))
    expect(ids.size).toBe(g.nodes.length)
    for (const link of g.links) {
      expect(ids.has(link.source), `${link.id} source`).toBe(true)
      expect(ids.has(link.target), `${link.id} target`).toBe(true)
    }
  })

  it('gives every agent leaves that are all tagged process or qualityProcedure', () => {
    const g = buildConstellationGraph()
    for (const agent of g.nodes.filter((n) => n.tier === 'agent')) {
      const leaves = g.childrenOf.get(agent.id) ?? []
      for (const leaf of leaves) {
        expect(['process', 'qualityProcedure']).toContain(leaf.leafKind)
      }
    }
  })

  it('carries domainId on every node below the core', () => {
    const g = buildConstellationGraph()
    for (const node of g.nodes) {
      if (node.tier === 'core') continue
      expect(node.domainId, `${node.id} domainId`).toBeTruthy()
    }
  })

  it('rolls counts up to the domains', () => {
    const g = buildConstellationGraph()
    for (const domain of g.domains) {
      const agents = g.childrenOf.get(domain.id) ?? []
      expect(domain.metrics.agentCount).toBe(agents.length)
      const leaves = agents.reduce((sum, a) => sum + (g.childrenOf.get(a.id)?.length ?? 0), 0)
      expect(domain.metrics.leafCount).toBe(leaves)
    }
  })

  it('records each agent’s own leaf count', () => {
    const g = buildConstellationGraph()
    for (const agent of g.nodes.filter((n) => n.tier === 'agent')) {
      expect(agent.metrics.leafCount).toBe((g.childrenOf.get(agent.id) ?? []).length)
    }
  })

  it('is memoized — repeated calls return the same object', () => {
    expect(buildConstellationGraph()).toBe(buildConstellationGraph())
  })
})
