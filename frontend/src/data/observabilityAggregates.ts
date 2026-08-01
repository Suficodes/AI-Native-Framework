// Observability aggregates (requirements doc Section 16) — the AI Operations
// and Harness Observability view. Everything is derived from the agent-run
// event stream, which is the single source of truth: a KPI tile, a time-series
// point and a log row are three renderings of the same events.
import { dataset } from './mockApi'
import type { AgentRunEvent, Harness, ID, RunSignal, Trace } from './types'

const round1 = (n: number) => Math.round(n * 10) / 10
const avg = (nums: number[]) => (nums.length === 0 ? 0 : nums.reduce((s, n) => s + n, 0) / nums.length)

const countRuns = (predicate: (r: AgentRunEvent) => boolean) => dataset.agentRuns.filter(predicate).length
const countSignal = (signal: RunSignal) => countRuns((r) => r.signal === signal)

// ─────────────────────────── The 13 Section 16 counters ───────────────────────────

export function observabilityKpis() {
  const runs = dataset.agentRuns
  const traces = dataset.traces
  const completedRuns = runs.filter((r) => r.status !== 'Running')
  const failedRuns = completedRuns.filter((r) => r.status === 'Failure').length

  return {
    activeAgentRuns: traces.filter((t) => t.outcome === 'InProgress').length,
    successfulRuns: traces.filter((t) => t.outcome === 'Success').length,
    failedRuns: traces.filter((t) => t.outcome === 'Failure').length,
    humanOverrides: traces.filter((t) => t.outcome === 'HumanOverride').length,
    averageLatencyMs: Math.round(avg(runs.map((r) => r.latencyMs))),
    toolCallFailures: countRuns((r) => r.step === 'ToolCall' && r.status === 'Failure'),
    retrievalFailures: countRuns((r) => r.step === 'ContextRetrieval' && r.status === 'Failure'),
    guardrailTriggers: countSignal('GuardrailTriggered'),
    humanEscalations: countRuns((r) => r.status === 'Escalated'),
    qualityEvaluationFailures: countRuns((r) => r.step === 'QualityEvaluation' && r.status === 'Failure'),
    securityEvents: countSignal('SecurityEvent'),
    tokenAnomalies: countSignal('TokenAnomaly'),
    costAnomalies: countSignal('CostAnomaly'),
    // Availability is measured the way an operator would read it: the share of
    // completed run steps that did not fail, across the whole fleet.
    agentAvailabilityPct: completedRuns.length === 0
      ? 100
      : round1(((completedRuns.length - failedRuns) / completedRuns.length) * 100),
    totalRuns: runs.length,
    retries: countRuns((r) => r.status === 'Retry'),
  }
}

// ─────────────────────────── Time series ───────────────────────────

const dayOf = (iso: string) => iso.slice(0, 10)

