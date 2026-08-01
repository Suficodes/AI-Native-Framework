// Token economics ledger (Section 15) plus observability data (Section 16).
//
// The ledger is generated **bottom-up**, which is the whole point: the doc
// requires drill-down from enterprise to individual transaction, so every
// aggregate row must be the exact sum of its children. Agent-month totals are
// the atoms; they are split down into Harness -> Skill -> Model rows, and
// summed up into Process -> Department -> Division -> Enterprise rows.
//
// (The previous version drew every level independently from one 5K–8M range,
// so a Transaction row could exceed the Enterprise row and no rollup agreed
// with its parts. See PROJECT.md, Step 9.)
import type {
  Agent, AgentRunEvent, AlertRule, BudgetControl, Harness, HarnessBlockType, Incident,
  OrgNode, Process, ReusableSkill, Trace, TokenLevel, TokenUsageRecord,
} from '../types'
import { HARNESS_FLOW, TOKEN_PERIODS } from '../types'
import { nextAgentRunId, nextAlertRuleId, nextIncidentId, nextTokenUsageId, nextTraceId, nextTxId } from '../ids'
import { type Rng, bool, int, pick } from '../rng'

/**
 * Small/cheap models — the "small-model routing rate" KPI measures the share of
 * work sent here. Must stay in step with the models agents.seed.ts assigns.
 */
export const SMALL_MODELS = new Set(['SAP Joule', 'Azure OpenAI GPT-4o', 'Local Llama 3.1 70B'])

/** AED per million tokens, by model — every model agents.seed.ts can assign. */
const RATE_PER_M: Record<string, number> = {
  'Claude Sonnet 4.5': 42,
  'GPT-4.1': 38,
  'Gemini 2.5 Pro': 30,
  'Azure OpenAI GPT-4o': 14,
  'SAP Joule': 9,
  'Local Llama 3.1 70B': 5,
}
const rateFor = (model: string) => RATE_PER_M[model] ?? 30

// ─────────────────────────── Metric arithmetic ───────────────────────────

/** The additive part of a ledger row — everything that sums up the hierarchy. */
interface Metrics {
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningUnits: number
  retrievalCalls: number
  toolCalls: number
  retries: number
  retryTokens: number
  transactionCount: number
  successfulOutcomes: number
  cost: number
  value: number
}

const ZERO: Metrics = {
  inputTokens: 0, outputTokens: 0, cachedTokens: 0, reasoningUnits: 0, retrievalCalls: 0,
  toolCalls: 0, retries: 0, retryTokens: 0, transactionCount: 0, successfulOutcomes: 0, cost: 0, value: 0,
}

function add(a: Metrics, b: Metrics): Metrics {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
    reasoningUnits: a.reasoningUnits + b.reasoningUnits,
    retrievalCalls: a.retrievalCalls + b.retrievalCalls,
    toolCalls: a.toolCalls + b.toolCalls,
    retries: a.retries + b.retries,
    retryTokens: a.retryTokens + b.retryTokens,
    transactionCount: a.transactionCount + b.transactionCount,
    successfulOutcomes: a.successfulOutcomes + b.successfulOutcomes,
    cost: a.cost + b.cost,
    value: a.value + b.value,
  }
}

const sum = (parts: Metrics[]) => parts.reduce(add, ZERO)

/** Scale a metric block by `share`, rounding every field — used to split a parent across children. */
function scale(m: Metrics, share: number): Metrics {
  return {
    inputTokens: Math.round(m.inputTokens * share),
    outputTokens: Math.round(m.outputTokens * share),
    cachedTokens: Math.round(m.cachedTokens * share),
    reasoningUnits: Math.round(m.reasoningUnits * share),
    retrievalCalls: Math.round(m.retrievalCalls * share),
    toolCalls: Math.round(m.toolCalls * share),
    retries: Math.round(m.retries * share),
    retryTokens: Math.round(m.retryTokens * share),
    transactionCount: Math.round(m.transactionCount * share),
    successfulOutcomes: Math.round(m.successfulOutcomes * share),
    cost: Math.round(m.cost * share),
    value: Math.round(m.value * share),
  }
}

/**
 * Split `total` across `weights`, giving the remainder to the last slice so the
 * parts sum EXACTLY to the total after rounding. Without this the hierarchy
 * drifts by a few tokens per level and drill-down stops reconciling.
 */
