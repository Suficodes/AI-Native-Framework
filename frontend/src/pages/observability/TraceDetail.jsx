// One trace, as an agent execution timeline (Section 16). TRACE-001 is the
// doc's worked example — Demand submitted → … → VR ledger updated — and
// renders through this same generic page as every other trace.
// Route: /observability/traces/:traceId
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { getTraces } from '../../data/mockApi'
import { traceById } from '../../data/observabilityAggregates.ts'
import { RUN_SIGNAL_LABELS } from '../../data/types'
import { formatNumber } from '../../utils/format.js'
import { DewaButton } from '../../dewa/DewaButton.jsx'

const STATUS_VARIANT = { Success: 'success', Failure: 'error', Retry: 'warning', Escalated: 'warning', Running: 'info' }
const OUTCOME_VARIANT = { Success: 'success', Failure: 'error', HumanOverride: 'warning', InProgress: 'info' }
const OUTCOME_LABEL = { Success: 'Success', Failure: 'Failure', HumanOverride: 'Human override', InProgress: 'In progress' }
const SIGNAL_VARIANT = { GuardrailTriggered: 'info', SecurityEvent: 'error', TokenAnomaly: 'warning', CostAnomaly: 'warning' }

/** Traces can span hours; raw seconds ("15840s") is unreadable at that scale. */
function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/** One step of the execution timeline: a rail with a status dot, then the detail. */
function TimelineStep({ step, index, isLast }) {
  const dotColor = step.status === 'Failure'
    ? 'var(--color-background-error, #d03b3b)'
    : step.status === 'Success'
      ? 'var(--color-accent)'
      : 'var(--color-background-warning, #fab219)'

  return (
    <HStack gap={3} align="start">
      <VStack gap={0} align="center" style={{ width: 24, flex: 'none' }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', background: dotColor,
          marginTop: 5, flex: 'none',
        }}
        />
        {!isLast && <div style={{ width: 2, flex: 1, minHeight: 44, background: 'var(--color-border)' }} />}
      </VStack>
      <VStack gap={1} style={{ flex: 1, paddingBottom: 'var(--spacing-4)' }}>
        <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
          <Text size="sm" color="secondary" className="mono">{String(index + 1).padStart(2, '0')}</Text>
          <Text weight="medium">{step.details}</Text>
          <Badge label={step.status} variant={STATUS_VARIANT[step.status]} />
          {step.signal && <Badge label={RUN_SIGNAL_LABELS[step.signal]} variant={SIGNAL_VARIANT[step.signal]} />}
        </HStack>
        <HStack gap={3} align="center" style={{ flexWrap: 'wrap' }}>
          <Text size="sm" color="secondary" className="mono">{step.timestamp.slice(11, 19)}</Text>
          <Text size="sm" color="secondary">{step.step}</Text>
          <Text size="sm" color="secondary" className="mono">{formatNumber(step.latencyMs)} ms</Text>
          {step.toolName && <Text size="sm" color="secondary">Tool: {step.toolName}</Text>}
          {step.evaluationScorePct != null && <Text size="sm" color="secondary">Score: {step.evaluationScorePct}%</Text>}
          {step.approver && <Text size="sm" color="secondary">{step.approvalDecision} by {step.approver}</Text>}
        </HStack>
      </VStack>
    </HStack>
  )
}

export default function TraceDetail() {
  const { traceId } = useParams()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setLoaded(false); getTraces().then(() => setLoaded(true)) }, [traceId])

  if (!loaded) return <div className="page-band page-band--wide"><Skeleton height={480} radius={2} /></div>

  const trace = traceById(traceId)
  if (!trace) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="Trace not found" description={`No trace with ID "${traceId}".`} />
      </div>
    )
  }

  const totalLatency = trace.steps.reduce((s, step) => s + step.latencyMs, 0)

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Observability" variant="ghost" onClick={() => navigate('/observability')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">Trace · {trace.id}</span>
        <Heading level={1} type="display-3">{trace.agentName}</Heading>
        <Text color="secondary" size="lg">
          {trace.stepCount} steps · {formatDuration(trace.durationMs)} wall clock · {formatNumber(totalLatency)} ms total step latency
        </Text>
      </div>

      <VStack gap={5}>
        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="Outcome">
              <Badge label={OUTCOME_LABEL[trace.outcome]} variant={OUTCOME_VARIANT[trace.outcome]} />
            </MetadataListItem>
            <MetadataListItem label="Agent">
              <Text color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => navigate(`/agents/${trace.agentId}`)}>
                {trace.agentName}
              </Text>
            </MetadataListItem>
            <MetadataListItem label="D2D demand">
              {trace.demandId ? (
                <Text color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => navigate(`/d2d-integration/demands/${trace.demandId}`)}>
                  {trace.demandId}
                </Text>
              ) : 'Not linked to a demand'}
            </MetadataListItem>
            <MetadataListItem label="Started">{trace.startedAt.slice(0, 16).replace('T', ' ')}</MetadataListItem>
            <MetadataListItem label="Failed steps">{trace.failedSteps}</MetadataListItem>
            <MetadataListItem label="Harness">
              {trace.steps[0]?.harnessId ? (
                <Text color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => navigate(`/harness-engineering/${trace.steps[0].harnessId}`)}>
                  {trace.steps[0].harnessId}
                </Text>
              ) : '—'}
            </MetadataListItem>
          </MetadataList>
        </Card>

        <div>
          <Heading level={3} style={{ margin: '0 0 var(--spacing-1)' }}>Agent execution timeline</Heading>
          <Text color="secondary" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-4)' }}>
            Every step the harness executed, in order, with its status, latency and any control signal it raised.
          </Text>
          <Card padding={4}>
            <VStack gap={0}>
              {trace.steps.map((step, i) => (
                <TimelineStep key={step.id} step={step} index={i} isLast={i === trace.steps.length - 1} />
              ))}
            </VStack>
          </Card>
        </div>
      </VStack>
    </div>
  )
}
