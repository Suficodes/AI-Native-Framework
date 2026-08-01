// Chart F — AI initiative delivery status. Status colors, icon+label
// mitigation via the legend (never color-alone for state).
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { computeInitiativeDeliveryStatus } from '../../../data/executiveAggregates'
import { initiativeStatusColor, axisText } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'

export function InitiativeStatusChart() {
  const data = computeInitiativeDeliveryStatus()
  const mode = useChartMode()
  const colors = initiativeStatusColor(mode)
  const cardBg = mode === 'dark' ? '#1F1F22' : '#FFFFFF'
  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>AI Initiative Delivery Status</Text>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="status" outerRadius={92} strokeWidth={2} stroke={cardBg} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.status} fill={colors[d.status]} />)}
          </Pie>
          <Tooltip formatter={(v, n, p) => [`${v} initiatives`, p.payload.status]} contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 12, color: axisText(mode) }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
