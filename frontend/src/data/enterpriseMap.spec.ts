import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import { buildEnterpriseGraph } from './enterpriseMapGraph'
import {
  LENSES, FILTERS, applyLens, discloseGraph, defaultExpansion, expansionPathTo,
  nodeDepths, lensById,
} from './enterpriseMapLenses'
import { STORY_STEPS, MAP_QUESTIONS } from './enterpriseMapStory'

describe('the shared enterprise graph', () => {
  it('is a single connected tree with exactly one root', () => {
    const graph = buildEnterpriseGraph()
    const roots = graph.nodes.filter((n) => !n.parentId)
    expect(roots).toHaveLength(1)
    expect(roots[0].kind).toBe('enterprise')
  })

  it('has no dangling parent, and no dangling edge endpoint', () => {
    const graph = buildEnterpriseGraph()
    const ids = new Set(graph.nodes.map((n) => n.id))
    for (const node of graph.nodes) {
      if (node.parentId) expect(ids.has(node.parentId), `${node.id} parent`).toBe(true)
    }
    for (const edge of graph.edges) {
      expect(ids.has(edge.source), `${edge.id} source`).toBe(true)
      expect(ids.has(edge.target), `${edge.id} target`).toBe(true)
    }
  })

  it('has unique node and edge ids', () => {
    const graph = buildEnterpriseGraph()
    expect(new Set(graph.nodes.map((n) => n.id)).size).toBe(graph.nodes.length)
    expect(new Set(graph.edges.map((e) => e.id)).size).toBe(graph.edges.length)
  })

  it('covers every level of the doc\'s primary hierarchy', () => {
    const kinds = new Set(buildEnterpriseGraph().nodes.map((n) => n.kind))
    for (const kind of [
      'enterprise', 'objective', 'criterion', 'division', 'superDepartment', 'department',
      'section', 'position', 'employee', 'agent', 'activity', 'process', 'qualityProcedure',
      'initiative', 'harness', 'system', 'outcome', 'value', 'cost',
    ]) {
      expect(kinds.has(kind as never), `${kind} missing from the map`).toBe(true)
    }
  })

  it('carries every cross-cutting relationship the lenses and toggles need', () => {
    const kinds = new Set(buildEnterpriseGraph().edges.map((e) => e.kind))
    for (const kind of [
      'contains', 'contributes', 'governs', 'executes', 'supervises',
      'delivers', 'controls', 'value', 'token', 'depends', 'staffs',
    ]) {
      expect(kinds.has(kind as never), `${kind} edges missing`).toBe(true)
    }
  })

  it('reflects the real record counts rather than a parallel copy', () => {
    const graph = buildEnterpriseGraph()
    const count = (kind: string) => graph.nodes.filter((n) => n.kind === kind).length
    expect(count('division')).toBe(dataset.orgNodes.filter((n) => n.level === 'Division').length)
    expect(count('agent')).toBe(dataset.agents.length)
    expect(count('process')).toBe(dataset.processes.length)
    expect(count('initiative')).toBe(dataset.aiInitiatives.length)
    expect(count('value')).toBe(dataset.vrRecords.length)
  })
})