/** Runs per day, split by outcome — the primary ops time-series. */
export function runsByDay() {
  const byDay = new Map<string, { day: string; success: number; failure: number; retry: number; escalated: number }>()
  for (const run of dataset.agentRuns) {
    if (run.status === 'Running') continue
    const day = dayOf(run.timestamp)
    const entry = byDay.get(day) ?? { day, success: 0, failure: 0, retry: 0, escalated: 0 }
    if (run.status === 'Success') entry.success++
    else if (run.status === 'Failure') entry.failure++
    else if (run.status === 'Retry') entry.retry++
    else entry.escalated++
    byDay.set(day, entry)
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
}

/** Average and worst-case latency per day — a p95 stand-in an operator can act on. */
export function latencyByDay() {
  const byDay = new Map<string, number[]>()
  for (const run of dataset.agentRuns) {
    const day = dayOf(run.timestamp)
    byDay.set(day, [...(byDay.get(day) ?? []), run.latencyMs])
  }
  return [...byDay.entries()]
    .map(([day, values]) => ({
      day,
      average: Math.round(avg(values)),
      peak: Math.max(...values),
    }))
    .sort((a, b) => a.day.localeCompare(b.day))
}

/** Signals per day — guardrails, security events and anomalies over time. */
export function signalsByDay() {
  const byDay = new Map<string, { day: string; guardrail: number; security: number; anomaly: number }>()
  for (const run of dataset.agentRuns) {
    if (!run.signal) continue
    const day = dayOf(run.timestamp)
    const entry = byDay.get(day) ?? { day, guardrail: 0, security: 0, anomaly: 0 }
    if (run.signal === 'GuardrailTriggered') entry.guardrail++
    else if (run.signal === 'SecurityEvent') entry.security++
    else entry.anomaly++
    byDay.set(day, entry)
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
}

// ─────────────────────────── Logs ───────────────────────────

export interface LogRow extends AgentRunEvent {
  agentName: string
  harnessName: string
}

function withNames(runs: AgentRunEvent[]): LogRow[] {
  return runs
    .map((run) => ({
      ...run,
      agentName: dataset.agents.find((a) => a.id === run.agentId)?.name ?? run.agentId,
      harnessName: dataset.harnesses.find((h) => h.id === run.harnessId)?.name ?? run.harnessId,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export const toolCallLog = () => withNames(dataset.agentRuns.filter((r) => r.step === 'ToolCall'))
export const evaluationLog = () => withNames(dataset.agentRuns.filter((r) => r.step === 'QualityEvaluation'))
export const humanApprovalLog = () => withNames(dataset.agentRuns.filter((r) => r.step === 'HumanApproval'))
export const signalLog = () => withNames(dataset.agentRuns.filter((r) => r.signal != null))

// ─────────────────────────── Traces ───────────────────────────

export interface TraceRow extends Trace {
  agentName: string
  startedAt: string
  durationMs: number
  stepCount: number
  failedSteps: number
}

export function traceRows(): TraceRow[] {
  return dataset.traces
    .map((trace) => {
      const times = trace.steps.map((s) => new Date(s.timestamp).getTime())
      return {
        ...trace,
        agentName: dataset.agents.find((a) => a.id === trace.agentId)?.name ?? trace.agentId,
        startedAt: trace.steps[0]?.timestamp ?? '',
        // Wall-clock span of the trace, not the sum of step latencies.
        durationMs: times.length > 1 ? Math.max(...times) - Math.min(...times) : trace.steps[0]?.latencyMs ?? 0,
        stepCount: trace.steps.length,
        failedSteps: trace.steps.filter((s) => s.status === 'Failure').length,
      }
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

export function traceById(traceId: ID): TraceRow | undefined {
  return traceRows().find((t) => t.id === traceId)
}

// ─────────────────────────── Incidents, alerts, harness versions ───────────────────────────

export function incidentRows() {
  return dataset.incidents
    .map((incident) => ({
      ...incident,
      agentName: incident.agentId
        ? dataset.agents.find((a) => a.id === incident.agentId)?.name ?? incident.agentId
        : 'Unassigned',
    }))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
}

/**
 * Harness-version comparison. Each harness's current release against its
 * previous one, with the evaluation-suite average — the question a release
 * decision actually turns on is "did the last version make quality better".
 */
export function harnessVersionComparison() {
  return dataset.harnesses.map((harness: Harness) => {
    const history = [...harness.releaseHistory].sort((a, b) => a.date.localeCompare(b.date))
    const current = history[history.length - 1]
    const previous = history[history.length - 2]
    const evalAverage = round1(avg(harness.evaluationSuite.map((e) => e.scorePct)))
    const weakest = [...harness.evaluationSuite].sort((a, b) => a.scorePct - b.scorePct)[0]
    const runs = dataset.agentRuns.filter((r) => r.harnessId === harness.id)
    const failures = runs.filter((r) => r.status === 'Failure').length

    return {
      harnessId: harness.id,
      name: harness.name,
      version: harness.version,
      status: harness.status,
      evalAverage,
      weakestCriterion: weakest ? `${weakest.criterion} (${weakest.scorePct}%)` : '—',
      guardrails: harness.guardrails.length,
      humanApprovalPoints: harness.humanApprovalPoints.length,
      releases: history.length,
      currentRelease: current ? `${current.version} · ${current.date}` : '—',
      previousRelease: previous ? `${previous.version} · ${previous.date}` : 'First release',
      latestNotes: current?.notes ?? '—',
      observedRuns: runs.length,
      observedFailureRatePct: runs.length === 0 ? 0 : round1((failures / runs.length) * 100),
      killSwitchEnabled: harness.killSwitchEnabled,
    }
  }).sort((a, b) => b.observedRuns - a.observedRuns)
}

/** Agents ranked by observed failure rate — where an operator looks first. */
export function agentHealth() {
  return dataset.agents.map((agent) => {
    const runs = dataset.agentRuns.filter((r) => r.agentId === agent.id && r.status !== 'Running')
    const failures = runs.filter((r) => r.status === 'Failure').length
    const escalations = runs.filter((r) => r.status === 'Escalated').length
    return {
      agentId: agent.id,
      agent: agent.name,
      status: agent.status,
      runs: runs.length,
      failures,
      escalations,
      availabilityPct: runs.length === 0 ? 100 : round1(((runs.length - failures) / runs.length) * 100),
      avgLatencyMs: Math.round(avg(runs.map((r) => r.latencyMs))),
      openIncidents: dataset.incidents.filter((i) => i.agentId === agent.id && i.status !== 'Resolved').length,
    }
  }).sort((a, b) => a.availabilityPct - b.availabilityPct)
}
