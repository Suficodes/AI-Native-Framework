// Performance module aggregates (requirements doc Section 13) — the Agent
// Performance Index and its 13 KPIs, plus Human AI-Native Performance.
//
// The index weights live here as the single source of truth: performance.seed.ts
// applies them when it generates a record, and the UI reads them back to explain
// how a score was reached. Same derive-don't-hardcode rule as everywhere else.
import { dataset } from './mockApi'
import type {
  Agent, AgentPerformanceRecord, AgentPerformanceResult, Employee,
  HumanAiPerformanceRecord, ID,
} from './types'

/** Section 13's suggested Agent Performance Index dimensions and weights. */
export const INDEX_WEIGHTS = [
  { key: 'businessOutcome', label: 'Business outcome', weight: 0.25 },
  { key: 'quality', label: 'Quality', weight: 0.20 },
  { key: 'productivity', label: 'Productivity', weight: 0.15 },
  { key: 'reliability', label: 'Reliability', weight: 0.10 },
  { key: 'humanCollaboration', label: 'Human collaboration', weight: 0.10 },
  { key: 'costEfficiency', label: 'Cost efficiency', weight: 0.10 },
  { key: 'complianceAndSafety', label: 'Compliance and safety', weight: 0.10 },
] as const

export const PERFORMANCE_RESULTS: AgentPerformanceResult[] = [
  'ExceedsExpectations', 'MeetsExpectations', 'NeedsOptimization', 'Restricted', 'Suspended', 'Retired',
]

export const PERFORMANCE_RESULT_LABELS: Record<AgentPerformanceResult, string> = {
  ExceedsExpectations: 'Exceeds expectations',
  MeetsExpectations: 'Meets expectations',
  NeedsOptimization: 'Needs optimization',
  Restricted: 'Restricted',
  Suspended: 'Suspended',
  Retired: 'Retired',
}

const avg = (nums: number[]) => (nums.length === 0 ? 0 : nums.reduce((s, n) => s + n, 0) / nums.length)
const round1 = (n: number) => Math.round(n * 10) / 10

// ─────────────────────────── Agent performance ───────────────────────────

export interface AgentPerformanceRow extends AgentPerformanceRecord {
  agentName: string
  agentStatus: Agent['status']
  divisionId: ID
  sectionId: ID
}

/** Every agent performance record joined to its agent, ready for the register table. */
export function agentPerformanceRows(): AgentPerformanceRow[] {
  return dataset.agentPerformance.flatMap((record) => {
    const agent = dataset.agents.find((a) => a.id === record.agentId)
    if (!agent) return []
    return [{
      ...record,
      agentName: agent.name,
      agentStatus: agent.status,
      divisionId: agent.orgAssignment.divisionId,
      sectionId: agent.orgAssignment.sectionId,
    }]
  })
}

/** The 13 KPIs Section 13.A lists, averaged across the agent population. */
export function agentPerformanceKpis() {
  const records = dataset.agentPerformance
  const totalValue = records.reduce((s, r) => s + r.valueGenerated.value, 0)
  return {
    agentCount: records.length,
    successfulCompletionRatePct: round1(avg(records.map((r) => r.successfulCompletionRatePct))),
    accuracyPct: round1(avg(records.map((r) => r.accuracyPct))),
    firstTimeRightPct: round1(avg(records.map((r) => r.firstTimeRightPct))),
    qualityScore: round1(avg(records.map((r) => r.qualityScore))),
    slaCompliancePct: round1(avg(records.map((r) => r.slaCompliancePct))),
    reliabilityPct: round1(avg(records.map((r) => r.reliabilityPct))),
    humanOverrideRatePct: round1(avg(records.map((r) => r.humanOverrideRatePct))),
    exceptionRatePct: round1(avg(records.map((r) => r.exceptionRatePct))),
    escalationRatePct: round1(avg(records.map((r) => r.escalationRatePct))),
    costPerSuccessfulOutcome: round1(avg(records.map((r) => r.costPerSuccessfulOutcome))),
    tokenEfficiency: round1(avg(records.map((r) => r.tokenEfficiency))),
    complianceScore: round1(avg(records.map((r) => r.complianceScore))),
    valueGenerated: totalValue,
    indexScore: round1(avg(records.map((r) => r.index.weightedScore))),
  }
}

/** Result distribution across the six Section 13 outcomes — zero buckets kept so the axis is stable. */
export function agentResultDistribution(): { result: AgentPerformanceResult; label: string; count: number }[] {
  return PERFORMANCE_RESULTS.map((result) => ({
    result,
    label: PERFORMANCE_RESULT_LABELS[result],
    count: dataset.agentPerformance.filter((r) => r.result === result).length,
  }))
}

