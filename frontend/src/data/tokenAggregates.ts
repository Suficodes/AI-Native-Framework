// Token Economics aggregates (requirements doc Section 15): the nine-level
// drill-down, the eleven KPI cards, and the eight visualizations.
//
// The ledger is generated bottom-up (see seed/tokenUsage.seed.ts), so every
// figure here is a plain sum over real rows — no level is estimated, and a
// parent always equals its children.
import { dataset } from './mockApi'
import { SMALL_MODELS } from './seed/tokenUsage.seed'
import type { ID, TokenLevel, TokenUsageRecord } from './types'
import { TOKEN_LEVEL_ORDER, TOKEN_PERIODS } from './types'

export const LATEST_PERIOD = TOKEN_PERIODS[TOKEN_PERIODS.length - 1]

const round1 = (n: number) => Math.round(n * 10) / 10
const pct = (numerator: number, denominator: number) => (denominator === 0 ? 0 : round1((numerator / denominator) * 100))

/** Rows for one period, or every period when `period` is 'all'. */
function rowsIn(period: string): TokenUsageRecord[] {
  return period === 'all' ? dataset.tokenUsage : dataset.tokenUsage.filter((r) => r.period === period)
}

// ─────────────────────────── Drill-down ───────────────────────────

/** The root of the hierarchy for a period — the Enterprise row. */
export function enterpriseRow(period: string = LATEST_PERIOD): TokenUsageRecord | undefined {
  return dataset.tokenUsage.find((r) => r.level === 'Enterprise' && r.period === period)
}

export function tokenRowById(id: ID): TokenUsageRecord | undefined {
  return dataset.tokenUsage.find((r) => r.id === id)
}

/** Direct children of a ledger row, largest spend first. */
export function childrenOf(rowId: ID): TokenUsageRecord[] {
  return dataset.tokenUsage.filter((r) => r.parentId === rowId).sort((a, b) => b.cost - a.cost)
}

/** Enterprise → … → this row, for the drill-down breadcrumb. */
export function ancestryOf(rowId: ID): TokenUsageRecord[] {
  const chain: TokenUsageRecord[] = []
  let current = tokenRowById(rowId)
  while (current) {
    chain.unshift(current)
    current = current.parentId ? tokenRowById(current.parentId) : undefined
  }
  return chain
}

/**
 * Whether a row's children are the complete population or a sample. Transaction
 * rows are a deliberate sample of individual calls (a real ledger would hold
 * millions), so the UI must say so rather than implying the numbers reconcile.
 */
export function childrenAreSample(row: TokenUsageRecord): boolean {
  return childrenOf(row.id)[0]?.level === 'Transaction'
}

export function levelLabel(level: TokenLevel): string {
  return level
}

export function nextLevel(level: TokenLevel): TokenLevel | null {
  const i = TOKEN_LEVEL_ORDER.indexOf(level)
  return i >= 0 && i < TOKEN_LEVEL_ORDER.length - 1 ? TOKEN_LEVEL_ORDER[i + 1] : null
}

// ─────────────────────────── KPIs ───────────────────────────

/** Aggregate a set of ledger rows that are all at the same level (never mixed — that would double-count). */
function totals(rows: TokenUsageRecord[]) {
  return {
    inputTokens: rows.reduce((s, r) => s + r.inputTokens, 0),
    outputTokens: rows.reduce((s, r) => s + r.outputTokens, 0),
    cachedTokens: rows.reduce((s, r) => s + r.cachedTokens, 0),
    retryTokens: rows.reduce((s, r) => s + r.retryTokens, 0),
    retries: rows.reduce((s, r) => s + r.retries, 0),
    transactionCount: rows.reduce((s, r) => s + r.transactionCount, 0),
    successfulOutcomes: rows.reduce((s, r) => s + r.successfulOutcomes, 0),
    cost: rows.reduce((s, r) => s + r.cost, 0),
    value: rows.reduce((s, r) => s + r.value.value, 0),
  }
}

/**
 * The eleven KPI cards Section 15 lists, for a scope of ledger rows.
 * `scopeRows` must be one level of the hierarchy (e.g. all Enterprise rows for
 * a period, or the children of one node) so nothing is counted twice.
 */
export function tokenKpis(scopeRows: TokenUsageRecord[], modelRows: TokenUsageRecord[], budget: number) {
  const t = totals(scopeRows)
  const totalTokens = t.inputTokens + t.outputTokens
  const failedTransactions = t.transactionCount - t.successfulOutcomes
  // Tokens spent without producing an accepted outcome: retried attempts plus
  // the share attributable to failed calls. This is the "wasted" denominator
  // an operator can actually act on.
  const failedTokens = t.transactionCount === 0 ? 0 : Math.round((totalTokens / t.transactionCount) * failedTransactions)
  const smallModelCost = modelRows.filter((r) => SMALL_MODELS.has(r.model)).reduce((s, r) => s + r.cost, 0)
  const allModelCost = modelRows.reduce((s, r) => s + r.cost, 0)

  return {
    totalTokens,
    totalTokenCost: t.cost,
    avgCostPerTransaction: t.transactionCount === 0 ? 0 : round1(t.cost / t.transactionCount),
    costPerSuccessfulOutcome: t.successfulOutcomes === 0 ? 0 : round1(t.cost / t.successfulOutcomes),
    tokensPerSuccessfulOutcome: t.successfulOutcomes === 0 ? 0 : Math.round(totalTokens / t.successfulOutcomes),
    wastedTokenRatioPct: pct(t.retryTokens + failedTokens, totalTokens),
    retryTokenRatioPct: pct(t.retryTokens, totalTokens),
    cacheUtilizationPct: pct(t.cachedTokens, t.inputTokens),
    smallModelRoutingRatePct: pct(smallModelCost, allModelCost),
    valuePerMillionTokens: totalTokens === 0 ? 0 : Math.round(t.value / (totalTokens / 1_000_000)),
    budgetConsumptionPct: pct(t.cost, budget),
    transactionCount: t.transactionCount,
    successfulOutcomes: t.successfulOutcomes,
  }
}

