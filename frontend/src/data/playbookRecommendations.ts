// Playbook sections 6 and 7 — "Recommended copilots and agents" and the
// "Buy / configure / build decision" (requirements doc Section 10).
//
// Split out of playbookAggregates.ts because it is the one section with real
// decision logic rather than a rollup: the doc requires ten specific fields per
// recommendation, and each is derived from the initiative, its process, its
// Quality Procedures, and the agent already serving it — never hand-authored
// per recommendation.
//
// Over the 200-line module cap: the decision rules (sourcing, complexity,
// priority, human controls) are only meaningful together, and section 8's data
// requirements are read from the same agent/harness/QP joins.
import { dataset } from './mockApi'
import { SOURCING_CRITERIA } from './seed/playbook.seed'
import type {
  AIInitiative, AgenticityLevel, PlaybookRecommendedAgent, PlaybookRequiredData,
  PlaybookScope, PlaybookSourcingCriterion, Process, SourcingDecision,
} from './types'
import { AGENTICITY_ORDER } from './types'

const PLATFORM_BY_DECISION: Record<SourcingDecision, string> = {
  Buy: 'Microsoft 365 Copilot',
  Configure: 'Microsoft Copilot Studio',
  Build: 'Enterprise AI platform (custom harness)',
}

function levelIndex(level: AgenticityLevel): number {
  return AGENTICITY_ORDER.indexOf(level)
}

/** Buy / configure / build, decided from the initiative's own shape — see SOURCING_CRITERIA. */
function decideSourcing(initiative: AIInitiative): { decision: SourcingDecision; rationale: string } {
  const target = levelIndex(initiative.agenticityTarget)
  if (initiative.aiType === 'AutonomousAgent' || target >= levelIndex('L4')) {
    return {
      decision: 'Build',
      rationale: `Targets ${initiative.agenticityTarget} autonomy, which needs a full harness with a custom evaluation suite and guardrails.`,
    }
  }
  if (initiative.aiType === 'Copilot' && initiative.relatedQpId == null) {
    return {
      decision: 'Buy',
      rationale: 'Generic assistive work with no DEWA-specific Quality Procedure encoded — covered by the existing licence.',
    }
  }
  if (initiative.harnessReadiness < 40) {
    return {
      decision: 'Build',
      rationale: `Harness readiness is ${initiative.harnessReadiness}% — the required controls do not exist in a configurable platform yet.`,
    }
  }
  return {
    decision: 'Configure',
    rationale: 'Standard workflow with DEWA-specific knowledge, prompts, and approvals — configurable on an existing platform.',
  }
}

function complexityOf(initiative: AIInitiative): 'Low' | 'Medium' | 'High' {
  const score = levelIndex(initiative.agenticityTarget)
    + (100 - initiative.dataReadiness) / 25
    + (100 - initiative.harnessReadiness) / 25
  return score >= 8 ? 'High' : score >= 5 ? 'Medium' : 'Low'
}

function humanRoleFor(process: Process | undefined, scope: PlaybookScope): string {
  if (!process) return 'Section staff'
  const inScope = new Set(scope.positionIds)
  const owning = dataset.positions.find((p) => inScope.has(p.id) && p.relatedProcessIds.includes(process.id))
    ?? dataset.positions.find((p) => p.relatedProcessIds.includes(process.id))
    ?? dataset.positions.find((p) => p.sectionId === process.ownerSectionId)
  return owning?.title ?? 'Section staff'
}

/** Human controls required, read off the Quality Procedures that govern the process. */
function humanControlsFor(process: Process | undefined, initiative: AIInitiative): string[] {
  const controls = new Set<string>()
  const qps = dataset.qualityProcedures.filter(
    (q) => q.id === initiative.relatedQpId || (process != null && q.relatedProcessId === process.id),
  )
  for (const qp of qps) {
    if (qp.indicator === 'C') controls.add(`Mandatory human control retained in ${qp.id} — ${qp.title}`)
    if (qp.indicator === 'E') controls.add(`Exception escalation to a named role in ${qp.id}`)
    // QP.approvals holds bare role names — as a control line they need the verb.
    for (const approval of qp.approvals.slice(0, 2)) controls.add(`Sign-off by ${approval}`)
  }
  const harness = dataset.harnesses.find((h) => process != null && h.assignedProcessId === process.id)
  for (const point of harness?.humanApprovalPoints ?? []) controls.add(point)
  if (controls.size === 0) controls.add('Human review and approval before any system commit')
  return [...controls].slice(0, 5)
}