/** Population average per index dimension — the shape of the whole fleet's performance. */
export function indexDimensionAverages() {
  return INDEX_WEIGHTS.map((dim) => ({
    ...dim,
    average: round1(avg(dataset.agentPerformance.map((r) => r.index[dim.key]))),
  }))
}

/** The weighted contribution of each dimension to one agent's index score. */
export function indexBreakdown(record: AgentPerformanceRecord) {
  return INDEX_WEIGHTS.map((dim) => ({
    ...dim,
    score: record.index[dim.key],
    contribution: round1(record.index[dim.key] * dim.weight),
  }))
}

/** Cost per successful outcome against value generated — the efficiency scatter. */
export function costVsValueByAgent() {
  return agentPerformanceRows().map((row) => ({
    agent: row.agentName,
    costPerOutcome: row.costPerSuccessfulOutcome,
    valueGenerated: row.valueGenerated.value,
    indexScore: row.index.weightedScore,
  }))
}

// ─────────────────────────── Human AI-native performance ───────────────────────────

export interface HumanPerformanceRow extends HumanAiPerformanceRecord {
  employeeName: string
  positionTitle: string
  divisionId: ID
}

export function humanPerformanceRows(): HumanPerformanceRow[] {
  return dataset.humanPerformance.flatMap((record) => {
    const employee = dataset.employees.find((e) => e.id === record.employeeId)
    if (!employee) return []
    const position = dataset.positions.find((p) => p.id === employee.positionId)
    return [{
      ...record,
      employeeName: employee.name,
      positionTitle: position?.title ?? 'Unassigned',
      divisionId: employee.divisionId,
    }]
  })
}

/**
 * The nine Section 13.B dimensions, averaged. Deliberately does NOT include a
 * prompt count: "Do not measure employees only by prompt count" is an explicit
 * requirement, so no such metric exists anywhere in this module.
 */
export function humanPerformanceKpis() {
  const records = dataset.humanPerformance
  const released = records.reduce((s, r) => s + r.capacityReleasedHours, 0)
  const redeployed = records.reduce((s, r) => s + r.capacityRedeployedHours, 0)
  return {
    employeeCount: records.length,
    aiEnabledOutputQuality: round1(avg(records.map((r) => r.aiEnabledOutputQuality))),
    effectiveCopilotAgentUse: round1(avg(records.map((r) => r.effectiveCopilotAgentUse))),
    capacityReleasedHours: released,
    capacityRedeployedHours: redeployed,
    // The gap between released and redeployed is the number that decides
    // whether released capacity became a business outcome or just evaporated.
    redeploymentRatePct: released === 0 ? 0 : round1((redeployed / released) * 100),
    agentSupervisionEffectiveness: round1(avg(records.map((r) => r.agentSupervisionEffectiveness))),
    exceptionHandlingScore: round1(avg(records.map((r) => r.exceptionHandlingScore))),
    processImprovementContributions: records.reduce((s, r) => s + r.processImprovementContributions, 0),
    knowledgeContributionScore: round1(avg(records.map((r) => r.knowledgeContributionScore))),
    businessOutcomesScore: round1(avg(records.map((r) => r.businessOutcomesScore))),
    compliantPct: records.length === 0
      ? 0
      : round1((records.filter((r) => r.responsibleAiCompliance === 'Compliant').length / records.length) * 100),
  }
}

/** Capacity released vs redeployed per division — where the gap actually is. */
export function capacityByDivision() {
  const divisions = dataset.orgNodes.filter((n) => n.level === 'Division')
  return divisions.flatMap((division) => {
    const rows = humanPerformanceRows().filter((r) => r.divisionId === division.id)
    if (rows.length === 0) return []
    return [{
      division: division.name.replace(' Division', ''),
      released: rows.reduce((s, r) => s + r.capacityReleasedHours, 0),
      redeployed: rows.reduce((s, r) => s + r.capacityRedeployedHours, 0),
    }]
  })
}

export function employeeName(id: ID): string {
  return dataset.employees.find((e) => e.id === id)?.name ?? id
}

export function agentForRecord(record: AgentPerformanceRecord): Agent | undefined {
  return dataset.agents.find((a) => a.id === record.agentId)
}

export function employeeForRecord(record: HumanAiPerformanceRecord): Employee | undefined {
  return dataset.employees.find((e) => e.id === record.employeeId)
}