describe('applyLens', () => {
  it('gives every one of the ten lenses a non-empty, rooted result', () => {
    expect(LENSES).toHaveLength(10)
    for (const lens of LENSES) {
      const result = applyLens(lens.id)
      expect(result.nodes.length, `${lens.id} is empty`).toBeGreaterThan(0)
      expect(result.edges.length, `${lens.id} has no edges`).toBeGreaterThan(0)
      expect(result.nodes.some((n) => n.kind === 'enterprise'), `${lens.id} lost its root`).toBe(true)
    }
  })

  it('is pure — it never mutates the shared graph', () => {
    const before = buildEnterpriseGraph()
    const nodeCount = before.nodes.length
    const edgeCount = before.edges.length
    for (const lens of LENSES) {
      applyLens(lens.id, { filters: ['agent-supported'], search: 'agent' })
      discloseGraph(applyLens(lens.id), defaultExpansion(lens.id))
    }
    const after = buildEnterpriseGraph()
    expect(after.nodes.length).toBe(nodeCount)
    expect(after.edges.length).toBe(edgeCount)
  })

  it('returns identical output for identical input', () => {
    const a = applyLens('value', { filters: ['high-value'] })
    const b = applyLens('value', { filters: ['high-value'] })
    expect(a.nodes.map((n) => n.id)).toEqual(b.nodes.map((n) => n.id))
    expect(a.edges.map((e) => e.id)).toEqual(b.edges.map((e) => e.id))
  })

  it('keeps only declared kinds and the ancestors that root them', () => {
    // Ancestors can be any kind, not just the org spine: an agent is parented
    // by its primary process, so the Workforce lens legitimately carries a
    // process node to hang that agent from. The invariant is that every node is
    // either declared by the lens, or on the path from a declared node to the root.
    for (const lens of LENSES) {
      const declared = new Set(lens.nodeKinds)
      const result = applyLens(lens.id)
      const declaredIds = result.nodes.filter((n) => declared.has(n.kind)).map((n) => n.id)
      const justified = new Set(declaredIds)
      for (const id of declaredIds) for (const ancestorId of expansionPathTo(id)) justified.add(ancestorId)
      for (const node of result.nodes) {
        expect(justified.has(node.id), `${lens.id} leaked an unreachable ${node.kind}`).toBe(true)
      }
    }
  })

  it('only keeps edge kinds the lens declares, plus explicitly toggled ones', () => {
    const lens = lensById('organization')
    expect(applyLens('organization').edges.every((e) => lens.edgeKinds.includes(e.kind))).toBe(true)
    const withFlows = applyLens('organization', { extraEdgeKinds: ['value'] })
    expect(withFlows.edges.every((e) => e.kind === 'contains' || e.kind === 'value')).toBe(true)
  })

  it('every filter genuinely narrows its lens rather than thinning it', () => {
    for (const filter of FILTERS) {
      // Pick a lens that actually carries the filtered kind.
      const lens = LENSES.find((l) => applyLens(l.id, { filters: [filter.id] }).nodes.length > 0
        && applyLens(l.id).nodes.length > applyLens(l.id, { filters: [filter.id] }).nodes.length)
      expect(lens, `${filter.id} narrows no lens`).toBeDefined()
    }
  })

  it('scopes to one division, keeping only that subtree plus the root', () => {
    const division = buildEnterpriseGraph().nodes.find((n) => n.kind === 'division')!
    const scoped = applyLens('process', { divisionNodeId: division.id })
    const full = applyLens('process')
    expect(scoped.nodes.length).toBeLessThan(full.nodes.length)
    expect(scoped.nodes.filter((n) => n.kind === 'division')).toHaveLength(1)
    for (const node of scoped.nodes) {
      if (node.kind === 'enterprise') continue
      const inSubtree = node.id === division.id || expansionPathTo(node.id).includes(division.id)
      expect(inSubtree, `${node.id} outside the division`).toBe(true)
    }
  })

  it('matches search terms without dropping the surrounding map', () => {
    const result = applyLens('workforce', { search: 'documentation' })
    expect(result.matched.size).toBeGreaterThan(0)
    for (const id of result.matched) {
      expect(result.nodes.some((n) => n.id === id)).toBe(true)
    }
  })
})

