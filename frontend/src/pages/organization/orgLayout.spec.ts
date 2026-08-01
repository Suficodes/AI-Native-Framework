import { describe, it, expect } from 'vitest'
import { layoutWithDagre } from './orgLayout'

describe('layoutWithDagre', () => {
  it('lays out a 3-node top-to-bottom chain with strictly increasing y', () => {
    const nodes = [
      { id: 'a', width: 200, height: 80 },
      { id: 'b', width: 200, height: 80 },
      { id: 'c', width: 200, height: 80 },
    ]
    const edges = [
      { id: 'a-b', source: 'a', target: 'b' },
      { id: 'b-c', source: 'b', target: 'c' },
    ]
    const laidOut = layoutWithDagre(nodes, edges, { direction: 'TB' })
    const byId = Object.fromEntries(laidOut.map((n) => [n.id, n.position]))
    expect(byId.a.y).toBeLessThan(byId.b.y)
    expect(byId.b.y).toBeLessThan(byId.c.y)
  })

  it('gives siblings distinct x positions', () => {
    const nodes = [
      { id: 'root', width: 200, height: 80 },
      { id: 'left', width: 200, height: 80 },
      { id: 'right', width: 200, height: 80 },
    ]
    const edges = [
      { id: 'root-left', source: 'root', target: 'left' },
      { id: 'root-right', source: 'root', target: 'right' },
    ]
    const laidOut = layoutWithDagre(nodes, edges, { direction: 'TB' })
    const byId = Object.fromEntries(laidOut.map((n) => [n.id, n.position]))
    expect(byId.left.x).not.toBe(byId.right.x)
  })
})
