// Observability module (requirements doc Section 16) — "an AI Operations and
// Harness Observability interface similar to an enterprise Grafana experience,
// while remaining integrated into the prototype".
//
// Four views over one run-event stream: live operations, traces, logs, and
// harness versions. Incidents and alert rules sit under operations because
// that is where an operator looks when a counter goes red.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getAgentRuns } from '../../data/mockApi'
import {
  observabilityKpis, runsByDay, latencyByDay, signalsByDay, agentHealth,
  toolCallLog, evaluationLog, humanApprovalLog, signalLog, traceRows,
  incidentRows, harnessVersionComparison,
} from '../../data/observabilityAggregates.ts'
import { dataset } from '../../data/mockApi'
import { KpiCard } from '../../components/KpiCard.jsx'
import { RunsOverTimeChart, LatencyChart, SignalsChart, AgentAvailabilityChart } from './ObservabilityCharts.jsx'
import { ToolCallLog, EvaluationLog, HumanApprovalLog, SignalLog } from './ObservabilityLogs.jsx'
import { TraceTable } from './TraceTable.jsx'
import { HarnessVersionTable } from './HarnessVersionTable.jsx'

const SEVERITY_VARIANT = { Low: 'neutral', Medium: 'info', High: 'warning', Critical: 'error' }
const INCIDENT_STATUS_VARIANT = { Open: 'error', Investigating: 'warning', Resolved: 'success' }

