// The trace register. Every agent run recorded end to end; the ID opens the
// execution timeline.
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'

const OUTCOME_VARIANT = { Success: 'success', Failure: 'error', HumanOverride: 'warning', InProgress: 'info' }
const OUTCOME_LABEL = { Success: 'Success', Failure: 'Failure', HumanOverride: 'Human override', InProgress: 'In progress' }

export function TraceTable({ rows, onOpen }) {
  if (rows.length === 0) return <Card padding={4}><EmptyState title="No traces" description="No agent runs recorded in this window." /></Card>

  const columns = [
    {
      key: 'id',
      header: 'Trace',
      width: pixel(120),
      renderCell: (row) => (
        <Text
          size="sm" weight="medium" color="accent" className="mono" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => onOpen(row.id)}
        >
          {row.id}
        </Text>
      ),
    },
    { key: 'agentName', header: 'Agent', width: proportional(2, { minWidth: 190 }), renderCell: (row) => <Text size="sm">{row.agentName}</Text> },
    { key: 'demandId', header: 'Demand', width: pixel(140), renderCell: (row) => <Text size="sm" color="secondary" className="mono">{row.demandId ?? '—'}</Text> },
    { key: 'startedAt', header: 'Started', width: pixel(150), renderCell: (row) => <Text size="sm" className="mono">{row.startedAt.slice(0, 16).replace('T', ' ')}</Text> },
    { key: 'stepCount', header: 'Steps', width: pixel(80), renderCell: (row) => <Text size="sm" className="mono">{row.stepCount}</Text> },
    {
      key: 'failedSteps',
      header: 'Failed steps',
      width: pixel(110),
      renderCell: (row) => (
        <Text size="sm" className="mono" color={row.failedSteps > 0 ? 'primary' : 'secondary'}>{row.failedSteps}</Text>
      ),
    },
    { key: 'durationMs', header: 'Duration', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{Math.round(row.durationMs / 1000)}s</Text> },
    { key: 'outcome', header: 'Outcome', width: pixel(140), renderCell: (row) => <Badge label={OUTCOME_LABEL[row.outcome]} variant={OUTCOME_VARIANT[row.outcome]} /> },
  ]

  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
      </div>
    </Card>
  )
}
