// VR tab 4 — benefits, across the doc's twelve benefit categories. Validated
// and unvalidated benefit are shown apart: conflating them is the single most
// common way an AI value story overstates itself.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { valueByBenefitType, isValidated, BENEFIT_LABELS } from '../../../data/valueAggregates.ts'
import { categorical, axisText, gridColor } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'
import { Aed } from '../../../dewa/Aed.jsx'
import { ValueTag } from '../../../dewa/ValueTag.jsx'

function SplitCard({ label, amount, tag, note }) {
  return (
    <Card padding={4}>
      <VStack gap={2}>
        <Text size="sm" color="secondary" weight="medium">{label}</Text>
        <div className="kpi-value"><Aed aed={amount} compact /></div>
        <HStack justify="between" align="center">
          <Text size="sm" color="secondary">{note}</Text>
          <ValueTag tag={tag} />
        </HStack>
      </VStack>
    </Card>
  )
}

export function BenefitsTab({ rows, summary }) {
  const mode = useChartMode()
  const c = categorical(mode)
  const byType = valueByBenefitType()

  const columns = [
    { key: 'id', header: 'VR record', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{row.id}</Text> },
    { key: 'initiativeTitle', header: 'Initiative', width: proportional(2.2, { minWidth: 220 }), renderCell: (row) => <Text size="sm">{row.initiativeTitle}</Text> },
    { key: 'benefitType', header: 'Benefit type', width: pixel(160), renderCell: (row) => <Text size="sm">{BENEFIT_LABELS[row.benefitType]}</Text> },
    { key: 'measurementMethod', header: 'Measurement method', width: proportional(2, { minWidth: 220 }), renderCell: (row) => <Text size="sm" color="secondary">{row.measurementMethod}</Text> },
    { key: 'grossBenefit', header: 'Gross benefit', width: pixel(130), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.grossBenefit} compact /></Text> },
    {
      key: 'validated',
      header: 'Status',
      width: pixel(120),
      renderCell: (row) => <ValueTag tag={isValidated(row) ? 'Validated' : 'Estimated'} />,
    },
  ]

  return (
    <VStack gap={5}>
      <div className="auto-grid" style={{ '--min': '230px' }}>
        <SplitCard label="Expected benefit" amount={summary.expectedBenefit} tag="Estimated" note="Sum of approved targets" />
        <SplitCard label="Realized benefit" amount={summary.realizedBenefit} tag="Observed" note="Actual result, all records" />
        <SplitCard label="Validated benefit" amount={summary.validatedBenefit} tag="Validated" note="Cleared all validation gates" />
        <SplitCard label="Unvalidated benefit" amount={summary.unvalidatedBenefit} tag="Estimated" note="Still in the approval workflow" />
      </div>

      <Card padding={4}>
        <VStack gap={1} style={{ marginBottom: 'var(--spacing-3)' }}>
          <Text weight="semibold">Benefit by category</Text>
          <Text size="sm" color="secondary">Gross benefit across the twelve benefit categories in use.</Text>
        </VStack>
        <ResponsiveContainer width="100%" height={Math.max(240, byType.length * 34)}>
          <BarChart data={byType} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: axisText(mode) }} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: axisText(mode) }} width={150} />
            <Tooltip
              formatter={(v) => [`AED ${v.toLocaleString()}`, 'Gross benefit']}
              contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
            />
            <Bar isAnimationActive={false} dataKey="benefit" name="Gross benefit" fill={c[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding={0}>
        <div style={{ overflowX: 'auto' }}>
          <Table data={rows} columns={columns} idKey="id" hasHover density="compact" textOverflow="wrap" />
        </div>
      </Card>
    </VStack>
  )
}
