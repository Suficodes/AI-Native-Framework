// Chart G — Token cost by platform/model. Categorical identity across models.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { computeTokenCostByModel } from '../../../data/executiveAggregates'
import { categorical, axisText, gridColor } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'

const fmtAed = (v) => `AED ${v.toLocaleString()}`

export function TokenCostByModelChart() {
  const data = computeTokenCostByModel()
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>Token Cost by Model</Text>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="model" tick={{ fontSize: 10, fill: axisText(mode) }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tickFormatter={fmtAed} tick={{ fontSize: 11, fill: axisText(mode) }} width={64} />
          <Tooltip formatter={(v) => fmtAed(v)} contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <Bar isAnimationActive={false} dataKey="cost" name="Token cost" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((d, i) => <Cell key={d.model} fill={c[i % c.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
