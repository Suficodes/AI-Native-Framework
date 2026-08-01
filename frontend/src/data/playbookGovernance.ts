// Playbook sections 9–12 — the "under what controls, at what cost" half of the
// AI Playbook (requirements doc Section 10): harness requirements, governance,
// value opportunity, and token budget.
//
// Same rule as playbookGuidance.ts: derived from the resolved PlaybookScope
// over the real dataset, never hand-authored per scope. Money formulas come
// from lib/calc.ts rather than being recomputed here (CONVENTIONS.md).
import { dataset } from './mockApi'
import {
  ACCOUNTABLE_ROLES, APPROVAL_GATES, BASELINE_HARNESS_REQUIREMENTS,
  GOVERNANCE_RULES, TOKEN_BUDGET_GUIDANCE,
} from './seed/playbook.seed'
import { aiValueRealizationPct, costPerVerifiedHourReleased, round1 } from '../lib/calc'
import type {
  BenefitCategory, Harness, PlaybookGovernance, PlaybookHarnessRequirement,
  PlaybookScope, PlaybookTokenBudget, PlaybookValueOpportunity,
} from './types'

const round = (n: number) => Math.round(n)

// ─────────────────────────── 9. Harness requirements ───────────────────────────

/** Does one harness satisfy one baseline requirement? */
function satisfies(harness: Harness, check: typeof BASELINE_HARNESS_REQUIREMENTS[number]['check']): boolean {
  switch (check) {
    case 'workflowStages': return harness.workflowStages.length >= 11
    case 'guardrails': return harness.guardrails.length >= 5
    case 'humanApprovalPoints': return harness.humanApprovalPoints.length >= 1
    case 'evaluationSuite': return harness.evaluationSuite.length >= 3
    case 'loggingPolicy': return harness.loggingPolicy.trim().length > 0
    case 'tokenLimit': return harness.tokenLimit > 0 && harness.retryLimits > 0 && harness.killSwitchEnabled
  }
}

export function harnessRequirements(scope: PlaybookScope): PlaybookHarnessRequirement[] {
  const harnesses = dataset.harnesses.filter((h) => scope.harnessIds.includes(h.id))
  return BASELINE_HARNESS_REQUIREMENTS.map(({ requirement, category, check }) => {
    if (harnesses.length === 0) {
      return {
        requirement,
        category,
        status: 'NotMet' as const,
        evidence: 'No harness exists in this scope yet — this requirement applies to the first one built.',
      }
    }
    const met = harnesses.filter((h) => satisfies(h, check)).length
    return {
      requirement,
      category,
      status: met === harnesses.length ? ('Met' as const) : met === 0 ? ('NotMet' as const) : ('Partial' as const),
      evidence: `${met} of ${harnesses.length} in-scope harness${harnesses.length === 1 ? '' : 'es'} satisfy this requirement.`,
    }
  })
}

// ─────────────────────────── 10. Governance ───────────────────────────

export function governance(scope: PlaybookScope): PlaybookGovernance {
  const agents = dataset.agents.filter((a) => scope.agentIds.includes(a.id))
  const qps = dataset.qualityProcedures.filter((q) => scope.qpIds.includes(q.id))
  const incidents = dataset.incidents.filter((i) => i.agentId != null && scope.agentIds.includes(i.agentId))

  const avgCompliance = agents.length === 0 ? 0 : agents.reduce((s, a) => s + a.complianceScore, 0) / agents.length
  const avgOverride = agents.length === 0 ? 0 : agents.reduce((s, a) => s + a.humanOverrideRatePct, 0) / agents.length
  const owned = agents.filter((a) => a.managerEmployeeId && a.businessOwnerEmployeeId && a.technicalOwnerEmployeeId && a.riskOwnerEmployeeId)

  // A Set, not an array: two incidents can share a severity and a title, and a
  // duplicated risk line is both a content bug and a React key collision.
  const openRisks = new Set<string>()
  for (const incident of incidents.filter((i) => i.status !== 'Resolved').slice(0, 4)) {
    openRisks.add(`${incident.severity} severity incident open: ${incident.title}`)
  }
  for (const agent of agents.filter((a) => a.complianceScore < 80).slice(0, 3)) {
    openRisks.add(`${agent.name} compliance score is ${agent.complianceScore} — below the 80 threshold for autonomy increases`)
  }
  const overdue = qps.filter((q) => new Date(q.reviewDate) < new Date() && q.status !== 'Retired')
  if (overdue.length > 0) openRisks.add(`${overdue.length} Quality Procedure(s) in scope are past their review date`)
  const unsupervised = agents.filter((a) => a.autonomyLevel === 'L5' || a.autonomyLevel === 'L6')
  if (unsupervised.length > 0) openRisks.add(`${unsupervised.length} agent(s) operate at L5+ autonomy and require standing Risk Review attention`)
  // Left genuinely empty when clean — the section renders a positive state
  // rather than a warning banner wrapped around a "no risks" sentence.

  return {
    rules: GOVERNANCE_RULES,
    approvalGates: APPROVAL_GATES,
    accountableRoles: ACCOUNTABLE_ROLES,
    complianceSnapshot: [
      { label: 'Average compliance score', value: round(avgCompliance), suffix: '', tag: 'Observed' },
      { label: 'Agents with all four owners named', value: agents.length === 0 ? 0 : round((owned.length / agents.length) * 100), suffix: '%', tag: 'Verified' },
      { label: 'Average human override rate', value: round1(avgOverride), suffix: '%', tag: 'Observed' },
      { label: 'Mandatory human control points', value: qps.filter((q) => q.indicator === 'C').length, suffix: '', tag: 'Verified' },
    ],
    openRisks: [...openRisks],
  }
}

