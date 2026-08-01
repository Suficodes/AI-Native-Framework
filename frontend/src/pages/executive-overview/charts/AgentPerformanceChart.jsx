// Chart D — Agent performance distribution. Result is a STATE, not an
// identity, so it uses the status palette (good/warning/serious/critical),
// never the categorical series colors.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { computeAgentPerformanceDistribution } from '../../../data/executiveAggregates'
import { agentResultColor, axisText, gridColor } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'

const LABELS = {
  ExceedsExpectations: 'Exceeds', MeetsExpectations: 'Meets', NeedsOptimization: 'Needs opt.',
  Restricted: 'Restricted', Suspended: 'Suspended', Retired: 'Retired',
}

export function AgentPerformanceChart() {
  const data = computeAgentPerformanceDistribution().map((d) => ({ ...d, label: LABELS[d.result] ?? d.result }))
  const mode = useChartMode()
  const colors = agentResultColor(mode)
  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>Agent Performance Distribution</Text>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisText(mode) }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axisText(mode) }} width={28} />
          <Tooltip formatter={(v) => [`${v} agents`, '']} contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <Bar isAnimationActive={false} dataKey="count" name="Agents" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((d) => <Cell key={d.result} fill={colors[d.result]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
