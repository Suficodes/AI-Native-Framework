// The Section 17 breakdowns: initiatives and value by strategic objective,
// agenticity contribution, excellence improvement, initiative risk and
// delivery status.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { categorical, status, initiativeStatusColor, axisText, gridColor } from '../../lib/chartColors'
import { useChartMode } from '../../lib/useChartMode'

const tooltipStyle = { background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }
const compact = (v) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v))
const shortObjective = (name) => name.replace(' Leadership', '').replace(' Transformation', '')

function ChartCard({ title, subtitle, children, empty }) {
  if (empty) return <Card padding={4}><EmptyState title={title} description="No data in scope." /></Card>
  return (
    <Card padding={4}>
      <VStack gap={1} style={{ marginBottom: 'var(--spacing-3)' }}>
        <Text weight="semibold">{title}</Text>
        <Text size="sm" color="secondary">{subtitle}</Text>
      </VStack>
      {children}
    </Card>
  )
}

/** Expected against realized value, per objective. */
export function ValueByObjectiveChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  const rows = data.map((d) => ({ ...d, short: shortObjective(d.objective) }))
  return (
    <ChartCard title="Value by strategic objective" subtitle="Expected value in the pipeline against net benefit already validated." empty={rows.length === 0}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ left: 12, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="short" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-15} textAnchor="end" height={62} />
          <YAxis tick={{ fontSize: 11, fill: axisText(mode) }} width={50} tickFormatter={compact} />
          <Tooltip formatter={(v, n) => [`AED ${Number(v).toLocaleString()}`, n]} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar isAnimationActive={false} dataKey="expectedValue" name="Expected" fill={c[0]} radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar isAnimationActive={false} dataKey="realizedValue" name="Realized net benefit" fill={c[2]} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Agenticity progress and excellence improvement — both percentages, one axis. */
export function ContributionChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  const rows = data.map((d) => ({ ...d, short: shortObjective(d.objective) }))
  return (
    <ChartCard
      title="Agenticity and excellence contribution"
      subtitle="How far each objective's processes have climbed toward their agenticity target, and how far its criteria have moved from baseline."
      empty={rows.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="short" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-15} textAnchor="end" height={62} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: axisText(mode) }} width={40} unit="%" />
          <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar isAnimationActive={false} dataKey="agenticityContribution" name="Agenticity progress" fill={c[6]} radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar isAnimationActive={false} dataKey="excellenceImprovementPct" name="Excellence improvement" fill={c[3]} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Delivery status — a state, so the status palette, matching Executive Overview. */
export function DeliveryStatusChart({ data }) {
  const mode = useChartMode()
  const colors = initiativeStatusColor(mode)
  const rows = data.map((d) => ({ ...d, short: shortObjective(d.objective) }))
  return (
    <ChartCard title="Delivery status by objective" subtitle="Where each objective's initiatives currently stand." empty={rows.length === 0}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="short" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-15} textAnchor="end" height={62} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axisText(mode) }} width={30} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar isAnimationActive={false} stackId="d" dataKey="OnTrack" name="On track" fill={colors.OnTrack} maxBarSize={38} />
          <Bar isAnimationActive={false} stackId="d" dataKey="AtRisk" name="At risk" fill={colors.AtRisk} maxBarSize={38} />
          <Bar isAnimationActive={false} stackId="d" dataKey="Delayed" name="Delayed" fill={colors.Delayed} maxBarSize={38} />
          <Bar isAnimationActive={false} stackId="d" dataKey="Blocked" name="Blocked" fill={colors.Blocked} maxBarSize={38} />
          <Bar isAnimationActive={false} stackId="d" dataKey="Complete" name="Complete" fill={colors.Complete} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Initiative risk — also a state. */
export function RiskChart({ data }) {
  const mode = useChartMode()
  const s = status(mode)
  const rows = data.map((d) => ({ ...d, short: shortObjective(d.objective) }))
  return (
    <ChartCard title="Initiative risk by objective" subtitle="Risk profile of the initiatives carrying each objective." empty={rows.length === 0}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="short" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-15} textAnchor="end" height={62} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axisText(mode) }} width={30} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar isAnimationActive={false} stackId="r" dataKey="Low" name="Low" fill={s.good} maxBarSize={38} />
          <Bar isAnimationActive={false} stackId="r" dataKey="Medium" name="Medium" fill={s.warning} maxBarSize={38} />
          <Bar isAnimationActive={false} stackId="r" dataKey="High" name="High" fill={s.critical} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
