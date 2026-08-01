import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import {
  strategyGraph, objectiveRollups, criterionRows, criterionProgressPct,
  deliveryStatusByObjective, riskByObjective, aiRoomRows, aiRoomById,
} from './strategyAggregates'

describe('strategy map', () => {
  it('builds every layer of the doc\'s chain, including the agent layer', () => {
    const graph = strategyGraph()
    const kinds = new Set(graph.nodes.map((n) => n.kind))
    // The agent layer was empty until the agent↔process backfill landed —
    // a map that skips from initiative straight to outcome is not the chain
    // Section 17 asks for.
    for (const kind of ['objective', 'criterion', 'division', 'process', 'initiative', 'agent', 'outcome']) {
      expect(kinds.has(kind as never), `${kind} layer missing`).toBe(true)
    }
  })

  it('draws no edge to a node that does not exist', () => {
    const graph = strategyGraph()
    const ids = new Set(graph.nodes.map((n) => n.id))
    for (const edge of graph.edges) {
      expect(ids.has(edge.source), `dangling source ${edge.source}`).toBe(true)
      expect(ids.has(edge.target), `dangling target ${edge.target}`).toBe(true)
    }
  })

  it('has no duplicate nodes or edges', () => {
    const graph = strategyGraph()
    expect(new Set(graph.nodes.map((n) => n.id)).size).toBe(graph.nodes.length)
    expect(new Set(graph.edges.map((e) => e.id)).size).toBe(graph.edges.length)
  })

  it('narrows to a single objective as a strict subset', () => {
    const all = strategyGraph()
    const scoped = strategyGraph('SO-01')
    expect(scoped.nodes.length).toBeGreaterThan(0)
    expect(scoped.nodes.length).toBeLessThan(all.nodes.length)
    const allIds = new Set(all.nodes.map((n) => n.id))
    for (const node of scoped.nodes) expect(allIds.has(node.id)).toBe(true)
    expect(scoped.nodes.filter((n) => n.kind === 'objective')).toHaveLength(1)
  })

  it('returns an empty graph rather than throwing for an unknown objective', () => {
    const graph = strategyGraph('SO-999')
    expect(graph.nodes).toHaveLength(0)
    expect(graph.edges).toHaveLength(0)
  })
})

describe('excellence criteria', () => {
  it('gives every criterion a baseline, current, target and direction', () => {
    expect(dataset.excellenceCriteria.length).toBeGreaterThan(0)
    for (const criterion of dataset.excellenceCriteria) {
      expect(criterion.unit.length).toBeGreaterThan(0)
      expect(criterion.baselineScore).toBeGreaterThan(0)
      expect(criterion.currentScore).toBeGreaterThan(0)
      expect(criterion.targetScore).toBeGreaterThan(0)
      expect(typeof criterion.higherIsBetter).toBe('boolean')
      // Baseline and target must differ, or "improvement" is undefined.
      expect(criterion.baselineScore).not.toBe(criterion.targetScore)
    }
  })

  it('measures progress in the criterion\'s own direction', () => {
    // Revenue leakage improves by going DOWN; a naive comparison would call it worsening.
    const leakage = dataset.excellenceCriteria.find((c) => c.name === 'Revenue leakage rate')!
    expect(leakage.higherIsBetter).toBe(false)
    expect(leakage.currentScore).toBeLessThan(leakage.baselineScore)
    expect(criterionProgressPct(leakage)).toBeGreaterThan(0)

    const reliability = dataset.excellenceCriteria.find((c) => c.name === 'Grid reliability index')!
    expect(reliability.higherIsBetter).toBe(true)
    expect(criterionProgressPct(reliability)).toBeGreaterThan(0)
  })

  it('reports direction correctly for both polarities', () => {
    const rows = criterionRows()
    expect(rows).toHaveLength(dataset.excellenceCriteria.length)
    // Every seeded criterion is currently moving the right way.
    expect(rows.every((r) => r.direction === 'improving')).toBe(true)
    for (const row of rows) {
      expect(row.progressPct).toBeGreaterThanOrEqual(0)
      expect(row.progressPct).toBeLessThanOrEqual(100)
      expect(row.objectiveName).not.toBe('—')
    }
  })
})

describe('objective rollups', () => {
  it('covers every strategic objective and accounts for every initiative', () => {
    const rollups = objectiveRollups()
    expect(rollups).toHaveLength(dataset.strategicObjectives.length)
    const totalInitiatives = rollups.reduce((s, r) => s + r.initiatives, 0)
    expect(totalInitiatives).toBe(dataset.aiInitiatives.length)
  })

  it('keeps contribution percentages inside 0-100', () => {
    for (const rollup of objectiveRollups()) {
      expect(rollup.agenticityContribution).toBeGreaterThanOrEqual(0)
      expect(rollup.agenticityContribution).toBeLessThanOrEqual(100)
      expect(rollup.excellenceImprovementPct).toBeGreaterThanOrEqual(0)
      expect(rollup.excellenceImprovementPct).toBeLessThanOrEqual(100)
    }
  })

  it('delivery status and risk breakdowns account for every initiative', () => {
    const delivery = deliveryStatusByObjective()
    const deliveryTotal = delivery.reduce(
      (s, d) => s + d.OnTrack + d.AtRisk + d.Delayed + d.Blocked + d.Complete, 0,
    )
    expect(deliveryTotal).toBe(dataset.aiInitiatives.length)

    const risk = riskByObjective()
    const riskTotal = risk.reduce((s, r) => s + r.Low + r.Medium + r.High, 0)
    expect(riskTotal).toBe(dataset.aiInitiatives.length)
  })
})

describe('AI Rooms', () => {
  it('has the eight rooms Section 17 names, each with all ten fields populated', () => {
    const rooms = aiRoomRows()
    expect(rooms).toHaveLength(8)
    for (const room of rooms) {
      expect(room.sponsorName.length).toBeGreaterThan(0)
      expect(room.strategicGoals.length).toBeGreaterThan(0)
      expect(room.priorityProcessIds.length).toBeGreaterThan(0)
      expect(room.activeInitiativeIds.length).toBeGreaterThan(0)
      expect(room.agentIds.length).toBeGreaterThan(0)
      expect(room.value.value).toBeGreaterThan(0)
      expect(room.risks.length).toBeGreaterThan(0)
      expect(room.playbookMaturity.length).toBeGreaterThan(0)
      expect(room.nextActions.length).toBeGreaterThan(0)
    }
  })

  it('gives each room its own agenda rather than repeating boilerplate', () => {
    const rooms = aiRoomRows()
    // Eight rooms sharing one set of goals reads as filler in a demo.
    expect(new Set(rooms.map((r) => r.strategicGoals.join('|'))).size).toBe(rooms.length)
    expect(new Set(rooms.map((r) => r.risks.join('|'))).size).toBe(rooms.length)
    expect(new Set(rooms.map((r) => r.nextActions.join('|'))).size).toBe(rooms.length)
  })

  it('resolves every referenced process, initiative, agent and harness to a name', () => {
    for (const room of aiRoomRows()) {
      for (const name of room.processNames) expect(name).not.toMatch(/^PROC-\d+$/)
      for (const item of room.initiativeTitles) expect(item.title).not.toBe(item.id)
      for (const item of room.agentNames) expect(item.name).not.toBe(item.id)
      for (const item of room.harnessNames) expect(item.name).not.toBe(item.id)
    }
  })

  it('looks a room up by id and returns undefined for an unknown one', () => {
    expect(aiRoomById('ROOM-01')?.name).toContain('AI Room')
    expect(aiRoomById('ROOM-99')).toBeUndefined()
  })
})
