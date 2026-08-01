import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import {
  vrRows, vrPortfolioSummary, valueByDivision, valueByAgent, valueByBenefitType,
  valueByStrategicObjective, costByCategory, validationFunnel, baselineComparison,
  businessCaseRows, postGoLiveRecords, isValidated, totalCostOf,
} from './valueAggregates'
import { netValue, aiValueRealizationPct } from '../lib/calc'
import { VR_STAGE_ORDER } from './types'

describe('VR records', () => {
  it('resolves every foreign key the doc requires on a VR record', () => {
    const employees = new Set(dataset.employees.map((e) => e.id))
    const agents = new Set(dataset.agents.map((a) => a.id))
    const harnesses = new Set(dataset.harnesses.map((h) => h.id))
    const initiatives = new Set(dataset.aiInitiatives.map((i) => i.id))

    for (const record of dataset.vrRecords) {
      expect(initiatives.has(record.aiInitiativeId), `${record.id} initiative`).toBe(true)
      for (const field of ['businessOwnerId', 'benefitOwnerId', 'financeValidatorId', 'bpiValidatorId', 'pmoValidatorId'] as const) {
        expect(employees.has(record[field]), `${record.id}.${field}`).toBe(true)
      }
      // agentId used to be filled from an initiative's *employee* owner field.
      if (record.agentId) expect(agents.has(record.agentId), `${record.id} agent`).toBe(true)
      if (record.harnessId) expect(harnesses.has(record.harnessId), `${record.id} harness`).toBe(true)
    }
  })

  it('resolves an agent and a harness for most records rather than leaving them blank', () => {
    const withAgent = dataset.vrRecords.filter((r) => r.agentId).length
    expect(withAgent).toBeGreaterThan(dataset.vrRecords.length / 2)
    // A harness is only meaningful where an agent was resolved.
    for (const record of dataset.vrRecords) {
      if (record.harnessId) expect(record.agentId).toBeTruthy()
    }
  })

  it('joins each record to its initiative and division for the portfolio table', () => {
    const rows = vrRows()
    expect(rows).toHaveLength(dataset.vrRecords.length)
    for (const row of rows) {
      expect(row.initiativeTitle.length).toBeGreaterThan(0)
      expect(row.totalCost).toBe(totalCostOf(row))
    }
  })
})

describe('portfolio summary', () => {
  it('uses the doc\'s own formulas rather than recomputing them', () => {
    const summary = vrPortfolioSummary()
    const validated = dataset.vrRecords.filter(isValidated)
    const validatedBenefit = validated.reduce((s, r) => s + r.grossBenefit, 0)
    const expectedBenefit = dataset.vrRecords.reduce((s, r) => s + r.target, 0)
    const totalCost = dataset.vrRecords.reduce((s, r) => s + totalCostOf(r), 0)

    expect(summary.validatedBenefit).toBe(validatedBenefit)
    expect(summary.netValue).toBe(netValue(validatedBenefit, totalCost))
    expect(summary.valueRealizationPct).toBe(Math.round(aiValueRealizationPct(validatedBenefit, expectedBenefit) * 10) / 10)
  })

  it('keeps validated and unvalidated benefit separate and exhaustive', () => {
    const summary = vrPortfolioSummary()
    expect(summary.validatedBenefit + summary.unvalidatedBenefit).toBe(summary.realizedBenefit)
  })
})

describe('breakdowns', () => {
  it('every breakdown returns non-empty, descending data', () => {
    const breakdowns: { name: string; values: number[] }[] = [
      { name: 'benefit type', values: valueByBenefitType().map((r) => r.benefit) },
      { name: 'cost category', values: costByCategory().map((r) => r.amount) },
      { name: 'agent', values: valueByAgent().map((r) => r.net) },
      { name: 'objective', values: valueByStrategicObjective().map((r) => r.net) },
    ]
    for (const { name, values } of breakdowns) {
      expect(values.length, `${name} is empty`).toBeGreaterThan(0)
      expect([...values].sort((a, b) => b - a), `${name} not sorted`).toEqual(values)
    }
  })

  it('benefit by type sums to total realized benefit — nothing is dropped', () => {
    const total = valueByBenefitType().reduce((s, r) => s + r.benefit, 0)
    expect(total).toBe(vrPortfolioSummary().realizedBenefit)
  })

  it('cost by category sums to total AI cost', () => {
    const total = costByCategory().reduce((s, r) => s + r.amount, 0)
    expect(total).toBe(vrPortfolioSummary().totalAiCost)
  })

  it('division breakdown covers only divisions that actually have records', () => {
    const rows = valueByDivision()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.benefit > 0 || r.cost > 0)).toBe(true)
  })
})

describe('workflow views', () => {
  it('the validation funnel covers all nine stages and accounts for every record', () => {
    const funnel = validationFunnel()
    expect(funnel).toHaveLength(VR_STAGE_ORDER.length)
    expect(funnel.reduce((s, f) => s + f.count, 0)).toBe(dataset.vrRecords.length)
  })

  it('post-go-live shows only records that have gone live', () => {
    const live = postGoLiveRecords()
    expect(live.length).toBeGreaterThan(0)
    expect(live.length).toBeLessThan(dataset.vrRecords.length)
    for (const row of live) {
      expect(['PostGoLiveTracking', 'Realized', 'Closed']).toContain(row.validationStatus)
    }
  })

  it('baseline comparison carries a baseline, target and actual for every record', () => {
    for (const row of baselineComparison()) {
      expect(row.baseline).toBeGreaterThan(0)
      expect(row.target).toBeGreaterThan(row.baseline)
      expect(row.actual).toBeGreaterThan(0)
    }
  })

  it('business case ROI is net benefit over cost', () => {
    for (const row of businessCaseRows()) {
      const expected = row.totalCost === 0 ? 0 : Math.round((row.netBenefit / row.totalCost) * 1000) / 10
      expect(row.roiPct).toBe(expected)
    }
  })
})