/** Expected AI contribution — the target agent share across the process's steps. */
function expectedContributionPct(process: Process | undefined, initiative: AIInitiative): number {
  if (!process) return Math.round((levelIndex(initiative.agenticityTarget) / levelIndex('L6')) * 100)
  const steps = dataset.processSteps.filter((s) => s.processId === process.id)
  if (steps.length === 0) return Math.round((levelIndex(initiative.agenticityTarget) / levelIndex('L6')) * 100)
  return Math.round(steps.reduce((sum, s) => sum + s.agentContributionPct, 0) / steps.length)
}

function problemFor(process: Process | undefined, initiative: AIInitiative): string {
  if (!process) {
    return `${initiative.title} is currently delivered without AI support, so effort scales linearly with volume.`
  }
  const steps = dataset.processSteps.filter((s) => s.processId === process.id)
  const humanSteps = steps.filter((s) => s.currentOwner === 'Human').length
  const avgException = steps.length === 0
    ? 0
    : Math.round(steps.reduce((sum, s) => sum + s.exceptionRatePct, 0) / steps.length)
  return `${humanSteps} of ${steps.length} steps in ${process.name} are fully human-owned at ${process.currentAgenticity}, `
    + `with an average exception rate of ${avgException}% — repeatable, evidence-bound work absorbing specialist time.`
}

function maturityOf(initiative: AIInitiative): PlaybookRecommendedAgent['maturity'] {
  if (initiative.stage === 'Production' || initiative.stage === 'Scaling') return 'Live'
  if (initiative.stage === 'Idea' || initiative.stage === 'Assessment') return 'Proposed'
  return 'In delivery'
}

/**
 * Section 6 — one recommendation per in-scope AI initiative, carrying all ten
 * fields the doc requires. Sorted by delivery priority, then expected value.
 */
export function recommendedAgents(scope: PlaybookScope): PlaybookRecommendedAgent[] {
  const inScope = new Set(scope.initiativeIds)
  const initiatives = dataset.aiInitiatives.filter((i) => inScope.has(i.id))
  if (initiatives.length === 0) return []

  // Priority is relative to what else is in scope: high value + tractable first.
  const values = initiatives.map((i) => i.expectedValue.value).sort((a, b) => b - a)
  const highValueCut = values[Math.max(0, Math.floor(values.length / 3) - 1)] ?? 0

  const recommendations = initiatives.map((initiative) => {
    const process = dataset.processes.find((p) => p.id === initiative.relatedProcessId)
    const { decision, rationale } = decideSourcing(initiative)
    const complexity = complexityOf(initiative)
    const contributionPct = expectedContributionPct(process, initiative)
    // Only count an agent as already serving this recommendation if it is
    // genuinely assigned to the process — a section-level match would attach
    // the same agent to several unrelated initiatives.
    const servingAgent = process == null ? undefined : dataset.agents.find(
      (a) => a.assignedProcessIds.includes(process.id)
        || dataset.processSteps.some((s) => s.processId === process.id && s.assignedAgentId === a.id),
    )

    const highValue = initiative.expectedValue.value >= highValueCut
    const deliveryPriority: PlaybookRecommendedAgent['deliveryPriority'] =
      complexity === 'High' && initiative.riskLevel === 'High' ? 'P3'
        : highValue && complexity !== 'High' ? 'P1'
          : 'P2'

    return {
      id: initiative.id,
      name: initiative.title,
      problemAddressed: problemFor(process, initiative),
      processSupported: process?.name ?? 'Not yet mapped to a registered process',
      processId: process?.id,
      humanRoleAffected: humanRoleFor(process, scope),
      expectedAiContributionPct: contributionPct,
      expectedAiContribution: `Agent carries ~${contributionPct}% of process effort at ${initiative.agenticityTarget}; the human retains judgement, exceptions, and approval.`,
      requiredHumanControls: humanControlsFor(process, initiative),
      recommendedPlatform: PLATFORM_BY_DECISION[decision],
      sourcing: decision,
      sourcingRationale: rationale,
      expectedValue: initiative.expectedValue,
      complexity,
      risk: initiative.riskLevel,
      deliveryPriority,
      maturity: maturityOf(initiative),
      agentId: servingAgent?.id,
      initiativeId: initiative.id,
    } satisfies PlaybookRecommendedAgent
  })

  const order: Record<string, number> = { P1: 0, P2: 1, P3: 2 }
  return recommendations.sort(
    (a, b) => order[a.deliveryPriority] - order[b.deliveryPriority] || b.expectedValue.value - a.expectedValue.value,
  )
}

