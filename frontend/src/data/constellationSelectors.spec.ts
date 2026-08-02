import { describe, it, expect } from 'vitest'
import { buildConstellationGraph } from './constellationGraph'
import { branchOf, matchesFor } from './constellationSelectors'

const graph = buildConstellationGraph()
const anAgent = graph.nodes.find((n) => n.tier === 'agent' && (n.metrics.leafCount ?? 0) > 0)!

describe('branchOf', () => {
  it('returns null for no selection and for an unknown id', () => {
    expect(branchOf(graph, null)).toBeNull()
    expect(branchOf(graph, 'nope')).toBeNull()
  })

  it('includes the node, its ancestors up to the core, and all its descendants', () => {
    const branch = branchOf(graph, anAgent.id)!
    expect(branch.has(anAgent.id)).toBe(true)
    expect(branch.has(anAgent.parentId!)).toBe(true)
    expect(branch.has('core')).toBe(true)
    for (const leaf of graph.childrenOf.get(anAgent.id) ?? []) {
      expect(branch.has(leaf.id)).toBe(true)
    }
  })

  it('excludes siblings of the selected node', () => {
    const branch = branchOf(graph, anAgent.id)!
    const siblings = (graph.childrenOf.get(anAgent.parentId!) ?? []).filter((n) => n.id !== anAgent.id)
    for (const sibling of siblings) expect(branch.has(sibling.id)).toBe(false)
  })

  it('lights the whole graph from the core', () => {
    expect(branchOf(graph, 'core')!.size).toBe(graph.nodes.length)
  })
})

describe('matchesFor', () => {
  it('returns null for an empty or whitespace query', () => {
    expect(matchesFor(graph, '')).toBeNull()
    expect(matchesFor(graph, '   ')).toBeNull()
    expect(matchesFor(graph, null)).toBeNull()
  })

  it('matches on label, case-insensitively', () => {
    const matches = matchesFor(graph, anAgent.label.toUpperCase())!
    expect(matches.has(anAgent.id)).toBe(true)
  })

  it('matches on sublabel too', () => {
    const matches = matchesFor(graph, 'Quality Procedure')!
    const qpLeaves = graph.nodes.filter((n) => n.leafKind === 'qualityProcedure')
    for (const leaf of qpLeaves) expect(matches.has(leaf.id)).toBe(true)
  })

  it('returns an empty set — not null — when nothing matches', () => {
    const matches = matchesFor(graph, 'zzzz-no-such-thing')
    expect(matches).not.toBeNull()
    expect(matches!.size).toBe(0)
  })
})
