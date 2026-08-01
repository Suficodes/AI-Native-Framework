// Audit History tab — this agent's run/trace history, the closest thing to
// an audit log the data model carries (requirements doc Section 8 lists
// "Audit History" as a tab; Section 19's AgentRunEvent/Trace records are
// the underlying evidence).
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { runsForAgent, tracesForAgent } from '../../../data/agentsAggregates.ts'
import { formatDate } from '../../../utils/format.js'

const STATUS_VARIANT = { Success: 'success', Failure: 'error', Retry: 'warning', Escalated: 'warning' }

export function AuditHistoryTab({ agent }) {
  const runs = runsForAgent(agent.id)
  const traces = tracesForAgent(agent.id)

  if (runs.length === 0) return <EmptyState title="No run history" description="This agent has no recorded runs yet." />

  const columns = [
    { key: 'timestamp', header: 'Timestamp', width: pixel(160), renderCell: (row) => <Text size="sm">{formatDate(row.timestamp)}</Text> },
    { key: 'step', header: 'Step', width: proportional(1.4, { minWidth: 140 }) },
    { key: 'status', header: 'Status', width: pixel(100), renderCell: (row) => <Badge label={row.status} variant={STATUS_VARIANT[row.status]} /> },
    { key: 'latencyMs', header: 'Latency', width: pixel(90), renderCell: (row) => <Text size="sm">{row.latencyMs} ms</Text> },
    { key: 'details', header: 'Details', width: proportional(2.2, { minWidth: 200 }) },
  ]

  return (
    <VStack gap={4}>
      {traces.length > 0 && (
        <Text size="sm" color="secondary">{traces.length} trace{traces.length > 1 ? 's' : ''} on record · latest outcome: {traces[0].outcome}</Text>
      )}
      <Card padding={0}>
        <div style={{ overflowX: 'auto' }}>
          <Table data={runs} columns={columns} idKey="id" hasHover density="compact" />
        </div>
      </Card>
    </VStack>
  )
}
