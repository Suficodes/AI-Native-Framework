// VR tab 7 — post-go-live review. Only records that have actually gone live
// appear: a benefit cannot be reviewed post-go-live before go-live, and showing
// the whole portfolio here would imply otherwise.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { postGoLiveRecords, VR_STAGE_LABELS } from '../../../data/valueAggregates.ts'
import { Aed } from '../../../dewa/Aed.jsx'

export function PostGoLiveTab() {
  const navigate = useNavigate()
  const rows = postGoLiveRecords()

  if (rows.length === 0) {
    return <EmptyState title="Nothing live yet" description="No VR record has reached post-go-live tracking." />
  }

  const columns = [
    {
      key: 'id',
      header: 'VR record',
      width: proportional(2.2, { minWidth: 220 }),
      renderCell: (row) => (
        <Text
          size="sm" weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/value-realization/${row.id}`)}
        >
          {row.id} — {row.initiativeTitle}
        </Text>
      ),
    },
    { key: 'agentName', header: 'Delivered by', width: proportional(1.6, { minWidth: 170 }), renderCell: (row) => <Text size="sm" color="secondary">{row.agentName ?? 'No agent assigned'}</Text> },
    { key: 'reviewPeriod', header: 'Review period', width: pixel(120), renderCell: (row) => <Text size="sm" color="secondary">{row.reviewPeriod}</Text> },
    { key: 'target', header: 'Target', width: pixel(120), renderCell: (row) => <Text size="sm"><Aed aed={row.target} compact /></Text> },
    { key: 'actualResult', header: 'Actual', width: pixel(120), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.actualResult} compact /></Text> },
    {
      key: 'benefitRealizationPct',
      header: 'Realization',
      width: pixel(120),
      renderCell: (row) => (
        <Badge
          label={`${row.benefitRealizationPct}%`}
          variant={row.benefitRealizationPct >= 100 ? 'success' : row.benefitRealizationPct >= 75 ? 'warning' : 'error'}
        />
      ),
    },
    { key: 'validationStatus', header: 'Stage', width: pixel(170), renderCell: (row) => <Text size="sm" color="secondary">{VR_STAGE_LABELS[row.validationStatus]}</Text> },
    {
      key: 'evidence',
      header: 'Evidence on file',
      width: proportional(2, { minWidth: 210 }),
      renderCell: (row) => (
        <VStack gap={1}>
          {row.evidence.map((item) => <Text key={item} size="sm" color="secondary" style={{ display: 'block' }}>• {item}</Text>)}
        </VStack>
      ),
    },
  ]

  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows} columns={columns} idKey="id" hasHover density="balanced" textOverflow="wrap" />
      </div>
    </Card>
  )
}
