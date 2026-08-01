// The six Section 13 performance outcomes. Result is a STATE, not an identity,
// so it uses the status palette — the same colors the Executive Overview's
// distribution chart uses for the same entity (dataviz skill: color follows the
// entity, never its rank).
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { agentResultColor, axisText, gridColor } from '../../lib/chartColors'
import { useChartMode } from '../../lib/useChartMode'

const SHORT = {
  ExceedsExpectations: 'Exceeds', MeetsExpectations: 'Meets', NeedsOptimization: 'Needs opt.',
  Restricted: 'Restricted', Suspended: 'Suspended', Retired: 'Retired',
}

export function ResultDistributionChart({ data }) {
  const mode = useChartMode()
  const colors = agentResultColor(mode)
  const chartData = data.map((d) => ({ ...d, short: SHORT[d.result] ?? d.result }))
  return (
    <Card padding={4}>
      <VStack gap={1} style={{ marginBottom: 'var(--spacing-3)' }}>
        <Text weight="semibold">Performance results</Text>
        <Text size="sm" color="secondary">The six outcomes an agent review can reach.</Text>
      </VStack>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="short" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-20} textAnchor="end" height={54} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axisText(mode) }} width={28} />
          <Tooltip
            formatter={(v) => [`${v} agents`, '']}
            contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
          />
          <Bar isAnimationActive={false} dataKey="count" name="Agents" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {chartData.map((d) => <Cell key={d.result} fill={colors[d.result]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