function split(total: Metrics, weights: number[]): Metrics[] {
  const weightTotal = weights.reduce((s, w) => s + w, 0)
  const parts = weights.slice(0, -1).map((w) => scale(total, w / weightTotal))
  const consumed = sum(parts)
  const last: Metrics = {
    inputTokens: total.inputTokens - consumed.inputTokens,
    outputTokens: total.outputTokens - consumed.outputTokens,
    cachedTokens: total.cachedTokens - consumed.cachedTokens,
    reasoningUnits: total.reasoningUnits - consumed.reasoningUnits,
    retrievalCalls: total.retrievalCalls - consumed.retrievalCalls,
    toolCalls: total.toolCalls - consumed.toolCalls,
    retries: total.retries - consumed.retries,
    retryTokens: total.retryTokens - consumed.retryTokens,
    transactionCount: total.transactionCount - consumed.transactionCount,
    successfulOutcomes: total.successfulOutcomes - consumed.successfulOutcomes,
    cost: total.cost - consumed.cost,
    value: total.value - consumed.value,
  }
  return [...parts, last]
}

// ─────────────────────────── Row construction ───────────────────────────

interface RowOpts {
  level: TokenLevel
  parentId?: string
  refId: string
  refLabel: string
  period: string
  model: string
  latencyMs: number
  valueTag?: TokenUsageRecord['value']['tag']
}

function row(m: Metrics, opts: RowOpts): TokenUsageRecord {
  const successRate = m.transactionCount === 0 ? 1 : m.successfulOutcomes / m.transactionCount
  return {
    id: nextTokenUsageId(),
    level: opts.level, parentId: opts.parentId, refId: opts.refId, refLabel: opts.refLabel,
    period: opts.period,
    inputTokens: m.inputTokens, outputTokens: m.outputTokens, cachedTokens: m.cachedTokens,
    reasoningUnits: m.reasoningUnits, retrievalCalls: m.retrievalCalls, toolCalls: m.toolCalls,
    retries: m.retries, retryTokens: m.retryTokens,
    transactionCount: m.transactionCount, successfulOutcomes: m.successfulOutcomes,
    latencyMs: opts.latencyMs,
    model: opts.model,
    // For an aggregate row, "outcome" describes how the period went overall.
    outcome: successRate >= 0.95 ? 'Success' : successRate >= 0.8 ? 'Partial' : 'Failure',
    humanIntervention: m.transactionCount > m.successfulOutcomes,
    cost: m.cost,
    value: { value: m.value, tag: opts.valueTag ?? 'Estimated' },
  }
}

/** One agent's usage for one month, built from per-transaction characteristics. */
function agentMonthMetrics(rng: Rng, agent: Agent, monthIndex: number): Metrics {
  // Volume grows month over month as the programme scales — this is what makes
  // the "token trend over time" chart show a trend rather than noise.
  const growth = 1 + monthIndex * 0.12
  const transactionCount = Math.round(int(rng, 400, 5_200) * growth)
  const avgInput = int(rng, 1_800, 11_000)
  const avgOutput = Math.round(avgInput * (int(rng, 20, 55) / 100))
  const inputTokens = transactionCount * avgInput
  const outputTokens = transactionCount * avgOutput
  const cachedTokens = Math.round(inputTokens * (int(rng, 8, 42) / 100))
  const retries = Math.round(transactionCount * (int(rng, 1, 12) / 100))
  const retryTokens = retries * (avgInput + avgOutput)
  const successfulOutcomes = Math.round(transactionCount * (int(rng, 78, 98) / 100))
  // Cached input is billed at a fraction of the full rate.
  const billableTokens = inputTokens - cachedTokens * 0.85 + outputTokens + retryTokens
  const cost = Math.round((billableTokens / 1_000_000) * rateFor(agent.model))
  return {
    inputTokens, outputTokens, cachedTokens,
    reasoningUnits: Math.round(transactionCount * int(rng, 0, 900)),
    retrievalCalls: transactionCount * int(rng, 1, 6),
    toolCalls: transactionCount * int(rng, 1, 5),
    retries, retryTokens, transactionCount, successfulOutcomes,
    cost,
    value: Math.round(cost * (int(rng, 180, 620) / 100)),
  }
}

// ─────────────────────────── The ledger ───────────────────────────

