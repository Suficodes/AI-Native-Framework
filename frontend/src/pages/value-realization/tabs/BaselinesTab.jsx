// VR tab 3 — baselines. A benefit claim is only defensible against a baseline
// captured before implementation, so this tab puts baseline, target and actual
// side by side with the uplift each record actually achieved.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { Banner } from '@astryxdesign/core/Banner'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { baselineComparison } from '../../../data/valueAggregates.ts'
import { Aed } from '../../../dewa/Aed.jsx'

export function BaselinesTab() {
  const rows = baselineComparison()
  const columns = [
    { key: 'initiative', header: 'Initiative', width: proportional(2.4, { minWidth: 230 }), renderCell: (row) => <Text size="sm" weight="medium">{row.initiative}</Text> },
    { key: 'baselinePeriod', header: 'Baseline period', width: pixel(130), renderCell: (row) => <Text size="sm" color="secondary">{row.baselinePeriod}</Text> },
    { key: 'baseline', header: 'Baseline value', width: pixel(140), renderCell: (row) => <Text size="sm"><Aed aed={row.baseline} compact /></Text> },
    { key: 'target', header: 'Target', width: pixel(120), renderCell: (row) => <Text size="sm"><Aed aed={row.target} compact /></Text> },
    { key: 'actual', header: 'Actual', width: pixel(120), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.actual} compact /></Text> },
    { key: 'upliftPct', header: 'Uplift on baseline', width: pixel(150), renderCell: (row) => <Text size="sm" className="mono">{row.upliftPct}%</Text> },
    {
      key: 'realizationPct',
      header: 'Against target',
      width: pixel(160),
      renderCell: (row) => (
        <ProgressBar
          value={Math.min(100, row.realizationPct)}
          hasValueLabel
          variant={row.realizationPct >= 90 ? 'success' : row.realizationPct >= 60 ? 'warning' : 'error'}
        />
      ),
    },
  ]
  return (
    <VStack gap={4}>
      <Banner
        status="info"
        title="Every benefit is measured against a pre-implementation baseline."
        description="A baseline captured after go-live cannot be validated by Finance — the comparison has nothing to compare against."
      />
      <Card padding={0}>
        <div style={{ overflowX: 'auto' }}>
          <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
        </div>
      </Card>
    </VStack>
  )
}
