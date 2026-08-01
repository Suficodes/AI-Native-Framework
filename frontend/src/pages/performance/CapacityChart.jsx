// Capacity released vs redeployed, per division. Two series on one axis
// (hours) — the gap between them is the point of the chart: released capacity
// that is never redeployed never becomes a business outcome.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { categorical, axisText, gridColor } from '../../lib/chartColors'
import { useChartMode } from '../../lib/useChartMode'

export function CapacityChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  if (data.length === 0) {
    return <Card padding={4}><EmptyState title="No capacity data" description="No division has human AI-native performance records this period." /></Card>
  }
  return (
    <Card padding={4}>
      <VStack gap={1} style={{ marginBottom: 'var(--spacing-3)' }}>
        <Text weight="semibold">Capacity released vs redeployed</Text>
        <Text size="sm" color="secondary">Hours freed by AI, and hours actually reassigned to new work.</Text>
      </VStack>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="division" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-15} textAnchor="end" height={56} />
          <YAxis tick={{ fontSize: 11, fill: axisText(mode) }} width={48} unit="h" />
          <Tooltip
            formatter={(v, name) => [`${v.toLocaleString()} h`, name]}
            contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar isAnimationActive={false} dataKey="released" name="Released" fill={c[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar isAnimationActive={false} dataKey="redeployed" name="Redeployed" fill={c[2]} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
