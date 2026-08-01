// Token economics hierarchy (Enterprise -> Division -> Department -> Process
// -> Agent -> Harness -> Skill -> Model -> Transaction) plus observability
// data: agent runs, traces (including the worked D2D BRD trace example,
// reproduced verbatim from Section 16 of the requirements doc), incidents,
// and alert rules.
import type { Agent, AgentRunEvent, AlertRule, BudgetControl, Harness, HarnessBlockType, Incident, OrgNode, Process, Trace, TokenUsageRecord } from '../types'
import { HARNESS_FLOW } from '../types'
import { nextAgentRunId, nextAlertRuleId, nextIncidentId, nextTokenUsageId, nextTraceId, nextTxId } from '../ids'
import { type Rng, bool, int, pick } from '../rng'

const MODELS = ['Claude Sonnet 4.5', 'GPT-4.1', 'Gemini 2.5 Pro', 'SAP Joule', 'Azure OpenAI GPT-4o']

function makeUsage(rng: Rng, opts: { level: TokenUsageRecord['level']; parentId?: string; refId: string; refLabel: string; model?: string }): TokenUsageRecord {
  const inputTokens = int(rng, 5_000, 8_000_000)
  const outputTokens = Math.round(inputTokens * (int(rng, 15, 45) / 100))
  const cost = Math.round((inputTokens + outputTokens) / 1_000_000 * int(rng, 8, 40))
  return {
    id: nextTokenUsageId(), level: opts.level, parentId: opts.parentId, refId: opts.refId, refLabel: opts.refLabel,
    period: 'Q3-2026', inputTokens, outputTokens,
    cachedTokens: Math.round(inputTokens * (int(rng, 5, 30) / 100)),
    reasoningUnits: int(rng, 0, 50_000), retrievalCalls: int(rng, 0, 2000), toolCalls: int(rng, 0, 1500),
    retries: int(rng, 0, 80), latencyMs: int(rng, 400, 6000),
    model: opts.model ?? pick(rng, MODELS), outcome: pick(rng, ['Success', 'Success', 'Success', 'Partial', 'Failure']),
    humanIntervention: bool(rng, 0.25), cost,
    value: { value: Math.round(cost * (int(rng, 150, 500) / 100)), tag: pick(rng, ['Estimated', 'Observed', 'Validated']) },
  }
}

export function buildTokenUsage(rng: Rng, orgNodes: OrgNode[], processes: Process[], agents: Agent[], harnesses: Harness[]): TokenUsageRecord[] {
  const records: TokenUsageRecord[] = []
  const enterprise = makeUsage(rng, { level: 'Enterprise', refId: 'ENT-00', refLabel: 'DEWA Enterprise' })
  records.push(enterprise)

  const divisions = orgNodes.filter((n) => n.level === 'Division')
  for (const div of divisions) {
    const divRec = makeUsage(rng, { level: 'Division', parentId: enterprise.id, refId: div.id, refLabel: div.name })
    records.push(divRec)
    const depts = orgNodes.filter((n) => n.level === 'Department' && n.divisionId === div.id)
    for (const dpt of depts) {
      records.push(makeUsage(rng, { level: 'Department', parentId: divRec.id, refId: dpt.id, refLabel: dpt.name }))
    }
  }

  for (const process of processes) {
    records.push(makeUsage(rng, { level: 'Process', refId: process.id, refLabel: process.name }))
  }

  const agentRecords = agents.map((agent) => {
    const rec = makeUsage(rng, { level: 'Agent', refId: agent.id, refLabel: agent.name, model: agent.model })
    records.push(rec)
    return rec
  })

  harnesses.forEach((harness, i) => {
    const parent = agentRecords.find((r) => r.refId === harness.assignedAgentId)
    records.push(makeUsage(rng, { level: 'Harness', parentId: parent?.id, refId: harness.id, refLabel: harness.name }))
    if (i < 6) {
      records.push(makeUsage(rng, { level: 'Skill', parentId: parent?.id, refId: `${harness.id}-SKILL`, refLabel: `${harness.name} — primary skill` }))
    }
  })

  for (const model of MODELS) {
    records.push(makeUsage(rng, { level: 'Model', refId: model, refLabel: model, model }))
  }

  // Transaction-level: a sample of individual calls, weighted toward the D2D
  // BRD harness so the worked example has real drill-down data.
  for (let i = 0; i < 40; i++) {
    const useD2D = i < 12
    const agent = useD2D ? agents[0] : pick(rng, agents)
    records.push(makeUsage(rng, {
      level: 'Transaction',
      refId: nextTxId(),
      refLabel: `${agent.name} — transaction`,
      model: agent.model,
    }))
  }

  return records
}

