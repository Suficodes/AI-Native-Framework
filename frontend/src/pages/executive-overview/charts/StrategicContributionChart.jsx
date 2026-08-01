// Chart E — Value by strategic objective. Single series (magnitude), so it
// uses the sequential mid-step, not a categorical hue.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { computeStrategicObjectiveContribution } from '../../../data/executiveAggregates'
import { axisText, gridColor, sequential } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'

const fmtAed = (v) => `AED ${(v / 1000).toFixed(0)}k`

export function StrategicContributionChart() {
  const data = computeStrategicObjectiveContribution()
  const mode = useChartMode()
  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>Value by Strategic Objective</Text>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
          <XAxis type="number" tickFormatter={fmtAed} tick={{ fontSize: 11, fill: axisText(mode) }} />
          <YAxis dataKey="objective" type="category" width={150} tick={{ fontSize: 11, fill: axisText(mode) }} />
          <Tooltip formatter={(v) => fmtAed(v)} contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <Bar isAnimationActive={false} dataKey="value" name="Realized value" fill={sequential(mode)[1]} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
