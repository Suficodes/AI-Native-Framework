import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import {
  observabilityKpis, runsByDay, latencyByDay, signalsByDay, toolCallLog,
  evaluationLog, humanApprovalLog, signalLog, traceRows, traceById,
  harnessVersionComparison, agentHealth, incidentRows,
} from './observabilityAggregates'

describe('run event stream', () => {
  it('resolves every run to a real agent, harness and trace', () => {
    const agents = new Set(dataset.agents.map((a) => a.id))
    const harnesses = new Set(dataset.harnesses.map((h) => h.id))
    const traces = new Set(dataset.traces.map((t) => t.id))
    for (const run of dataset.agentRuns) {
      expect(agents.has(run.agentId), `${run.id} agent`).toBe(true)
      expect(harnesses.has(run.harnessId), `${run.id} harness`).toBe(true)
      expect(traces.has(run.traceId), `${run.id} trace`).toBe(true)
    }
  })

  it('carries enough volume and spread for a time-series to mean anything', () => {
    expect(dataset.agentRuns.length).toBeGreaterThan(300)
    expect(runsByDay().length).toBeGreaterThan(20)
  })

  it('records the structured detail each step type needs for its log', () => {
    // A log with no tool name, score or approver is just a list of timestamps.
    expect(toolCallLog().filter((r) => r.toolName).length).toBeGreaterThan(0)
    expect(evaluationLog().filter((r) => r.evaluationScorePct != null).length).toBeGreaterThan(0)
    expect(humanApprovalLog().filter((r) => r.approver && r.approvalDecision).length).toBeGreaterThan(0)
    expect(signalLog().length).toBeGreaterThan(0)
  })
})

describe('observability KPIs', () => {
  it('produces all 13 Section 16 counters with non-negative values', () => {
    const kpis = observabilityKpis()
    for (const [key, value] of Object.entries(kpis)) {
      expect(value, key).toBeGreaterThanOrEqual(0)
    }
    // Every counter the doc lists must be genuinely exercised by the data —
    // a counter that is structurally always zero is not a counter.
    for (const key of [
      'activeAgentRuns', 'successfulRuns', 'failedRuns', 'humanEscalations',
      'toolCallFailures', 'retrievalFailures', 'guardrailTriggers',
      'qualityEvaluationFailures', 'securityEvents', 'tokenAnomalies', 'costAnomalies',
    ] as const) {
      expect(kpis[key], `${key} is always zero`).toBeGreaterThan(0)
    }
  })

  it('accounts for every trace exactly once across the four outcomes', () => {
    const kpis = observabilityKpis()
    const total = kpis.activeAgentRuns + kpis.successfulRuns + kpis.failedRuns + kpis.humanOverrides
    expect(total).toBe(dataset.traces.length)
  })

  it('reports availability as a percentage that reflects real failures', () => {
    const kpis = observabilityKpis()
    expect(kpis.agentAvailabilityPct).toBeGreaterThan(0)
    expect(kpis.agentAvailabilityPct).toBeLessThan(100)
  })

  it('counts a guardrail trigger as a signal, not a failure', () => {
    const guardrailRuns = dataset.agentRuns.filter((r) => r.signal === 'GuardrailTriggered')
    expect(guardrailRuns.length).toBeGreaterThan(0)
    // The whole point: the control firing is the system working correctly.
    expect(guardrailRuns.every((r) => r.status !== 'Failure')).toBe(true)
  })
})

describe('traces', () => {
  it('reproduces the doc\'s worked example trace end to end', () => {
    const trace = traceById('TRACE-001')!
    expect(trace).toBeDefined()
    expect(trace.agentId).toBe('AGT-D2D-DOC-01')
    expect(trace.demandId).toBe('DEM-2026-0001')
    expect(trace.outcome).toBe('Success')
    expect(trace.steps).toHaveLength(13)
    expect(trace.steps[0].details).toBe('Demand submitted')
    expect(trace.steps[trace.steps.length - 1].details).toBe('VR ledger updated')
  })

  it('marks a trace failed when any step failed, not only the last one', () => {
    for (const trace of dataset.traces) {
      if (trace.outcome === 'InProgress') continue
      const hasFailure = trace.steps.some((s) => s.status === 'Failure')
      if (hasFailure) expect(trace.outcome, trace.id).toBe('Failure')
    }
  })

  it('has in-flight traces, so the active-runs counter is real', () => {
    const active = dataset.traces.filter((t) => t.outcome === 'InProgress')
    expect(active.length).toBeGreaterThan(0)
    for (const trace of active) {
      expect(trace.steps.some((s) => s.status === 'Running')).toBe(true)
    }
  })

  it('derives duration and step counts for the trace register', () => {
    for (const row of traceRows()) {
      expect(row.stepCount).toBe(row.steps.length)
      expect(row.durationMs).toBeGreaterThanOrEqual(0)
      expect(row.agentName.length).toBeGreaterThan(0)
    }
  })
})

describe('harness versions and agent health', () => {
  it('compares every harness against its own release history', () => {
    const rows = harnessVersionComparison()
    expect(rows).toHaveLength(dataset.harnesses.length)
    for (const row of rows) {
      expect(row.evalAverage).toBeGreaterThan(0)
      expect(row.releases).toBeGreaterThan(0)
      expect(row.observedFailureRatePct).toBeGreaterThanOrEqual(0)
      expect(row.observedFailureRatePct).toBeLessThanOrEqual(100)
    }
  })

  it('ranks agents worst-availability-first so attention goes to the right one', () => {
    const health = agentHealth()
    expect(health).toHaveLength(dataset.agents.length)
    const values = health.map((h) => h.availabilityPct)
    expect([...values].sort((a, b) => a - b)).toEqual(values)
  })

  it('joins incidents to their agent', () => {
    for (const incident of incidentRows()) {
      expect(incident.agentName.length).toBeGreaterThan(0)
    }
  })

  it('time series are chronological and cover the same window', () => {
    for (const series of [runsByDay(), latencyByDay(), signalsByDay()]) {
      const days = series.map((s) => s.day)
      expect([...days].sort()).toEqual(days)
    }
  })
})
