// Chart H — Quality Procedure AI-coverage compliance by section (sections
// that own at least one QP). Single series magnitude -> sequential hue.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { computeQpComplianceBySection } from '../../../data/executiveAggregates'
import { axisText, gridColor, sequential } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'

export function QpComplianceChart() {
  const data = computeQpComplianceBySection().sort((a, b) => b.compliance - a.compliance)
  const mode = useChartMode()
  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>Quality Procedure AI Coverage by Section</Text>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: axisText(mode) }} />
          <YAxis dataKey="section" type="category" width={130} tick={{ fontSize: 10, fill: axisText(mode) }} />
          <Tooltip formatter={(v) => `${v}% AI coverage`} contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
          <Bar isAnimationActive={false} dataKey="compliance" name="AI coverage" fill={sequential(mode)[1]} radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
