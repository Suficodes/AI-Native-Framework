import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import {
  INDEX_WEIGHTS, PERFORMANCE_RESULTS, agentPerformanceKpis, agentPerformanceRows,
  agentResultDistribution, indexBreakdown, indexDimensionAverages,
  humanPerformanceKpis, humanPerformanceRows, capacityByDivision,
} from './performanceAggregates'

describe('agent performance', () => {
  it('uses the Section 13 index weights, which sum to 1', () => {
    const total = INDEX_WEIGHTS.reduce((s, d) => s + d.weight, 0)
    expect(Math.round(total * 100) / 100).toBe(1)
    expect(INDEX_WEIGHTS).toHaveLength(7)
  })

  it('reproduces each record\'s weighted index score from its own dimensions', () => {
    for (const record of dataset.agentPerformance) {
      const recomputed = Math.round(indexBreakdown(record).reduce((s, d) => s + d.contribution, 0))
      // Allow one point for the seed rounding its own weighted sum.
      expect(Math.abs(recomputed - record.index.weightedScore), record.agentId).toBeLessThanOrEqual(1)
    }
  })

  it('joins every performance record to a real agent', () => {
    const rows = agentPerformanceRows()
    expect(rows).toHaveLength(dataset.agentPerformance.length)
    const agentIds = new Set(dataset.agents.map((a) => a.id))
    for (const row of rows) {
      expect(agentIds.has(row.agentId)).toBe(true)
      expect(row.agentName.length).toBeGreaterThan(0)
    }
  })

  it('produces all 13 Section 13.A KPIs inside plausible ranges', () => {
    const kpis = agentPerformanceKpis()
    expect(kpis.agentCount).toBe(dataset.agents.length)
    for (const key of [
      'successfulCompletionRatePct', 'accuracyPct', 'firstTimeRightPct', 'qualityScore',
      'slaCompliancePct', 'reliabilityPct', 'humanOverrideRatePct', 'exceptionRatePct',
      'escalationRatePct', 'tokenEfficiency', 'complianceScore', 'indexScore',
    ] as const) {
      expect(kpis[key], key).toBeGreaterThanOrEqual(0)
      expect(kpis[key], key).toBeLessThanOrEqual(100)
    }
    expect(kpis.valueGenerated).toBeGreaterThan(0)
    expect(kpis.costPerSuccessfulOutcome).toBeGreaterThan(0)
  })

  it('keeps all six result buckets, including empty ones, and accounts for every agent', () => {
    const distribution = agentResultDistribution()
    expect(distribution.map((d) => d.result)).toEqual(PERFORMANCE_RESULTS)
    expect(distribution.reduce((s, d) => s + d.count, 0)).toBe(dataset.agentPerformance.length)
  })

  it('averages every index dimension across the fleet', () => {
    const dims = indexDimensionAverages()
    expect(dims).toHaveLength(7)
    for (const dim of dims) {
      expect(dim.average).toBeGreaterThan(0)
      expect(dim.average).toBeLessThanOrEqual(100)
    }
  })
})

describe('human AI-native performance', () => {
  it('joins every record to a real employee and position', () => {
    const rows = humanPerformanceRows()
    expect(rows).toHaveLength(dataset.humanPerformance.length)
    for (const row of rows) {
      expect(row.employeeName.length).toBeGreaterThan(0)
      expect(row.positionTitle.length).toBeGreaterThan(0)
    }
  })

  it('exposes the nine Section 13.B dimensions and no prompt-count metric', () => {
    const kpis = humanPerformanceKpis()
    // The doc is explicit: "Do not measure employees only by prompt count."
    const keys = Object.keys(kpis).map((k) => k.toLowerCase())
    expect(keys.some((k) => k.includes('prompt'))).toBe(false)
    for (const key of [
      'aiEnabledOutputQuality', 'effectiveCopilotAgentUse', 'agentSupervisionEffectiveness',
      'exceptionHandlingScore', 'knowledgeContributionScore', 'businessOutcomesScore', 'compliantPct',
    ] as const) {
      expect(kpis[key], key).toBeGreaterThan(0)
      expect(kpis[key], key).toBeLessThanOrEqual(100)
    }
  })

  it('reports redeployed capacity as a share of released capacity', () => {
    const kpis = humanPerformanceKpis()
    expect(kpis.capacityReleasedHours).toBeGreaterThan(0)
    expect(kpis.capacityRedeployedHours).toBeGreaterThan(0)
    // Released capacity that is never redeployed is the gap the KPI exists to expose.
    expect(kpis.capacityRedeployedHours).toBeLessThanOrEqual(kpis.capacityReleasedHours)
    expect(kpis.redeploymentRatePct).toBeLessThanOrEqual(100)
  })

  it('breaks capacity down by division without inventing empty rows', () => {
    const rows = capacityByDivision()
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.released).toBeGreaterThan(0)
      expect(row.redeployed).toBeGreaterThanOrEqual(0)
    }
  })
})
