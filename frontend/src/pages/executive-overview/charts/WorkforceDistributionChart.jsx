// Chart A — AI-native workforce distribution (donut). Categorical identity,
// fixed color-per-entity via workforceTypeColor (dataviz skill rule: "color
// follows the entity, never its rank").
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { computeWorkforceDistribution } from '../../../data/executiveAggregates'
import { workforceTypeColor, axisText } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'

export function WorkforceDistributionChart() {
  const data = computeWorkforceDistribution()
  const mode = useChartMode()
  const colors = workforceTypeColor(mode)
  const cardBg = mode === 'dark' ? '#1F1F22' : '#FFFFFF'
  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>AI-Native Workforce Distribution</Text>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} strokeWidth={2} stroke={cardBg} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.key} fill={colors[d.key]} />)}
          </Pie>
          <Tooltip formatter={(v, n, p) => [`${v} positions (${p.payload.pct}%)`, p.payload.name]} contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 12, color: axisText(mode) }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