export function buildTokenUsage(
  rng: Rng, orgNodes: OrgNode[], processes: Process[], agents: Agent[],
  harnesses: Harness[], skills: ReusableSkill[],
): TokenUsageRecord[] {
  const records: TokenUsageRecord[] = []
  const enterprise = orgNodes.find((n) => n.level === 'Enterprise')
  const divisions = orgNodes.filter((n) => n.level === 'Division')
  const sectionById = new Map(orgNodes.map((n) => [n.id, n]))

  /** Each agent's primary process — the one its token spend is attributed to. */
  const processForAgent = new Map<string, Process | undefined>()
  for (const agent of agents) {
    const owned = processes.find((p) => agent.assignedProcessIds.includes(p.id))
      ?? processes.find((p) => p.ownerSectionId === agent.orgAssignment.sectionId)
    processForAgent.set(agent.id, owned)
  }

  for (const [monthIndex, period] of TOKEN_PERIODS.entries()) {
    const isLatest = monthIndex === TOKEN_PERIODS.length - 1
    const agentTotals = new Map<string, Metrics>()
    // Agent rows are placed after their Process parent exists, so build the
    // metrics first, then emit rows top-down with real parent ids.
    for (const agent of agents) agentTotals.set(agent.id, agentMonthMetrics(rng, agent, monthIndex))

    const agentsByProcess = new Map<string, Agent[]>()
    const unattributed: Agent[] = []
    for (const agent of agents) {
      const process = processForAgent.get(agent.id)
      if (!process) { unattributed.push(agent); continue }
      agentsByProcess.set(process.id, [...(agentsByProcess.get(process.id) ?? []), agent])
    }

    // Roll up: process -> department -> division -> enterprise.
    const processTotals = new Map<string, Metrics>()
    for (const [processId, list] of agentsByProcess) {
      processTotals.set(processId, sum(list.map((a) => agentTotals.get(a.id)!)))
    }
    const deptTotals = new Map<string, Metrics>()
    const processesByDept = new Map<string, Process[]>()
    for (const [processId] of processTotals) {
      const process = processes.find((p) => p.id === processId)!
      const section = sectionById.get(process.ownerSectionId)
      const deptId = section?.parentId ?? process.divisionId
      processesByDept.set(deptId, [...(processesByDept.get(deptId) ?? []), process])
    }
    for (const [deptId, list] of processesByDept) {
      deptTotals.set(deptId, sum(list.map((p) => processTotals.get(p.id)!)))
    }
    const divisionTotals = new Map<string, Metrics>()
    const deptsByDivision = new Map<string, string[]>()
    for (const [deptId] of deptTotals) {
      const dept = sectionById.get(deptId)
      const divisionId = dept?.divisionId ?? deptId
      deptsByDivision.set(divisionId, [...(deptsByDivision.get(divisionId) ?? []), deptId])
    }
    for (const [divisionId, deptIds] of deptsByDivision) {
      divisionTotals.set(divisionId, sum(deptIds.map((d) => deptTotals.get(d)!)))
    }
    // Agents with no owning process still consume tokens — they are added to
    // the enterprise total so nothing is silently dropped from the top line.
    const enterpriseTotal = sum([...[...divisionTotals.values()], ...unattributed.map((a) => agentTotals.get(a.id)!)])

    const latency = () => int(rng, 400, 6000)

    const enterpriseRow = row(enterpriseTotal, {
      level: 'Enterprise', refId: enterprise?.id ?? 'ENT', refLabel: enterprise?.name ?? 'DEWA Enterprise',
      period, model: 'All models', latencyMs: latency(), valueTag: 'Observed',
    })
    records.push(enterpriseRow)

    for (const division of divisions) {
      const divTotal = divisionTotals.get(division.id)
      if (!divTotal) continue
      const divRow = row(divTotal, {
        level: 'Division', parentId: enterpriseRow.id, refId: division.id, refLabel: division.name,
        period, model: 'All models', latencyMs: latency(),
      })
      records.push(divRow)

      for (const deptId of deptsByDivision.get(division.id) ?? []) {
        const dept = sectionById.get(deptId)
        const deptRow = row(deptTotals.get(deptId)!, {
          level: 'Department', parentId: divRow.id, refId: deptId, refLabel: dept?.name ?? deptId,
          period, model: 'All models', latencyMs: latency(),
        })
        records.push(deptRow)

        for (const process of processesByDept.get(deptId) ?? []) {
          const procRow = row(processTotals.get(process.id)!, {
            level: 'Process', parentId: deptRow.id, refId: process.id, refLabel: process.name,
            period, model: 'All models', latencyMs: latency(),
          })
          records.push(procRow)

          for (const agent of agentsByProcess.get(process.id) ?? []) {
            records.push(...agentSubtree(rng, agent, agentTotals.get(agent.id)!, procRow.id, period, harnesses, skills, isLatest))
          }
        }
      }
    }
    for (const agent of unattributed) {
      records.push(...agentSubtree(rng, agent, agentTotals.get(agent.id)!, enterpriseRow.id, period, harnesses, skills, isLatest))
    }
  }

  return records
}

