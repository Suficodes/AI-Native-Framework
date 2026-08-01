// VR tab 5 — costs, across the doc's eleven cost categories. Token cost is one
// line among eleven: an AI business case that only counts tokens understates
// the real cost of the capability by a wide margin, which is the point here.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { Banner } from '@astryxdesign/core/Banner'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { costByCategory, COST_LABELS } from '../../../data/valueAggregates.ts'
import { categorical, axisText, gridColor } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'
import { Aed } from '../../../dewa/Aed.jsx'

export function CostsTab({ rows, summary }) {
  const mode = useChartMode()
  const c = categorical(mode)
  const byCategory = costByCategory()
  const tokenShare = summary.totalAiCost === 0
    ? 0
    : Math.round(((byCategory.find((x) => x.category === 'ModelAndTokenCost')?.amount ?? 0) / summary.totalAiCost) * 100)

  const columns = [
    { key: 'id', header: 'VR record', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{row.id}</Text> },
    { key: 'initiativeTitle', header: 'Initiative', width: proportional(2.2, { minWidth: 220 }), renderCell: (row) => <Text size="sm">{row.initiativeTitle}</Text> },
    {
      key: 'aiCost',
      header: 'Cost lines',
      width: proportional(2.6, { minWidth: 260 }),
      renderCell: (row) => (
        <VStack gap={1}>
          {row.aiCost.map((line) => (
            <Text key={line.category} size="sm" color="secondary" style={{ display: 'block' }}>
              {COST_LABELS[line.category]} — <Aed aed={line.amount} compact />
            </Text>
          ))}
        </VStack>
      ),
    },
    { key: 'totalCost', header: 'Total AI cost', width: pixel(140), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.totalCost} compact /></Text> },
  ]

  return (
    <VStack gap={5}>
      <Banner
        status="info"
        title={`Model and token cost is ${tokenShare}% of total AI cost.`}
        description="The other ten categories — integration, development, data preparation, security, change management, human supervision and the rest — carry the balance. A business case built on token spend alone is not a business case."
      />

      <Card padding={4}>
        <VStack gap={1} style={{ marginBottom: 'var(--spacing-3)' }}>
          <Text weight="semibold">Cost by category</Text>
          <Text size="sm" color="secondary">Total AI cost booked across all VR records.</Text>
        </VStack>
        <ResponsiveContainer width="100%" height={Math.max(240, byCategory.length * 34)}>
          <BarChart data={byCategory} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: axisText(mode) }} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: axisText(mode) }} width={160} />
            <Tooltip
              formatter={(v) => [`AED ${v.toLocaleString()}`, 'Cost']}
              contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
            />
            <Bar isAnimationActive={false} dataKey="amount" name="Cost" fill={c[1]} radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding={0}>
        <div style={{ overflowX: 'auto' }}>
          <Table data={rows} columns={columns} idKey="id" hasHover density="balanced" textOverflow="wrap" />
        </div>
      </Card>
    </VStack>
  )
}
