// The Section 16 log views: tool-call, evaluation, human-approval and control
// signals. All four are the same run-event stream filtered by step type, so
// they share one table shell and differ only in their extra columns.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { RUN_SIGNAL_LABELS } from '../../data/types'

const STATUS_VARIANT = { Success: 'success', Failure: 'error', Retry: 'warning', Escalated: 'warning', Running: 'info' }
const SIGNAL_VARIANT = { GuardrailTriggered: 'info', SecurityEvent: 'error', TokenAnomaly: 'warning', CostAnomaly: 'warning' }
const DECISION_VARIANT = { Approved: 'success', Edited: 'warning', Rejected: 'error' }

const timeCell = (row) => <Text size="sm" className="mono">{row.timestamp.slice(0, 16).replace('T', ' ')}</Text>

function LogTable({ rows, extraColumns, emptyTitle }) {
  const navigate = useNavigate()
  if (rows.length === 0) return <Card padding={4}><EmptyState title={emptyTitle} description="No matching events in this window." /></Card>

  const columns = [
    { key: 'timestamp', header: 'Time', width: pixel(150), renderCell: timeCell },
    { key: 'agentName', header: 'Agent', width: proportional(1.7, { minWidth: 170 }), renderCell: (row) => <Text size="sm">{row.agentName}</Text> },
    ...extraColumns,
    { key: 'status', header: 'Status', width: pixel(100), renderCell: (row) => <Badge label={row.status} variant={STATUS_VARIANT[row.status]} /> },
    { key: 'latencyMs', header: 'Latency', width: pixel(96), renderCell: (row) => <Text size="sm" className="mono">{row.latencyMs} ms</Text> },
    {
      key: 'traceId',
      header: 'Trace',
      width: pixel(110),
      renderCell: (row) => (
        <Text
          size="sm" color="accent" className="mono" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/observability/traces/${row.traceId}`)}
        >
          {row.traceId}
        </Text>
      ),
    },
  ]
  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows.slice(0, 60)} columns={columns} idKey="id" hasHover density="compact" />
      </div>
    </Card>
  )
}

export function ToolCallLog({ rows }) {
  return (
    <LogTable
      rows={rows}
      emptyTitle="No tool calls"
      extraColumns={[
        { key: 'toolName', header: 'Tool', width: proportional(2, { minWidth: 190 }), renderCell: (row) => <Text size="sm">{row.toolName ?? row.details}</Text> },
      ]}
    />
  )
}

export function EvaluationLog({ rows }) {
  return (
    <LogTable
      rows={rows}
      emptyTitle="No evaluations"
      extraColumns={[
        { key: 'harnessName', header: 'Harness', width: proportional(2, { minWidth: 190 }), renderCell: (row) => <Text size="sm" color="secondary">{row.harnessName}</Text> },
        {
          key: 'evaluationScorePct',
          header: 'Score',
          width: pixel(90),
          renderCell: (row) => (
            row.evaluationScorePct == null ? <Text size="sm">—</Text> : (
              <Badge
                label={`${row.evaluationScorePct}%`}
                variant={row.evaluationScorePct >= 90 ? 'success' : row.evaluationScorePct >= 80 ? 'warning' : 'error'}
              />
            )
          ),
        },
      ]}
    />
  )
}

export function HumanApprovalLog({ rows }) {
  return (
    <LogTable
      rows={rows}
      emptyTitle="No human approvals"
      extraColumns={[
        { key: 'approver', header: 'Approver', width: proportional(1.6, { minWidth: 170 }), renderCell: (row) => <Text size="sm">{row.approver ?? '—'}</Text> },
        {
          key: 'approvalDecision',
          header: 'Decision',
          width: pixel(110),
          renderCell: (row) => (
            row.approvalDecision
              ? <Badge label={row.approvalDecision} variant={DECISION_VARIANT[row.approvalDecision]} />
              : <Text size="sm">—</Text>
          ),
        },
      ]}
    />
  )
}

export function SignalLog({ rows }) {
  return (
    <LogTable
      rows={rows}
      emptyTitle="No control signals"
      extraColumns={[
        {
          key: 'signal',
          header: 'Signal',
          width: pixel(160),
          renderCell: (row) => <Badge label={RUN_SIGNAL_LABELS[row.signal] ?? row.signal} variant={SIGNAL_VARIANT[row.signal] ?? 'neutral'} />,
        },
        { key: 'details', header: 'Detail', width: proportional(2.4, { minWidth: 240 }), renderCell: (row) => <Text size="sm" color="secondary">{row.details}</Text> },
      ]}
    />
  )
}