// ─────────────────────────── 11. Value opportunity ───────────────────────────

export function valueOpportunity(scope: PlaybookScope): PlaybookValueOpportunity {
  const steps = dataset.processSteps.filter((s) => scope.processIds.includes(s.processId))
  const initiatives = dataset.aiInitiatives.filter((i) => scope.initiativeIds.includes(i.id))
  const vrRecords = dataset.vrRecords.filter((v) => scope.initiativeIds.includes(v.aiInitiativeId))

  const totalAiCost = vrRecords.reduce((s, v) => s + v.aiCost.reduce((c, line) => c + line.amount, 0), 0)
  const byType = new Map<BenefitCategory, number>()
  for (const record of vrRecords) {
    byType.set(record.benefitType, (byType.get(record.benefitType) ?? 0) + record.grossBenefit)
  }

  return {
    processOpportunity: { value: steps.reduce((s, step) => s + step.valueOpportunity.value, 0), tag: 'Estimated' },
    initiativeExpectedValue: { value: initiatives.reduce((s, i) => s + i.expectedValue.value, 0), tag: 'Estimated' },
    realizedNetBenefit: { value: vrRecords.reduce((s, v) => s + v.netBenefit, 0), tag: 'Validated' },
    totalAiCost,
    benefitRealizationPct: round1(aiValueRealizationPct(
      vrRecords.reduce((s, v) => s + v.actualResult, 0),
      vrRecords.reduce((s, v) => s + v.target, 0),
    )),
    byBenefitType: [...byType.entries()]
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount),
  }
}

// ─────────────────────────── 12. Token budget ───────────────────────────

export function tokenBudget(scope: PlaybookScope): PlaybookTokenBudget {
  const agentIds = new Set(scope.agentIds)
  const usage = dataset.tokenUsage.filter((t) => t.level === 'Agent' && agentIds.has(t.refId))
  const budgets = dataset.budgetControls.filter((b) => agentIds.has(b.agentId))

  const periodCost = usage.reduce((s, t) => s + t.cost, 0)
  const annualBudget = budgets.reduce((s, b) => s + b.annualBudget, 0)
  const monthlyBudget = budgets.reduce((s, b) => s + b.monthlyBudget, 0)

  // Verified hours released by the people this scope covers — the denominator
  // for the doc's cost-per-verified-hour-released control metric.
  const employeeIds = new Set(scope.employeeIds)
  const processIds = new Set(scope.processIds)
  const verifiedHours = dataset.workContribution
    .filter((r) => employeeIds.has(r.employeeId) || processIds.has(r.processId))
    .reduce((s, r) => s + r.verifiedTimeReleasedHours.value, 0)

  return {
    periodCost: round(periodCost),
    inputTokens: usage.reduce((s, t) => s + t.inputTokens, 0),
    outputTokens: usage.reduce((s, t) => s + t.outputTokens, 0),
    cachedTokens: usage.reduce((s, t) => s + t.cachedTokens, 0),
    annualBudget,
    monthlyBudget,
    utilizationPct: annualBudget === 0 ? 0 : round1((periodCost / annualBudget) * 100),
    costPerVerifiedHourReleased: round1(costPerVerifiedHourReleased(periodCost, verifiedHours)),
    guidance: TOKEN_BUDGET_GUIDANCE,
  }
}
