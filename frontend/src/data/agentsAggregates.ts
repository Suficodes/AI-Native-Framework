// Derived data for the Agent module (requirements doc Section 8). Joins the
// Agent record out to everything its 9-tab profile page needs — process/QP
// assignments, harness, performance, token usage, value, risk/compliance,
// and audit history — without hand-computing any of it inline in a page
// component. Same derive-don't-hardcode pattern as organizationAggregates.ts
// and processesAggregates.ts.
import { dataset } from './mockApi'
import type {
  ID, Agent, Process, QualityProcedure, Position, Harness, AgentPerformanceRecord,
  TokenUsageRecord, VRRecord, BudgetControl, Incident, AgentRunEvent, Trace,
} from './types'
import { TOKEN_PERIODS } from './types'

export function positionForAgent(agent: Agent): Position | undefined {
  if (!agent.orgAssignment.positionId) return undefined
  return dataset.positions.find((p) => p.id === agent.orgAssignment.positionId)
}

/** Union of the agent's own assignedProcessIds and any ProcessStep that names it as assignedAgentId. */
export function processesForAgent(agent: Agent): Process[] {
  const fromField = new Set(agent.assignedProcessIds)
  const fromSteps = dataset.processSteps.filter((s) => s.assignedAgentId === agent.id).map((s) => s.processId)
  const ids = new Set([...fromField, ...fromSteps])
  return dataset.processes.filter((p) => ids.has(p.id))
}

/** Union of the agent's own assignedQpIds and any QualityProcedure that lists it in assignedAgentIds. */
export function qpsForAgent(agent: Agent): QualityProcedure[] {
  const fromField = new Set(agent.assignedQpIds)
  const fromQps = dataset.qualityProcedures.filter((q) => q.assignedAgentIds.includes(agent.id)).map((q) => q.id)
  const ids = new Set([...fromField, ...fromQps])
  return dataset.qualityProcedures.filter((q) => ids.has(q.id))
}

export function harnessForAgent(agent: Agent): Harness | undefined {
  if (!agent.harnessId) return undefined
  return dataset.harnesses.find((h) => h.id === agent.harnessId)
}

export function performanceForAgent(agentId: ID): AgentPerformanceRecord | undefined {
  return dataset.agentPerformance.find((r) => r.agentId === agentId)
}

/**
 * The agent's token usage for the most recent period, plus that period's
 * harness breakdown. The ledger carries one row per agent per month
 * (TOKEN_PERIODS), so this picks the latest rather than the first match —
 * `find` would silently have returned the oldest month.
 */
export function tokenUsageForAgent(agentId: ID): { agentRecord: TokenUsageRecord | undefined; harnessRecords: TokenUsageRecord[] } {
  const latestPeriod = TOKEN_PERIODS[TOKEN_PERIODS.length - 1]
  const agentRecord = dataset.tokenUsage.find(
    (t) => t.level === 'Agent' && t.refId === agentId && t.period === latestPeriod,
  )
  const harnessRecords = agentRecord
    ? dataset.tokenUsage.filter((t) => t.level === 'Harness' && t.parentId === agentRecord.id)
    : []
  return { agentRecord, harnessRecords }
}

/** Every period's agent-level row, oldest first — for trend rendering. */
export function tokenTrendForAgent(agentId: ID): TokenUsageRecord[] {
  return dataset.tokenUsage
    .filter((t) => t.level === 'Agent' && t.refId === agentId)
    .sort((a, b) => a.period.localeCompare(b.period))
}

export function valueRealizationForAgent(agentId: ID): VRRecord[] {
  return dataset.vrRecords.filter((v) => v.agentId === agentId)
}

export function budgetControlForAgent(agentId: ID): BudgetControl | undefined {
  return dataset.budgetControls.find((b) => b.agentId === agentId)
}

export function incidentsForAgent(agentId: ID): Incident[] {
  return dataset.incidents.filter((i) => i.agentId === agentId)
}

export function runsForAgent(agentId: ID): AgentRunEvent[] {
  return dataset.agentRuns.filter((r) => r.agentId === agentId).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function tracesForAgent(agentId: ID): Trace[] {
  return dataset.traces.filter((t) => t.agentId === agentId)
}
