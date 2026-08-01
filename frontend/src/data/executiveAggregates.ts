// Executive Overview aggregation — all derived from mockApi's Dataset via
// dataset (the synchronous accessor), never hardcoded. One module so the
// page component stays focused on rendering.
import { dataset } from './mockApi'
import { AGENTICITY_ORDER } from './types'
import { aiWorkCoverage, acceptanceRate, accuracyRate, qualityAdjustedAiCoverage, usefulIntelligencePerAed, verifiedCapacityReleasedHours } from '../lib/calc'

const agenticityIndex = (lvl: string) => AGENTICITY_ORDER.indexOf(lvl as (typeof AGENTICITY_ORDER)[number])

export function computeExecutiveKpis() {
  const { positions, agents, processes, aiInitiatives, qualityProcedures, vrRecords, tokenUsage, workContribution } = dataset

  const byWorkforce = (t: string) => positions.filter((p) => p.workforceType === t).length
  const totalEmployees = dataset.employees.length
  const activeAgents = agents.filter((a) => a.status === 'Active').length
  const avgAgenticity = processes.reduce((s, p) => s + agenticityIndex(p.currentAgenticity), 0) / processes.length
  const activeInitiatives = aiInitiatives.filter((i) => ['Build', 'Evaluation', 'Probation', 'Production', 'Scaling'].includes(i.stage)).length
  const validatedAnnualValue = vrRecords.filter((v) => v.validationStatus === 'Realized' || v.validationStatus === 'Closed').reduce((s, v) => s + v.netBenefit, 0)
  const totalAiCost = agents.reduce((s, a) => s + a.cost.value, 0)
  const successfulOutcomes = vrRecords.reduce((s, v) => s + Math.max(0, v.actualResult), 0)
  const uiPerAed = usefulIntelligencePerAed(successfulOutcomes, totalAiCost || 1)
  const totalTokens = agents.reduce((s, a) => s + a.tokenConsumption, 0)
  const highRiskAgents = agents.filter((a) => a.status === 'Restricted' || a.humanOverrideRatePct > 25).length
  const activeQps = qualityProcedures.filter((q) => q.status === 'Active')
  const qpCompliance = activeQps.length ? activeQps.reduce((s, q) => s + q.currentAiCoveragePct, 0) / activeQps.length : 0
  const verifiedReleased = verifiedCapacityReleasedHours(workContribution)

  return {
    totalEmployees,
    humanOnly: byWorkforce('Human'),
    humanPlusCopilot: byWorkforce('HumanPlusCopilot'),
    humanPlusAgent: byWorkforce('HumanPlusAgent'),
    agentOnly: byWorkforce('AgentOnly'),
    activeAgents,
    processesAssessed: processes.length,
    avgAgenticityLabel: AGENTICITY_ORDER[Math.round(avgAgenticity)],
    activeInitiatives,
    validatedAnnualValue,
    totalAiCost,
    usefulIntelligencePerAed: uiPerAed,
    totalTokens,
    highRiskAgents,
    qpCompliancePct: Math.round(qpCompliance),
    verifiedCapacityReleasedHours: Math.round(verifiedReleased),
    tokenUsageRecords: tokenUsage.length,
  }
}

export function computeWorkforceDistribution() {
  const { positions } = dataset
  const total = positions.length
  const byType = (t: string) => positions.filter((p) => p.workforceType === t).length
  return [
    { name: 'Human-only', key: 'Human', value: byType('Human'), pct: Math.round((byType('Human') / total) * 100) },
    { name: 'Human + Copilot', key: 'HumanPlusCopilot', value: byType('HumanPlusCopilot'), pct: Math.round((byType('HumanPlusCopilot') / total) * 100) },
    { name: 'Human + Managed Agent', key: 'HumanPlusAgent', value: byType('HumanPlusAgent'), pct: Math.round((byType('HumanPlusAgent') / total) * 100) },
    { name: 'Agent-only', key: 'AgentOnly', value: byType('AgentOnly'), pct: Math.round((byType('AgentOnly') / total) * 100) },
  ]
}

export function computeAgenticityByDivision() {
  const { orgNodes, processes } = dataset
  const divisions = orgNodes.filter((n) => n.level === 'Division')
  return divisions.map((div) => {
    const divProcesses = processes.filter((p) => p.divisionId === div.id)
    const current = divProcesses.length ? divProcesses.reduce((s, p) => s + agenticityIndex(p.currentAgenticity), 0) / divProcesses.length : 0
    const target = divProcesses.length ? divProcesses.reduce((s, p) => s + agenticityIndex(p.targetAgenticity), 0) / divProcesses.length : 0
    return { division: div.name.replace(' Division', ''), current: Number(current.toFixed(1)), target: Number(target.toFixed(1)) }
  })
}

