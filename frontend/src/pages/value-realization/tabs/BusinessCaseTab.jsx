// VR tab 2 — the business case: what each initiative promised against what it
// has actually returned, with ROI on the AI cost booked so far.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { businessCaseRows, VR_STAGE_LABELS } from '../../../data/valueAggregates.ts'
import { Aed } from '../../../dewa/Aed.jsx'

export function BusinessCaseTab() {
  const navigate = useNavigate()
  const rows = businessCaseRows()
  const columns = [
    {
      key: 'initiative',
      header: 'Initiative',
      width: proportional(2.4, { minWidth: 230 }),
      renderCell: (row) => (
        <Text
          size="sm" weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/ai-initiatives/${row.initiativeId}`)}
        >
          {row.initiative}
        </Text>
      ),
    },
    { key: 'stage', header: 'Delivery stage', width: pixel(130), renderCell: (row) => <Badge label={row.stage} variant="neutral" /> },
    { key: 'expectedValue', header: 'Expected value', width: pixel(140), renderCell: (row) => <Text size="sm"><Aed aed={row.expectedValue} compact /></Text> },
    { key: 'target', header: 'Approved target', width: pixel(140), renderCell: (row) => <Text size="sm"><Aed aed={row.target} compact /></Text> },
    { key: 'actualResult', header: 'Actual result', width: pixel(130), renderCell: (row) => <Text size="sm"><Aed aed={row.actualResult} compact /></Text> },
    { key: 'totalCost', header: 'AI cost', width: pixel(110), renderCell: (row) => <Text size="sm"><Aed aed={row.totalCost} compact /></Text> },
    { key: 'netBenefit', header: 'Net benefit', width: pixel(130), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.netBenefit} compact signed /></Text> },
    {
      key: 'roiPct',
      header: 'ROI',
      width: pixel(90),
      renderCell: (row) => (
        <Text size="sm" className="mono" color={row.roiPct >= 0 ? 'accent' : 'secondary'}>{row.roiPct}%</Text>
      ),
    },
    { key: 'validationStatus', header: 'Validation', width: pixel(160), renderCell: (row) => <Text size="sm" color="secondary">{VR_STAGE_LABELS[row.validationStatus]}</Text> },
  ]
  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
      </div>
    </Card>
  )
}
