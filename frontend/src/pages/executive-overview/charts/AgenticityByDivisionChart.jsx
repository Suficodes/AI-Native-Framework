// Chart B — Process agenticity by division: current vs target. Two series,
// one axis (agenticity level index 0-6) — never dual-axis.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { computeAgenticityByDivision } from '../../../data/executiveAggregates'
import { AGENTICITY_LABELS, AGENTICITY_ORDER } from '../../../data/types'
import { categorical, axisText, gridColor } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'

const levelLabel = (idx) => AGENTICITY_ORDER[Math.round(idx)] ?? 'L0'

export function AgenticityByDivisionChart() {
  const data = computeAgenticityByDivision()
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>Process Agenticity by Division</Text>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="division" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis domain={[0, 6]} tickFormatter={levelLabel} tick={{ fontSize: 11, fill: axisText(mode) }} width={36} />
          <Tooltip
            formatter={(v) => [`${levelLabel(v)} — ${AGENTICITY_LABELS[levelLabel(v)]}`, '']}
            contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: axisText(mode) }} />
          <Bar isAnimationActive={false} dataKey="current" name="Current" fill={c[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar isAnimationActive={false} dataKey="target" name="Target" fill={c[2]} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
