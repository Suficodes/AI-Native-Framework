// The Section 16 time-series charts. Grouped in one module because they share
// axis styling and all read the same run-event stream.
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { categorical, status, axisText, gridColor } from '../../lib/chartColors'
import { useChartMode } from '../../lib/useChartMode'

const tooltipStyle = { background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }
const shortDay = (iso) => iso.slice(5)

function ChartCard({ title, subtitle, children, empty }) {
  if (empty) return <Card padding={4}><EmptyState title={title} description="No events in this window." /></Card>
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

/** Run outcomes per day — stacked, because the parts sum to total daily volume. */
export function RunsOverTimeChart({ data }) {
  const mode = useChartMode()
  const s = status(mode)
  return (
    <ChartCard title="Agent runs over time" subtitle="Run steps per day by outcome, across the last 30 days." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 11, fill: axisText(mode) }} minTickGap={18} />
          <YAxis tick={{ fontSize: 11, fill: axisText(mode) }} width={34} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area isAnimationActive={false} type="monotone" stackId="1" dataKey="success" name="Success" stroke={s.good} fill={s.good} fillOpacity={0.7} />
          <Area isAnimationActive={false} type="monotone" stackId="1" dataKey="retry" name="Retry" stroke={s.warning} fill={s.warning} fillOpacity={0.7} />
          <Area isAnimationActive={false} type="monotone" stackId="1" dataKey="escalated" name="Escalated" stroke={s.serious} fill={s.serious} fillOpacity={0.7} />
          <Area isAnimationActive={false} type="monotone" stackId="1" dataKey="failure" name="Failure" stroke={s.critical} fill={s.critical} fillOpacity={0.8} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Average and peak latency — the peak line is what breaches an SLA, not the average. */
export function LatencyChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <ChartCard title="Latency over time" subtitle="Average and peak step latency per day. The peak is what breaches an SLA." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 11, fill: axisText(mode) }} minTickGap={18} />
          <YAxis tick={{ fontSize: 11, fill: axisText(mode) }} width={52} unit="ms" />
          <Tooltip formatter={(v, n) => [`${Number(v).toLocaleString()} ms`, n]} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line isAnimationActive={false} type="monotone" dataKey="average" name="Average" stroke={c[0]} strokeWidth={2} dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="peak" name="Peak" stroke={c[1]} strokeWidth={2} strokeDasharray="4 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Guardrails, security events and anomalies per day. */
export function SignalsChart({ data }) {
  const mode = useChartMode()
  const s = status(mode)
  const c = categorical(mode)
  return (
    <ChartCard title="Control signals over time" subtitle="Guardrail triggers, security events and token or cost anomalies." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 11, fill: axisText(mode) }} minTickGap={18} />
          <YAxis tick={{ fontSize: 11, fill: axisText(mode) }} width={30} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {/* A guardrail firing is the control working, so it is not red. */}
          <Bar isAnimationActive={false} stackId="s" dataKey="guardrail" name="Guardrail" fill={c[0]} maxBarSize={26} />
          <Bar isAnimationActive={false} stackId="s" dataKey="anomaly" name="Anomaly" fill={s.warning} maxBarSize={26} />
          <Bar isAnimationActive={false} stackId="s" dataKey="security" name="Security" fill={s.critical} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Availability per agent — ascending, so the agent needing attention is first. */
export function AgentAvailabilityChart({ data }) {
  const mode = useChartMode()
  const s = status(mode)
  const top = data.slice(0, 10)
  return (
    <ChartCard title="Agent availability" subtitle="Share of completed run steps that did not fail. Worst first." empty={top.length === 0}>
      <ResponsiveContainer width="100%" height={Math.max(240, top.length * 32)}>
        <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: axisText(mode) }} unit="%" />
          <YAxis type="category" dataKey="agent" tick={{ fontSize: 11, fill: axisText(mode) }} width={200} />
          <Tooltip formatter={(v) => [`${v}%`, 'Availability']} contentStyle={tooltipStyle} />
          {/* Availability is a state, so it takes the status palette. */}
          <Bar isAnimationActive={false} dataKey="availabilityPct" name="Availability" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {top.map((d) => (
              <Cell key={d.agentId} fill={d.availabilityPct >= 98 ? s.good : d.availabilityPct >= 92 ? s.warning : s.critical} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