describe('progressive disclosure', () => {
  it('keeps every default view inside a readable size', () => {
    for (const lens of LENSES) {
      const visible = discloseGraph(applyLens(lens.id), defaultExpansion(lens.id))
      expect(visible.nodes.length, `${lens.id} empty`).toBeGreaterThan(0)
      // Section 18: "should remain understandable and not appear as an
      // uncontrolled network of hundreds of nodes".
      expect(visible.nodes.length, `${lens.id} floods the canvas`).toBeLessThan(100)
    }
  })

  it('collapsing hides descendants but never the collapsed node itself', () => {
    const result = applyLens('organization')
    const rootOnly = discloseGraph(result, new Set<string>())
    expect(rootOnly.nodes).toHaveLength(1)
    expect(rootOnly.nodes[0].kind).toBe('enterprise')
  })

  it('lifts a hidden endpoint to its nearest visible ancestor instead of dropping the edge', () => {
    // Value flows out of agents; collapse to divisions and the flow must still
    // be visible at division level rather than vanishing.
    const result = applyLens('value', { extraEdgeKinds: ['value'] })
    const shallow = discloseGraph(result, defaultExpansion('value', 2))
    const visibleIds = new Set(shallow.nodes.map((n) => n.id))
    expect(shallow.edges.length).toBeGreaterThan(0)
    for (const edge of shallow.edges) {
      expect(visibleIds.has(edge.source), `${edge.id} source hidden`).toBe(true)
      expect(visibleIds.has(edge.target), `${edge.id} target hidden`).toBe(true)
      expect(edge.source).not.toBe(edge.target)
    }
  })

  it('never leaves a visible node whose parent is hidden', () => {
    for (const lens of LENSES) {
      const visible = discloseGraph(applyLens(lens.id), defaultExpansion(lens.id))
      const visibleIds = new Set(visible.nodes.map((n) => n.id))
      const inLens = new Set(applyLens(lens.id).nodes.map((n) => n.id))
      for (const node of visible.nodes) {
        if (node.parentId && inLens.has(node.parentId)) {
          expect(visibleIds.has(node.parentId), `${node.id} orphaned in ${lens.id}`).toBe(true)
        }
      }
    }
  })

  it('deepens monotonically — more depth never shows fewer nodes', () => {
    let previous = 0
    for (let depth = 1; depth <= 7; depth++) {
      const count = discloseGraph(applyLens('value'), defaultExpansion('value', depth)).nodes.length
      expect(count).toBeGreaterThanOrEqual(previous)
      previous = count
    }
  })
})

describe('Story Mode', () => {
  it('walks the fourteen steps Section 18 lists, in order', () => {
    expect(STORY_STEPS).toHaveLength(14)
    expect(STORY_STEPS.map((s) => s.number)).toEqual([...Array(14)].map((_, i) => i + 1))
  })

  it('every step resolves to a real lens and renders something', () => {
    const lensIds = new Set(LENSES.map((l) => l.id))
    for (const step of STORY_STEPS) {
      expect(lensIds.has(step.lens), `step ${step.number} lens`).toBe(true)
      const visible = discloseGraph(
        applyLens(step.lens, {
          filters: step.filters,
          extraEdgeKinds: step.extraEdgeKinds,
          divisionNodeId: step.divisionNodeId,
        }),
        defaultExpansion(step.lens, step.depth),
      )
      expect(visible.nodes.length, `step ${step.number} renders nothing`).toBeGreaterThan(0)
      // Story steps override the lens depth, so the readability bound the
      // default views are held to has to be enforced here too — otherwise a
      // walkthrough beat can flood the canvas the lens never would.
      expect(visible.nodes.length, `step ${step.number} floods the canvas`).toBeLessThan(70)
      expect(step.narration.length, `step ${step.number} has no narration`).toBeGreaterThan(40)
    }
  })

  it('states the eleven questions the finished map must answer', () => {
    expect(MAP_QUESTIONS).toHaveLength(11)
  })
})

describe('node depths', () => {
  it('puts the enterprise at depth 0 and every other node below it', () => {
    const depths = nodeDepths()
    const graph = buildEnterpriseGraph()
    const root = graph.nodes.find((n) => n.kind === 'enterprise')!
    expect(depths.get(root.id)).toBe(0)
    for (const node of graph.nodes) {
      if (node.id === root.id) continue
      expect(depths.get(node.id)!).toBeGreaterThan(0)
    }
  })
})
