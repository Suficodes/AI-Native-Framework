import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import { getCapabilityLibrary, AED_PER_MILLION_TOKENS } from './capabilityLibrary'

const lib = getCapabilityLibrary()

describe('the capability library', () => {
  it('covers every reusable skill in the dataset, and invents none', () => {
    expect(lib.skills).toHaveLength(dataset.reusableSkills.length)
    const seeded = new Set(dataset.reusableSkills.map((s) => s.id))
    for (const skill of lib.skills) expect(seeded.has(skill.id)).toBe(true)
  })

  it('keeps quarterly call counts in the 15–20 band', () => {
    for (const skill of lib.skills) {
      expect(skill.callsThisQuarter, skill.name).toBeGreaterThanOrEqual(15)
      expect(skill.callsThisQuarter, skill.name).toBeLessThanOrEqual(20)
    }
  })

  it('takes its reuse multiplier from real harness usage', () => {
    for (const skill of lib.skills) {
      const seeded = dataset.reusableSkills.find((s) => s.id === skill.id)!
      expect(skill.reuseInstances).toBe(seeded.usedByHarnessIds.length)
    }
  })

  it('avoids a build for every reuse instance past the first, and never for the first', () => {
    for (const skill of lib.skills) {
      const expected = skill.bespokeBuildCost * Math.max(0, skill.reuseInstances - 1)
      expect(skill.buildCostAvoided, skill.name).toBe(expected)
      if (skill.reuseInstances <= 1) expect(skill.buildCostAvoided, skill.name).toBe(0)
    }
  })

  it('prices run cost at the same rate as Token Economics', () => {
    for (const skill of lib.skills) {
      const expected =
        (skill.callsThisQuarter * skill.avgTokenCostPerCall / 1_000_000) * AED_PER_MILLION_TOKENS
      expect(skill.runCostThisQuarter).toBeCloseTo(expected, 6)
    }
    // Guard the constant itself: the seed's default rate is what this mirrors.
    expect(AED_PER_MILLION_TOKENS).toBe(30)
  })

  it('nets run cost off the avoided build cost', () => {
    for (const skill of lib.skills) {
      expect(skill.netAvoided).toBeCloseTo(skill.buildCostAvoided - skill.runCostThisQuarter, 6)
    }
  })

  it('totals match the rows they are summed from', () => {
    const t = lib.totals
    expect(t.skills).toBe(lib.skills.length)
    expect(t.calls).toBe(lib.skills.reduce((s, x) => s + x.callsThisQuarter, 0))
    expect(t.buildCostAvoided).toBe(lib.skills.reduce((s, x) => s + x.buildCostAvoided, 0))
    expect(t.netAvoided).toBeCloseTo(t.buildCostAvoided - t.runCost, 6)
    expect(t.memoryEntries).toBe(lib.memory.reduce((s, m) => s + m.entries, 0))
    expect(t.connectorCalls).toBe(lib.connectors.reduce((s, c) => s + c.callsThisQuarter, 0))
  })

  it('reports a positive, non-absurd saving', () => {
    // Sanity bounds: reuse should clearly beat rebuild, but not by a number
    // nobody would believe in a prototype.
    expect(lib.totals.netAvoided).toBeGreaterThan(0)
    expect(lib.totals.netAvoided).toBeLessThan(10_000_000)
    expect(lib.totals.runCost).toBeGreaterThan(0)
  })

  it('describes memory stores completely', () => {
    expect(lib.memory.length).toBeGreaterThan(0)
    for (const store of lib.memory) {
      expect(store.name).toBeTruthy()
      expect(store.holds).toBeTruthy()
      expect(store.retention).toBeTruthy()
      expect(store.scope).toBeTruthy()
      expect(store.entries).toBeGreaterThan(0)
      expect(store.recallHitRatePct).toBeGreaterThan(0)
      expect(store.recallHitRatePct).toBeLessThanOrEqual(100)
    }
    expect(lib.totals.avgRecallHitRatePct).toBeGreaterThan(0)
    expect(lib.totals.avgRecallHitRatePct).toBeLessThanOrEqual(100)
  })

  it('only counts calls against connectors that are actually live or piloting', () => {
    for (const connector of lib.connectors) {
      if (connector.status === 'Planned') expect(connector.callsThisQuarter, connector.name).toBe(0)
      else expect(connector.callsThisQuarter, connector.name).toBeGreaterThan(0)
    }
  })

  it('is memoized', () => {
    expect(getCapabilityLibrary()).toBe(getCapabilityLibrary())
  })
})
