// VR tab 1 — the portfolio register. Every VR record with its validation
// stage, benefit, cost and realization percentage; the title drills into the
// full record.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { BENEFIT_LABELS, VR_STAGE_LABELS } from '../../../data/valueAggregates.ts'
import { Aed } from '../../../dewa/Aed.jsx'

const STAGE_VARIANT = {
  Draft: 'neutral', BusinessValidation: 'info', FinanceValidation: 'info', BPIValidation: 'info',
  PMOValidation: 'info', Approved: 'success', PostGoLiveTracking: 'warning', Realized: 'success', Closed: 'neutral',
}

export function PortfolioTab({ rows }) {
  const navigate = useNavigate()
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
    { key: 'divisionName', header: 'Division', width: proportional(1.4, { minWidth: 150 }), renderCell: (row) => <Text size="sm" color="secondary">{row.divisionName.replace(' Division', '')}</Text> },
    { key: 'benefitType', header: 'Benefit type', width: pixel(150), renderCell: (row) => <Text size="sm">{BENEFIT_LABELS[row.benefitType]}</Text> },
    { key: 'grossBenefit', header: 'Gross benefit', width: pixel(130), renderCell: (row) => <Text size="sm"><Aed aed={row.grossBenefit} compact /></Text> },
    { key: 'totalCost', header: 'AI cost', width: pixel(110), renderCell: (row) => <Text size="sm"><Aed aed={row.totalCost} compact /></Text> },
    { key: 'netBenefit', header: 'Net benefit', width: pixel(130), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.netBenefit} compact signed /></Text> },
    { key: 'benefitRealizationPct', header: 'Realization', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{row.benefitRealizationPct}%</Text> },
    { key: 'validationStatus', header: 'Validation', width: pixel(170), renderCell: (row) => <Badge label={VR_STAGE_LABELS[row.validationStatus]} variant={STAGE_VARIANT[row.validationStatus]} /> },
  ]
  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
      </div>
    </Card>
  )
}