/**
 * Budgets are DERIVED from each agent's recorded consumption, not drawn from an
 * independent range. Hand-picked 50k–300k budgets sat two orders of magnitude
 * above the cost the token records actually produce (cost is realistic
 * per-million-token pricing), so every budget-utilization figure in the app
 * rounded to 0% — a defect the AI Playbook's token-budget section surfaced by
 * putting the two side by side for the first time.
 *
 * Records cover one quarter (`period: 'Q3-2026'`), so the annual budget is four
 * quarters of observed spend plus 25–80% headroom.
 */
export function buildBudgetControls(rng: Rng, agents: Agent[], tokenUsage: TokenUsageRecord[]): BudgetControl[] {
  return agents.map((agent) => {
    const quarterCost = tokenUsage
      .filter((t) => t.level === 'Agent' && t.refId === agent.id)
      .reduce((sum, t) => sum + t.cost, 0)
    const annualBudget = Math.max(1200, Math.round(quarterCost * 4 * (int(rng, 125, 180) / 100)))
    return {
      agentId: agent.id,
      annualBudget,
      monthlyBudget: Math.round(annualBudget / 12),
      perTransactionLimit: int(rng, 1, 20),
      retryLimit: int(rng, 1, 3),
      approvedModels: [agent.model],
      alertLevelPct: 80,
      suspensionThresholdPct: 100,
    }
  })
}

// The worked trace example (Section 16 of the requirements doc), reproduced
// verbatim: Demand submitted -> Classification agent triggered -> D2D data
// retrieved -> Knowledge searched -> Duplicate identified -> Stakeholders
// recommended -> BRD drafted -> Evaluation passed -> Human review requested
// -> Output edited -> Approved -> D2D updated -> VR ledger updated.
const WORKED_TRACE_STEPS: Array<{ label: string; step: HarnessBlockType; actor: string }> = [
  { label: 'Demand submitted', step: 'Trigger', actor: 'Human' },
  { label: 'Classification agent triggered', step: 'Trigger', actor: 'Agent' },
  { label: 'D2D data retrieved', step: 'ContextRetrieval', actor: 'Agent' },
  { label: 'Knowledge searched', step: 'ContextRetrieval', actor: 'Agent' },
  { label: 'Duplicate identified', step: 'Validation', actor: 'Agent' },
  { label: 'Stakeholders recommended', step: 'Reasoning', actor: 'Agent' },
  { label: 'BRD drafted', step: 'OutputGeneration', actor: 'Agent' },
  { label: 'Evaluation passed', step: 'QualityEvaluation', actor: 'Agent' },
  { label: 'Human review requested', step: 'HumanApproval', actor: 'Agent' },
  { label: 'Output edited', step: 'HumanApproval', actor: 'Human' },
  { label: 'Approved', step: 'HumanApproval', actor: 'HumanApproval' },
  { label: 'D2D updated', step: 'CommitToSystem', actor: 'Agent' },
  { label: 'VR ledger updated', step: 'ValueUpdate', actor: 'Agent' },
]

