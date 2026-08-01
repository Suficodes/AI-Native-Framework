import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import {
  LATEST_PERIOD, ancestryOf, childrenOf, childrenAreSample, enterpriseKpis,
  enterpriseRow, agentConsumption, budgetVariance, tokenTrend, usageByModel,
} from './tokenAggregates'
import { TOKEN_LEVEL_ORDER, TOKEN_PERIODS } from './types'

describe('token ledger hierarchy', () => {
  it('has a row at every one of the nine levels, in every period', () => {
    for (const period of TOKEN_PERIODS) {
      const rows = dataset.tokenUsage.filter((r) => r.period === period)
      for (const level of TOKEN_LEVEL_ORDER) {
        // Transactions are only sampled for the latest period.
        if (level === 'Transaction' && period !== LATEST_PERIOD) continue
        expect(rows.some((r) => r.level === level), `${period} has no ${level} row`).toBe(true)
      }
    }
  })

  it('every aggregate row equals the exact sum of its children', () => {
    const byParent = new Map<string, typeof dataset.tokenUsage>()
    for (const r of dataset.tokenUsage) {
      if (r.parentId) byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r])
    }
    let checked = 0
    for (const parent of dataset.tokenUsage) {
      const children = byParent.get(parent.id)
      if (!children || children.length === 0) continue
      // Transaction rows are an explicit sample, not the full population.
      if (children[0].level === 'Transaction') continue
      checked++
      expect(children.reduce((s, c) => s + c.cost, 0), `${parent.level} ${parent.refLabel} cost`).toBe(parent.cost)
      expect(children.reduce((s, c) => s + c.inputTokens, 0), `${parent.level} ${parent.refLabel} input`).toBe(parent.inputTokens)
      expect(children.reduce((s, c) => s + c.outputTokens, 0), `${parent.level} ${parent.refLabel} output`).toBe(parent.outputTokens)
      expect(children.reduce((s, c) => s + c.transactionCount, 0), `${parent.level} ${parent.refLabel} calls`).toBe(parent.transactionCount)
      expect(children.reduce((s, c) => s + c.successfulOutcomes, 0), `${parent.level} ${parent.refLabel} outcomes`).toBe(parent.successfulOutcomes)
    }
    // Guard against the check silently passing because nothing was verified.
    expect(checked).toBeGreaterThan(100)
  })

  it('a child never exceeds its parent — the bug the old flat generator had', () => {
    for (const row of dataset.tokenUsage) {
      if (!row.parentId) continue
      const parent = dataset.tokenUsage.find((r) => r.id === row.parentId)!
      expect(row.cost, `${row.level} ${row.refLabel} > parent`).toBeLessThanOrEqual(parent.cost)
    }
  })

  it('drills from the enterprise root down to a transaction', () => {
    const root = enterpriseRow()!
    let current = root
    const levels = [root.level]
    while (true) {
      const children = childrenOf(current.id)
      if (children.length === 0) break
      current = children[0]
      levels.push(current.level)
    }
    expect(levels).toEqual(TOKEN_LEVEL_ORDER)
    // And the breadcrumb back up returns the same chain.
    expect(ancestryOf(current.id).map((r) => r.level)).toEqual(TOKEN_LEVEL_ORDER)
  })

  it('flags the transaction level as a sample, and no other level', () => {
    for (const row of dataset.tokenUsage) {
      const children = childrenOf(row.id)
      if (children.length === 0) continue
      expect(childrenAreSample(row)).toBe(children[0].level === 'Transaction')
    }
  })
})

describe('token KPIs', () => {
  it('produces all eleven Section 15 KPI cards with sane values', () => {
    const kpis = enterpriseKpis()
    expect(kpis.totalTokens).toBeGreaterThan(0)
    expect(kpis.totalTokenCost).toBeGreaterThan(0)
    expect(kpis.avgCostPerTransaction).toBeGreaterThan(0)
    expect(kpis.costPerSuccessfulOutcome).toBeGreaterThanOrEqual(kpis.avgCostPerTransaction)
    expect(kpis.tokensPerSuccessfulOutcome).toBeGreaterThan(0)
    for (const ratio of [kpis.wastedTokenRatioPct, kpis.retryTokenRatioPct, kpis.cacheUtilizationPct, kpis.smallModelRoutingRatePct]) {
      expect(ratio).toBeGreaterThanOrEqual(0)
      expect(ratio).toBeLessThanOrEqual(100)
    }
    // Retry tokens are a subset of wasted tokens by construction.
    expect(kpis.retryTokenRatioPct).toBeLessThanOrEqual(kpis.wastedTokenRatioPct)
    expect(kpis.valuePerMillionTokens).toBeGreaterThan(0)
    expect(kpis.budgetConsumptionPct).toBeGreaterThan(0)
  })

  it('the all-periods total equals the sum of the individual periods', () => {
    const all = enterpriseKpis('all')
    const perPeriod = TOKEN_PERIODS.reduce((s, p) => s + enterpriseKpis(p).totalTokenCost, 0)
    expect(all.totalTokenCost).toBe(perPeriod)
  })

  it('prices every model an agent can be assigned — no model falls back to a default rate', () => {
    const ledgerModels = new Set(usageByModel('all').map((m) => m.model))
    for (const agent of dataset.agents) {
      expect(ledgerModels.has(agent.model), `${agent.model} missing from the ledger`).toBe(true)
    }
  })

  it('reports a trend across every reporting period', () => {
    const trend = tokenTrend()
    expect(trend).toHaveLength(TOKEN_PERIODS.length)
    expect(trend.every((t) => t.tokens > 0 && t.transactions > 0)).toBe(true)
  })
})

describe('budget controls', () => {
  it('gives every agent a budget derived from its own consumption, never zero', () => {
    const variance = budgetVariance()
    expect(variance).toHaveLength(dataset.agents.length)
    for (const row of variance) {
      expect(row.annualBudget).toBeGreaterThan(0)
      expect(row.consumptionPct).toBeGreaterThan(0)
      // The calibration bug this replaced produced 0% for every agent.
      expect(row.consumptionPct).toBeLessThan(400)
    }
  })

  it('flags exactly the agents at or past their alert level', () => {
    for (const row of budgetVariance()) {
      expect(row.breached).toBe(row.consumptionPct >= row.alertLevelPct)
    }
  })

  it('ranks agent consumption by cost, descending', () => {
    const costs = agentConsumption().map((a) => a.cost)
    expect([...costs].sort((a, b) => b - a)).toEqual(costs)
  })
})