/** Enterprise-wide KPIs for a period ('all' for the full ledger). */
export function enterpriseKpis(period: string = LATEST_PERIOD) {
  const rows = rowsIn(period)
  const scopeRows = rows.filter((r) => r.level === 'Enterprise')
  const modelRows = rows.filter((r) => r.level === 'Model')
  const annualBudget = dataset.budgetControls.reduce((s, b) => s + b.annualBudget, 0)
  // A single month is measured against a month of budget; 'all' against the
  // months the ledger actually covers.
  const months = period === 'all' ? TOKEN_PERIODS.length : 1
  return tokenKpis(scopeRows, modelRows, (annualBudget / 12) * months)
}

// ─────────────────────────── Visualizations ───────────────────────────

/** 1. Token cost by division (latest period unless told otherwise). */
export function costByDivision(period: string = LATEST_PERIOD) {
  return rowsIn(period)
    .filter((r) => r.level === 'Division')
    .map((r) => ({ division: r.refLabel.replace(' Division', ''), cost: r.cost }))
    .sort((a, b) => b.cost - a.cost)
}

/** 2. Token usage by model. */
export function usageByModel(period: string = LATEST_PERIOD) {
  const byModel = new Map<string, { tokens: number; cost: number }>()
  for (const r of rowsIn(period).filter((r) => r.level === 'Model')) {
    const entry = byModel.get(r.model) ?? { tokens: 0, cost: 0 }
    byModel.set(r.model, { tokens: entry.tokens + r.inputTokens + r.outputTokens, cost: entry.cost + r.cost })
  }
  return [...byModel.entries()]
    .map(([model, v]) => ({ model, ...v, isSmall: SMALL_MODELS.has(model) }))
    .sort((a, b) => b.cost - a.cost)
}

/** 3. Token trend over time, and 4. tokens versus successful outcomes. */
export function tokenTrend() {
  return TOKEN_PERIODS.map((period) => {
    const row = enterpriseRow(period)
    return {
      period,
      tokens: row ? row.inputTokens + row.outputTokens : 0,
      cost: row?.cost ?? 0,
      successfulOutcomes: row?.successfulOutcomes ?? 0,
      transactions: row?.transactionCount ?? 0,
    }
  })
}

/** 5. Cost versus realized value, per division. */
export function costVsValueByDivision(period: string = LATEST_PERIOD) {
  return rowsIn(period)
    .filter((r) => r.level === 'Division')
    .map((r) => ({ division: r.refLabel.replace(' Division', ''), cost: r.cost, value: r.value.value }))
}

/** 6. Top consuming agents, and 7. high retry agents. */
export function agentConsumption(period: string = LATEST_PERIOD) {
  return rowsIn(period)
    .filter((r) => r.level === 'Agent')
    .map((r) => ({
      agentId: r.refId,
      agent: r.refLabel,
      cost: r.cost,
      tokens: r.inputTokens + r.outputTokens,
      transactions: r.transactionCount,
      retryRatePct: r.transactionCount === 0 ? 0 : round1((r.retries / r.transactionCount) * 100),
      retryTokenPct: pct(r.retryTokens, r.inputTokens + r.outputTokens),
    }))
    .sort((a, b) => b.cost - a.cost)
}

/** 8. Token budget variance — spend run-rate against each agent's approved budget. */
export function budgetVariance() {
  const monthsCovered = TOKEN_PERIODS.length
  return dataset.budgetControls.flatMap((budget) => {
    const agent = dataset.agents.find((a) => a.id === budget.agentId)
    if (!agent) return []
    const spend = dataset.tokenUsage
      .filter((r) => r.level === 'Agent' && r.refId === budget.agentId)
      .reduce((s, r) => s + r.cost, 0)
    const annualizedSpend = Math.round((spend / monthsCovered) * 12)
    return [{
      agentId: agent.id,
      agent: agent.name,
      spendToDate: spend,
      annualizedSpend,
      annualBudget: budget.annualBudget,
      variance: budget.annualBudget - annualizedSpend,
      consumptionPct: pct(annualizedSpend, budget.annualBudget),
      alertLevelPct: budget.alertLevelPct,
      breached: pct(annualizedSpend, budget.annualBudget) >= budget.alertLevelPct,
    }]
  }).sort((a, b) => b.consumptionPct - a.consumptionPct)
}

/** Sampled transactions under a Model row, for the transaction table and detail page. */
export function sampledTransactions(): TokenUsageRecord[] {
  return dataset.tokenUsage.filter((r) => r.level === 'Transaction')
}

export function transactionById(txId: ID): TokenUsageRecord | undefined {
  return dataset.tokenUsage.find((r) => r.level === 'Transaction' && r.refId === txId)
}