function IncidentsAndAlerts() {
  const incidents = incidentRows()
  const incidentColumns = [
    { key: 'title', header: 'Incident', width: proportional(2.2, { minWidth: 220 }), renderCell: (row) => <Text size="sm" weight="medium">{row.title}</Text> },
    { key: 'agentName', header: 'Agent', width: proportional(1.6, { minWidth: 170 }), renderCell: (row) => <Text size="sm" color="secondary">{row.agentName}</Text> },
    { key: 'severity', header: 'Severity', width: pixel(110), renderCell: (row) => <Badge label={row.severity} variant={SEVERITY_VARIANT[row.severity]} /> },
    { key: 'status', header: 'Status', width: pixel(130), renderCell: (row) => <Badge label={row.status} variant={INCIDENT_STATUS_VARIANT[row.status]} /> },
    { key: 'openedAt', header: 'Opened', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{row.openedAt}</Text> },
  ]
  const alertColumns = [
    { key: 'name', header: 'Alert rule', width: proportional(2, { minWidth: 200 }), renderCell: (row) => <Text size="sm" weight="medium">{row.name}</Text> },
    { key: 'metric', header: 'Metric', width: proportional(1.6, { minWidth: 170 }), renderCell: (row) => <Text size="sm" color="secondary" className="mono">{row.metric}</Text> },
    { key: 'threshold', header: 'Condition', width: pixel(120), renderCell: (row) => <Text size="sm" className="mono">{row.comparator} {row.threshold}</Text> },
    { key: 'severity', header: 'Severity', width: pixel(110), renderCell: (row) => <Badge label={row.severity} variant={row.severity === 'Critical' ? 'error' : 'warning'} /> },
  ]
  return (
    <div className="auto-grid" style={{ '--min': '420px' }}>
      <div>
        <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Incidents</Heading>
        <Card padding={0}>
          <div style={{ overflowX: 'auto' }}>
            <Table data={incidents} columns={incidentColumns} idKey="id" hasHover density="compact" />
          </div>
        </Card>
      </div>
      <div>
        <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Alert rules</Heading>
        <Card padding={0}>
          <div style={{ overflowX: 'auto' }}>
            <Table data={dataset.alertRules} columns={alertColumns} idKey="id" hasHover density="compact" />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function Observability() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('operations')
  useEffect(() => { getAgentRuns().then(() => setLoaded(true)) }, [])

  if (!loaded) return <div className="page-band page-band--wide"><Skeleton height={560} radius={2} /></div>

  const kpis = observabilityKpis()

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Observability</Heading>
        <Text color="secondary" size="lg">
          AI operations and harness observability — every agent run, tool call, evaluation and approval, traceable end to end.
        </Text>
      </div>

      <HStack gap={3} align="center" style={{ flexWrap: 'wrap', marginBottom: 'var(--spacing-5)' }}>
        <SegmentedControl value={view} onChange={setView} label="View">
          <SegmentedControlItem value="operations" label="Operations" />
          <SegmentedControlItem value="traces" label="Traces" />
          <SegmentedControlItem value="logs" label="Logs" />
          <SegmentedControlItem value="harnesses" label="Harness versions" />
        </SegmentedControl>
        <Badge label={`${kpis.activeAgentRuns} active now`} variant={kpis.activeAgentRuns > 0 ? 'info' : 'neutral'} />
      </HStack>

      {view === 'operations' && (
        <VStack gap={6}>
          <div className="auto-grid" style={{ '--min': '200px' }}>
            <KpiCard label="Active agent runs" value={kpis.activeAgentRuns} tag="Observed" definition="Traces currently in flight — at least one step still running." period="Live" />
            <KpiCard label="Successful runs" value={kpis.successfulRuns} tag="Observed" definition="Traces that completed with no failed step." period="Last 30 days" />
            <KpiCard label="Failed runs" value={kpis.failedRuns} tag="Observed" definition="Traces where at least one step failed." period="Last 30 days" />
            <KpiCard label="Human escalations" value={kpis.humanEscalations} tag="Observed" definition="Run steps escalated to a named human role." period="Last 30 days" />
            <KpiCard label="Average latency" value={kpis.averageLatencyMs} suffix=" ms" tag="Observed" definition="Mean step latency across every recorded run." period="Last 30 days" />
            <KpiCard label="Agent availability" value={kpis.agentAvailabilityPct} suffix="%" tag="Observed" definition="Share of completed run steps that did not fail." period="Last 30 days" />
            <KpiCard label="Tool-call failures" value={kpis.toolCallFailures} tag="Observed" definition="Tool invocations that returned an error." period="Last 30 days" />
            <KpiCard label="Retrieval failures" value={kpis.retrievalFailures} tag="Observed" definition="Context-retrieval steps that failed to return approved sources." period="Last 30 days" />
            <KpiCard label="Quality-evaluation failures" value={kpis.qualityEvaluationFailures} tag="Observed" definition="Runs whose output scored below the harness quality gate." period="Last 30 days" />
            <KpiCard label="Guardrail triggers" value={kpis.guardrailTriggers} tag="Observed" definition="Times a guardrail stopped or altered agent output. A trigger is the control working, not a failure." period="Last 30 days" />
            <KpiCard label="Security events" value={kpis.securityEvents} tag="Verified" definition="Access denials, prompt-injection detections, and blocked classified content." period="Last 30 days" />
            <KpiCard label="Token anomalies" value={kpis.tokenAnomalies} tag="Observed" definition="Runs whose context consumption departed sharply from the rolling median." period="Last 30 days" />
            <KpiCard label="Cost anomalies" value={kpis.costAnomalies} tag="Observed" definition="Runs that breached the per-transaction cost limit." period="Last 30 days" />
            <KpiCard label="Retries" value={kpis.retries} tag="Observed" definition="Retried run steps. A retry that will not succeed is pure cost." period="Last 30 days" />
          </div>

          <div className="auto-grid" style={{ '--min': '420px' }}>
            <RunsOverTimeChart data={runsByDay()} />
            <LatencyChart data={latencyByDay()} />
            <SignalsChart data={signalsByDay()} />
            <AgentAvailabilityChart data={agentHealth()} />
          </div>

          <IncidentsAndAlerts />
        </VStack>
      )}

      {view === 'traces' && (
        <TraceTable rows={traceRows()} onOpen={(id) => navigate(`/observability/traces/${id}`)} />
      )}

      {view === 'logs' && (
        <VStack gap={6}>
          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Tool-call log</Heading>
            <ToolCallLog rows={toolCallLog()} />
          </div>
          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Evaluation log</Heading>
            <EvaluationLog rows={evaluationLog()} />
          </div>
          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Human approval log</Heading>
            <HumanApprovalLog rows={humanApprovalLog()} />
          </div>
          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Control signals</Heading>
            <SignalLog rows={signalLog()} />
          </div>
        </VStack>
      )}

      {view === 'harnesses' && <HarnessVersionTable rows={harnessVersionComparison()} />}
    </div>
  )
}
