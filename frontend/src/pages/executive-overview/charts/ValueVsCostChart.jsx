// Chart C — AI value vs AI cost by division. Two measures of different scale
// on the same AED axis (not dual-axis — both series share one y-scale).
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { computeValueVsCostByDivision } from '../../../data/executiveAggregates'
import { categorical, axisText, gridColor } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'

const fmtAed = (v) => `AED ${(v / 1000).toFixed(0)}k`

export function ValueVsCostChart() {
  const data = computeValueVsCostByDivision()
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>AI Value vs. AI Cost by Division</Text>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="division" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tickFormatter={fmtAed} tick={{ fontSize: 11, fill: axisText(mode) }} width={56} />
          <Tooltip formatter={(v) => fmtAed(v)} contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12, color: axisText(mode) }} />
          <Bar isAnimationActive={false} dataKey="value" name="Realized value" fill={c[5]} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar isAnimationActive={false} dataKey="cost" name="Total cost" fill={c[7]} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
