// Playbook section 8 — required data. Unioned from what the in-scope agents
// need access to, what their harnesses retrieve from, and what the governing
// Quality Procedures take as input; ordered worst-readiness first, because
// that is the order the gaps have to be closed in.
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { EmptyState } from '@astryxdesign/core/EmptyState'

const STATUS_VARIANT = { Available: 'success', 'Needs preparation': 'warning', Gap: 'error' }

export function RequiredDataSection({ playbook }) {
  const rows = playbook.requiredData
  if (rows.length === 0) {
    return <EmptyState title="No data requirements resolved" description="No agent, harness, or Quality Procedure in this scope declares a data dependency yet." />
  }

  const columns = [
    { key: 'name', header: 'Data or knowledge source', width: proportional(2, { minWidth: 220 }), renderCell: (row) => <Text size="sm" weight="medium">{row.name}</Text> },
    { key: 'purpose', header: 'Purpose', width: proportional(2, { minWidth: 200 }), renderCell: (row) => <Text size="sm" color="secondary">{row.purpose}</Text> },
    { key: 'sourceSystem', header: 'Source system', width: proportional(1.4, { minWidth: 160 }), renderCell: (row) => <Text size="sm" color="secondary">{row.sourceSystem}</Text> },
    { key: 'readinessPct', header: 'Readiness', width: pixel(160), renderCell: (row) => <ProgressBar value={row.readinessPct} hasValueLabel variant={row.readinessPct >= 75 ? 'success' : row.readinessPct >= 45 ? 'warning' : 'error'} /> },
    { key: 'status', header: 'Status', width: pixel(150), renderCell: (row) => <Badge label={row.status} variant={STATUS_VARIANT[row.status]} /> },
  ]

  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows} columns={columns} idKey="name" hasHover density="balanced" textOverflow="wrap" />
      </div>
    </Card>
  )
}