/** Agent -> Harness -> Skill -> Model (-> sampled Transactions), all splits summing exactly. */
function agentSubtree(
  rng: Rng, agent: Agent, total: Metrics, parentId: string, period: string,
  harnesses: Harness[], skills: ReusableSkill[], withTransactions: boolean,
): TokenUsageRecord[] {
  const out: TokenUsageRecord[] = []
  const agentRow = row(total, {
    level: 'Agent', parentId, refId: agent.id, refLabel: agent.name,
    period, model: agent.model, latencyMs: int(rng, 400, 6000), valueTag: 'Observed',
  })
  out.push(agentRow)

  const agentHarnesses = harnesses.filter((h) => h.assignedAgentId === agent.id || h.id === agent.harnessId)
  if (agentHarnesses.length === 0) return out

  const harnessParts = split(total, agentHarnesses.map(() => int(rng, 1, 5)))
  agentHarnesses.forEach((harness, hi) => {
    const harnessRow = row(harnessParts[hi], {
      level: 'Harness', parentId: agentRow.id, refId: harness.id, refLabel: harness.name,
      period, model: agent.model, latencyMs: int(rng, 400, 6000),
    })
    out.push(harnessRow)

    const harnessSkills = skills.filter((s) => s.usedByHarnessIds.includes(harness.id)).slice(0, 3)
    if (harnessSkills.length === 0) return
    const skillParts = split(harnessParts[hi], harnessSkills.map(() => int(rng, 1, 4)))

    harnessSkills.forEach((skill, si) => {
      const skillRow = row(skillParts[si], {
        level: 'Skill', parentId: harnessRow.id, refId: skill.id, refLabel: skill.name,
        period, model: agent.model, latencyMs: int(rng, 300, 5000),
      })
      out.push(skillRow)

      // A skill routes across the agent's primary model plus, sometimes, a
      // cheaper one — which is what the small-model routing KPI measures.
      const routed = bool(rng, 0.55)
        ? [agent.model, pick(rng, [...SMALL_MODELS])]
        : [agent.model]
      const modelParts = split(skillParts[si], routed.map((m) => (SMALL_MODELS.has(m) ? int(rng, 2, 6) : int(rng, 3, 9))))

      routed.forEach((model, mi) => {
        const modelRow = row(modelParts[mi], {
          level: 'Model', parentId: skillRow.id, refId: `${skill.id}:${model}`, refLabel: model,
          period, model, latencyMs: int(rng, 300, 5000),
        })
        out.push(modelRow)

        // Transaction rows are an explicit SAMPLE of individual calls for
        // drill-down, not the full population — see TokenUsageRecord's docs.
        if (!withTransactions || modelParts[mi].transactionCount === 0) return
        const sampleSize = Math.min(3, modelParts[mi].transactionCount)
        for (let t = 0; t < sampleSize; t++) {
          const perCall = scale(modelParts[mi], 1 / modelParts[mi].transactionCount)
          const succeeded = bool(rng, 0.85)
          out.push(row(
            { ...perCall, transactionCount: 1, successfulOutcomes: succeeded ? 1 : 0, retries: succeeded ? 0 : int(rng, 1, 3) },
            {
              level: 'Transaction', parentId: modelRow.id, refId: nextTxId(),
              refLabel: `${agent.name} — ${skill.name}`,
              period, model, latencyMs: int(rng, 200, 8000),
            },
          ))
        }
      })
    })
  })

  return out
}

/**
 * Budgets are DERIVED from each agent's recorded consumption, not drawn from an
 * independent range. Hand-picked 50k–300k budgets sat orders of magnitude above
 * what the token records produce, so every budget-utilization figure in the app
 * rounded to 0%.
 *
 * The ledger covers `TOKEN_PERIODS.length` months, so the annual budget is that
 * run-rate extrapolated to twelve months plus 15–45% headroom.
 */
export function buildBudgetControls(rng: Rng, agents: Agent[], tokenUsage: TokenUsageRecord[]): BudgetControl[] {
  const monthsCovered = TOKEN_PERIODS.length
  return agents.map((agent) => {
    const observed = tokenUsage.filter((t) => t.level === 'Agent' && t.refId === agent.id)
    const spend = observed.reduce((s, t) => s + t.cost, 0)
    const transactions = observed.reduce((s, t) => s + t.transactionCount, 0)
    const annualBudget = Math.max(5_000, Math.round((spend / monthsCovered) * 12 * (int(rng, 115, 145) / 100)))
    const avgTransactionCost = transactions === 0 ? 1 : spend / transactions
    return {
      agentId: agent.id,
      annualBudget,
      monthlyBudget: Math.round(annualBudget / 12),
      // A per-call ceiling a few times the observed average — high enough not to
      // trip on normal work, low enough to catch a runaway call.
      perTransactionLimit: Math.max(1, Math.round(avgTransactionCost * (int(rng, 250, 500) / 100))),
      retryLimit: int(rng, 1, 3),
      approvedModels: [agent.model, ...(bool(rng, 0.5) ? [pick(rng, [...SMALL_MODELS])] : [])],
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