export function computeValueVsCostByDivision() {
  const { orgNodes, aiInitiatives } = dataset
  const divisions = orgNodes.filter((n) => n.level === 'Division')
  return divisions.map((div) => {
    const divInitiatives = aiInitiatives.filter((i) => i.divisionId === div.id)
    const value = divInitiatives.reduce((s, i) => s + i.realizedValue.value, 0)
    const cost = divInitiatives.reduce((s, i) => s + i.totalCost, 0)
    return { division: div.name.replace(' Division', ''), value, cost }
  })
}

export function computeAgentPerformanceDistribution() {
  const { agentPerformance } = dataset
  const buckets: Record<string, number> = {}
  for (const p of agentPerformance) buckets[p.result] = (buckets[p.result] ?? 0) + 1
  return Object.entries(buckets).map(([result, count]) => ({ result, count }))
}

export function computeStrategicObjectiveContribution() {
  const { strategicObjectives, aiInitiatives } = dataset
  return strategicObjectives.map((so) => {
    const related = aiInitiatives.filter((i) => i.strategicObjectiveId === so.id)
    const value = related.reduce((s, i) => s + i.realizedValue.value, 0)
    return { objective: so.name, value }
  })
}

export function computeInitiativeDeliveryStatus() {
  const { aiInitiatives } = dataset
  const buckets: Record<string, number> = {}
  for (const i of aiInitiatives) buckets[i.status] = (buckets[i.status] ?? 0) + 1
  return Object.entries(buckets).map(([status, count]) => ({ status, count }))
}

export function computeTokenCostByModel() {
  const { tokenUsage } = dataset
  const byModel: Record<string, number> = {}
  for (const t of tokenUsage) byModel[t.model] = (byModel[t.model] ?? 0) + t.cost
  return Object.entries(byModel).map(([model, cost]) => ({ model, cost: Math.round(cost) })).sort((a, b) => b.cost - a.cost)
}

export function computeQpComplianceBySection() {
  const { orgNodes, qualityProcedures } = dataset
  const sections = orgNodes.filter((n) => n.level === 'Section')
  return sections
    .map((sec) => {
      const qps = qualityProcedures.filter((q) => q.sectionOwnerId === sec.id)
      if (!qps.length) return null
      const compliance = qps.reduce((s, q) => s + q.currentAiCoveragePct, 0) / qps.length
      return { section: sec.name.replace(' Section', ''), compliance: Math.round(compliance) }
    })
    .filter((x): x is { section: string; compliance: number } => x !== null)
}

export function computeWorkforceLedgerSummary() {
  const { workContribution } = dataset
  const coverage = aiWorkCoverage(workContribution)
  const acc = acceptanceRate(workContribution)
  const accu = accuracyRate(workContribution)
  return {
    aiAssistedCoveragePct: Math.round(coverage * 10) / 10,
    qualityAdjustedCoveragePct: Math.round(qualityAdjustedAiCoverage(coverage, acc, accu) * 10) / 10,
  }
}

export function computeAttentionItems() {
  const { agents, budgetControls, vrRecords, qualityProcedures, harnesses, aiInitiatives, incidents } = dataset

  const agentsUnderReview = agents.filter((a) => ['Evaluation', 'Probation', 'Restricted'].includes(a.status))
  const tokenBudgetOverruns = agents.filter((a) => {
    const budget = budgetControls.find((b) => b.agentId === a.id)
    return budget && a.cost.value > budget.annualBudget * 0.85
  })
  const unvalidatedBenefits = vrRecords.filter((v) => !['Realized', 'Closed'].includes(v.validationStatus))
  const expiredQps = qualityProcedures.filter((q) => q.status === 'Expired' || q.status === 'UnderReview')
  const failedEvaluations = harnesses.filter((h) => h.evaluationSuite.some((e) => e.scorePct < 80))
  const delayedInitiatives = aiInitiatives.filter((i) => i.status === 'Delayed' || i.status === 'Blocked')
  const highOverrideAgents = agents.filter((a) => a.humanOverrideRatePct > 25)
  const openIncidents = incidents.filter((i) => i.status !== 'Resolved' && (i.severity === 'High' || i.severity === 'Critical'))

  return {
    agentsUnderReview, tokenBudgetOverruns, unvalidatedBenefits, expiredQps,
    failedEvaluations, delayedInitiatives, highOverrideAgents, openIncidents,
  }
}