export function buildObservability(rng: Rng, agents: Agent[], harnesses: Harness[]): { agentRuns: AgentRunEvent[]; traces: Trace[]; incidents: Incident[]; alertRules: AlertRule[] } {
  const agentRuns: AgentRunEvent[] = []
  const traces: Trace[] = []

  // Worked example trace.
  const workedTraceId = 'TRACE-001'
  const workedSteps: AgentRunEvent[] = WORKED_TRACE_STEPS.map((s, i) => {
    const ev: AgentRunEvent = {
      id: nextAgentRunId(), agentId: 'AGT-D2D-DOC-01', harnessId: 'HAR-D2D-BRD-01', traceId: workedTraceId,
      timestamp: `2026-07-28T${String(9 + Math.floor(i / 3)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
      step: s.step, status: 'Success', latencyMs: int(rng, 200, 3000), details: s.label,
    }
    agentRuns.push(ev)
    return ev
  })
  traces.push({ id: workedTraceId, demandId: 'DEM-2026-0001', agentId: 'AGT-D2D-DOC-01', steps: workedSteps, outcome: 'Success' })

  // Additional synthetic traces across other agents.
  for (let t = 0; t < 24; t++) {
    const agent = pick(rng, agents)
    const harness = harnesses.find((h) => h.assignedAgentId === agent.id) ?? pick(rng, harnesses)
    const traceId = nextTraceId()
    const stepCount = int(rng, 4, HARNESS_FLOW.length)
    const steps: AgentRunEvent[] = []
    for (let i = 0; i < stepCount; i++) {
      const status = i === stepCount - 1 && bool(rng, 0.15) ? pick(rng, ['Failure', 'Escalated'] as const) : 'Success'
      const ev: AgentRunEvent = {
        id: nextAgentRunId(), agentId: agent.id, harnessId: harness.id, traceId,
        timestamp: new Date(Date.UTC(2026, 6, int(rng, 1, 30), int(rng, 6, 20), int(rng, 0, 59))).toISOString(),
        step: HARNESS_FLOW[i].type, status, latencyMs: int(rng, 150, 5000), details: HARNESS_FLOW[i].label,
      }
      steps.push(ev)
      agentRuns.push(ev)
    }
    const last = steps[steps.length - 1]
    traces.push({ id: traceId, agentId: agent.id, steps, outcome: last.status === 'Success' ? 'Success' : last.status === 'Escalated' ? 'HumanOverride' : 'Failure' })
  }

  const incidents: Incident[] = Array.from({ length: 6 }, () => {
    const agent = pick(rng, agents)
    return {
      id: nextIncidentId(),
      title: pick(rng, ['Elevated retry rate', 'Guardrail triggered repeatedly', 'Tool-call failure spike', 'Token budget overrun', 'Evaluation score regression', 'Unexpected escalation volume']),
      severity: pick(rng, ['Low', 'Medium', 'High', 'Critical']),
      agentId: agent.id, openedAt: `2026-07-${String(int(rng, 1, 30)).padStart(2, '0')}`,
      status: pick(rng, ['Open', 'Investigating', 'Resolved', 'Resolved']),
    }
  })

  const alertRules: AlertRule[] = [
    { id: nextAlertRuleId(), name: 'High retry rate', metric: 'retry_rate_pct', threshold: 15, comparator: '>', severity: 'Warning' },
    { id: nextAlertRuleId(), name: 'Token budget overrun', metric: 'monthly_budget_pct', threshold: 100, comparator: '>=', severity: 'Critical' },
    { id: nextAlertRuleId(), name: 'Latency degradation', metric: 'avg_latency_ms', threshold: 4000, comparator: '>', severity: 'Warning' },
    { id: nextAlertRuleId(), name: 'Evaluation score drop', metric: 'evaluation_score_pct', threshold: 80, comparator: '<', severity: 'Critical' },
    { id: nextAlertRuleId(), name: 'Human override spike', metric: 'human_override_pct', threshold: 30, comparator: '>', severity: 'Warning' },
  ]

  return { agentRuns, traces, incidents, alertRules }
}
