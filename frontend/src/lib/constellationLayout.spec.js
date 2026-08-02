import { describe, it, expect } from 'vitest'
import { buildConstellationGraph, CORE_ID } from '../data/constellationGraph.ts'
import { radialLayout, neuralLayout, layoutFor, RADII } from './constellationLayout.js'

const graph = buildConstellationGraph()
const dist = (p) => Math.hypot(p.x, p.y)

describe('radialLayout', () => {
  it('puts the core at the origin', () => {
    const { positions } = radialLayout(graph)
    expect(positions.get(CORE_ID)).toEqual({ x: 0, y: 0, angle: 0 })
  })

  it('places every node of a tier on that tier’s radius', () => {
    const { positions } = radialLayout(graph)
    for (const node of graph.nodes) {
      if (node.tier === 'core') continue
      expect(dist(positions.get(node.id)), node.id).toBeCloseTo(RADII[node.tier], 2)
    }
  })

  it('gives every node a position', () => {
    const { positions } = radialLayout(graph)
    expect(positions.size).toBe(graph.nodes.length)
  })

  it('keeps every child strictly inside its parent’s angular sector', () => {
    const { positions, sectors } = radialLayout(graph)
    for (const node of graph.nodes) {
      if (!node.parentId || node.parentId === CORE_ID) continue
      const sector = sectors.get(node.parentId)
      const angle = positions.get(node.id).angle
      expect(angle, node.id).toBeGreaterThanOrEqual(sector.start)
      expect(angle, node.id).toBeLessThanOrEqual(sector.end)
    }
  })

  it('separates same-radius siblings by a strictly positive angle', () => {
    const { positions } = radialLayout(graph)
    for (const tier of ['domain', 'agent']) {
      const angles = graph.nodes
        .filter((n) => n.tier === tier)
        .map((n) => positions.get(n.id).angle)
        .sort((a, b) => a - b)
      for (let i = 1; i < angles.length; i += 1) {
        expect(angles[i] - angles[i - 1], `${tier} ${i}`).toBeGreaterThan(0)
      }
    }
  })

  it('weights each domain’s sector by its population, with a floor', () => {
    const { sectors } = radialLayout(graph)
    const span = (id) => sectors.get(id).end - sectors.get(id).start
    const byPopulation = [...graph.domains].sort(
      (a, b) => b.metrics.agentCount + b.metrics.leafCount - (a.metrics.agentCount + a.metrics.leafCount),
    )
    // The busiest division gets a wider sector than the quietest…
    expect(span(byPopulation[0].id)).toBeGreaterThan(span(byPopulation.at(-1).id))
    // …but the quietest still gets a usable, labelled spoke.
    expect(span(byPopulation.at(-1).id)).toBeGreaterThan(0.2)
  })

  it('returns a viewBox containing every position', () => {
    const { positions, viewBox } = radialLayout(graph)
    for (const p of positions.values()) {
      expect(p.x).toBeGreaterThanOrEqual(viewBox.x)
      expect(p.x).toBeLessThanOrEqual(viewBox.x + viewBox.w)
      expect(p.y).toBeGreaterThanOrEqual(viewBox.y)
      expect(p.y).toBeLessThanOrEqual(viewBox.y + viewBox.h)
    }
  })

  it('is deterministic', () => {
    const a = radialLayout(graph)
    const b = radialLayout(graph)
    for (const [id, p] of a.positions) expect(b.positions.get(id)).toEqual(p)
  })

  it('tightens the viewBox around the focused domain', () => {
    const focus = graph.domains[0].id
    const wide = radialLayout(graph).viewBox
    const near = radialLayout(graph, focus).viewBox
    expect(near.w).toBeLessThan(wide.w)
  })
})

describe('neuralLayout', () => {
  const busiest = [...graph.domains].sort((a, b) => b.metrics.leafCount - a.metrics.leafCount)[0]

  it('stacks the tiers top to bottom: leaves above agents above domains above the core', () => {
    const { positions } = neuralLayout(graph, busiest.id)
    const yOf = (tier) =>
      graph.nodes
        .filter((n) => n.tier === tier && n.domainId === busiest.domainId)
        .map((n) => positions.get(n.id).y)
    expect(Math.max(...yOf('leaf'))).toBeLessThan(Math.min(...yOf('agent')))
    expect(Math.max(...yOf('agent'))).toBeLessThan(Math.min(...yOf('domain')))
    expect(Math.max(...yOf('domain'))).toBeLessThan(positions.get(CORE_ID).y)
  })

  it('gives every node a position and is deterministic', () => {
    const a = neuralLayout(graph)
    const b = neuralLayout(graph)
    expect(a.positions.size).toBe(graph.nodes.length)
    for (const [id, p] of a.positions) expect(b.positions.get(id)).toEqual(p)
  })

  it('returns a viewBox containing every position', () => {
    const { positions, viewBox } = neuralLayout(graph)
    for (const p of positions.values()) {
      expect(p.x).toBeGreaterThanOrEqual(viewBox.x)
      expect(p.x).toBeLessThanOrEqual(viewBox.x + viewBox.w)
      expect(p.y).toBeGreaterThanOrEqual(viewBox.y)
      expect(p.y).toBeLessThanOrEqual(viewBox.y + viewBox.h)
    }
  })
})

describe('layoutFor', () => {
  it('dispatches on mode', () => {
    expect(layoutFor('radial', graph, null).positions.get(CORE_ID).y).toBe(0)
    expect(layoutFor('neural', graph, null).positions.get(CORE_ID).y).toBeGreaterThan(0)
  })
})