/** Section 7 — the decision criteria, with how many in-scope recommendations landed on each. */
export function sourcingCriteria(recommendations: PlaybookRecommendedAgent[]): PlaybookSourcingCriterion[] {
  return SOURCING_CRITERIA.map((criterion) => ({
    ...criterion,
    recommendedCount: recommendations.filter((r) => r.sourcing === criterion.decision).length,
  }))
}

/** Section 8 — required data, unioned from what the in-scope agents and harnesses actually need. */
export function requiredData(scope: PlaybookScope): PlaybookRequiredData[] {
  const agentIds = new Set(scope.agentIds)
  const harnessIds = new Set(scope.harnessIds)
  const initiativeIds = new Set(scope.initiativeIds)
  const qpIds = new Set(scope.qpIds)

  // Readiness comes from the initiatives in scope — one enterprise data estate,
  // so the same sources inherit the same average readiness signal.
  const initiatives = dataset.aiInitiatives.filter((i) => initiativeIds.has(i.id))
  const avgReadiness = initiatives.length === 0
    ? 70
    : Math.round(initiatives.reduce((s, i) => s + i.dataReadiness, 0) / initiatives.length)

  const entries = new Map<string, { purpose: string; sourceSystem: string }>()
  for (const agent of dataset.agents.filter((a) => agentIds.has(a.id))) {
    for (const source of agent.dataAccess) {
      entries.set(source, { purpose: `Read access for ${agent.digitalJobTitle}`, sourceSystem: agent.systemAccess[0] ?? 'Enterprise data platform' })
    }
  }
  for (const harness of dataset.harnesses.filter((h) => harnessIds.has(h.id))) {
    for (const source of harness.approvedKnowledgeSources) {
      if (!entries.has(source)) entries.set(source, { purpose: 'Approved knowledge source for retrieval and citation', sourceSystem: 'Knowledge repository' })
    }
  }
  for (const qp of dataset.qualityProcedures.filter((q) => qpIds.has(q.id))) {
    for (const input of qp.inputs) {
      if (!entries.has(input)) entries.set(input, { purpose: `Required input to ${qp.id}`, sourceSystem: 'Process system of record' })
    }
  }

  return [...entries.entries()].map(([name, meta], i) => {
    // Deterministic spread around the scope's readiness, so the table shows a
    // realistic mix of ready / preparing / gap rather than one flat number.
    const readinessPct = Math.max(10, Math.min(99, avgReadiness + ((i * 37) % 45) - 22))
    return {
      name,
      purpose: meta.purpose,
      sourceSystem: meta.sourceSystem,
      readinessPct,
      status: (readinessPct >= 75 ? 'Available' : readinessPct >= 45 ? 'Needs preparation' : 'Gap') as
        'Available' | 'Needs preparation' | 'Gap',
    }
  }).sort((a, b) => a.readinessPct - b.readinessPct)
}
