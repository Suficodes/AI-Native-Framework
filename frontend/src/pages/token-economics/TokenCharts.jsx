// The eight Section 15 visualizations. Grouped in one module because they all
// read the same ledger through data/tokenAggregates.ts and share axis styling;
// each is a small named export the page composes.
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { categorical, status, axisText, gridColor } from '../../lib/chartColors'
import { useChartMode } from '../../lib/useChartMode'

const tooltipStyle = { background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }
// Keeps one decimal below 10K so neighbouring ticks stay distinct — rounding
// 2,500 and 3,400 both to "3K" produced duplicate axis labels.
const compact = (v) => {
  const n = Math.abs(v)
  if (n >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(v / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`
  if (n >= 1e3) return `${(v / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`
  return String(Math.round(v))
}

function ChartCard({ title, subtitle, children, empty }) {
  if (empty) {
    return <Card padding={4}><EmptyState title={title} description="No ledger rows in this scope yet." /></Card>
  }
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

/** 1. Token cost by division. */
export function CostByDivisionChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <ChartCard title="Token cost by division" subtitle="Where the spend sits this period." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 24, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="division" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-15} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: axisText(mode) }} width={48} tickFormatter={compact} />
          <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, 'Cost']} contentStyle={tooltipStyle} />
          <Bar isAnimationActive={false} dataKey="cost" name="Cost" fill={c[0]} radius={[4, 4, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** 2. Token usage by model — small models highlighted, since routing to them is the lever. */
export function UsageByModelChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <ChartCard title="Token usage by model" subtitle="Cost per model. Cheaper small models are shown in green." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={Math.max(240, data.length * 38)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: axisText(mode) }} tickFormatter={compact} />
          <YAxis type="category" dataKey="model" tick={{ fontSize: 11, fill: axisText(mode) }} width={150} />
          <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, 'Cost']} contentStyle={tooltipStyle} />
          <Bar isAnimationActive={false} dataKey="cost" name="Cost" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((d) => <Cell key={d.model} fill={d.isSmall ? c[2] : c[0]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** 3. Token trend over time. */
export function TokenTrendChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <ChartCard title="Token trend over time" subtitle="Monthly consumption against billed cost. Two units, so two labelled axes." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: axisText(mode) }} />
          {/* Tokens run to hundreds of millions and cost to tens of thousands —
              on one axis the cost line flattens to the baseline and says nothing. */}
          <YAxis yAxisId="tokens" tick={{ fontSize: 11, fill: axisText(mode) }} width={56} tickFormatter={compact} label={{ value: 'Tokens', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: axisText(mode) } }} />
          <YAxis yAxisId="cost" orientation="right" tick={{ fontSize: 11, fill: axisText(mode) }} width={56} tickFormatter={compact} label={{ value: 'Cost (AED)', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: axisText(mode) } }} />
          <Tooltip formatter={(v, name) => [Number(v).toLocaleString(), name]} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line yAxisId="tokens" isAnimationActive={false} type="monotone" dataKey="tokens" name="Tokens" stroke={c[0]} strokeWidth={2} dot={false} />
          <Line yAxisId="cost" isAnimationActive={false} type="monotone" dataKey="cost" name="Cost (AED)" stroke={c[1]} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** 4. Tokens versus successful outcomes — the ratio that decides whether spend is productive. */
export function TokensVsOutcomesChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <ChartCard title="Tokens versus successful outcomes" subtitle="Rising tokens with flat outcomes is the pattern to catch early." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: axisText(mode) }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: axisText(mode) }} width={52} tickFormatter={compact} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: axisText(mode) }} width={52} tickFormatter={compact} />
          <Tooltip formatter={(v, name) => [Number(v).toLocaleString(), name]} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line yAxisId="left" isAnimationActive={false} type="monotone" dataKey="tokens" name="Tokens" stroke={c[0]} strokeWidth={2} dot={false} />
          <Line yAxisId="right" isAnimationActive={false} type="monotone" dataKey="successfulOutcomes" name="Successful outcomes" stroke={c[2]} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** 5. Cost versus realized value, per division. */
export function CostVsValueChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  return (
    <ChartCard title="Cost versus realized value" subtitle="Token spend against the value attributed to it, by division." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 24, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
          <XAxis dataKey="division" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-15} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: axisText(mode) }} width={48} tickFormatter={compact} />
          <Tooltip formatter={(v, name) => [`AED ${Number(v).toLocaleString()}`, name]} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar isAnimationActive={false} dataKey="cost" name="Token cost" fill={c[1]} radius={[4, 4, 0, 0]} maxBarSize={38} />
          <Bar isAnimationActive={false} dataKey="value" name="Attributed value" fill={c[2]} radius={[4, 4, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** 6. Top consuming agents. */
export function TopAgentsChart({ data }) {
  const mode = useChartMode()
  const c = categorical(mode)
  const top = data.slice(0, 8)
  return (
    <ChartCard title="Top consuming agents" subtitle="The eight agents carrying most of the token spend." empty={top.length === 0}>
      <ResponsiveContainer width="100%" height={Math.max(240, top.length * 34)}>
        <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: axisText(mode) }} tickFormatter={compact} />
          <YAxis type="category" dataKey="agent" tick={{ fontSize: 11, fill: axisText(mode) }} width={190} />
          <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, 'Cost']} contentStyle={tooltipStyle} />
          <Bar isAnimationActive={false} dataKey="cost" name="Cost" fill={c[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** 7. High retry agents — retry tokens are pure waste, so this is a status-coloured chart. */
export function RetryAgentsChart({ data }) {
  const mode = useChartMode()
  const s = status(mode)
  const top = [...data].sort((a, b) => b.retryTokenPct - a.retryTokenPct).slice(0, 8)
  return (
    <ChartCard title="High retry agents" subtitle="Share of each agent's tokens burned on retried attempts." empty={top.length === 0}>
      <ResponsiveContainer width="100%" height={Math.max(240, top.length * 34)}>
        <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: axisText(mode) }} unit="%" />
          <YAxis type="category" dataKey="agent" tick={{ fontSize: 11, fill: axisText(mode) }} width={190} />
          <Tooltip formatter={(v) => [`${v}%`, 'Retry tokens']} contentStyle={tooltipStyle} />
          <Bar isAnimationActive={false} dataKey="retryTokenPct" name="Retry tokens" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {top.map((d) => (
              <Cell key={d.agentId} fill={d.retryTokenPct >= 12 ? s.critical : d.retryTokenPct >= 7 ? s.warning : s.good} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** 8. Token budget variance — annualized run-rate against each agent's approved budget. */
export function BudgetVarianceChart({ data }) {
  const mode = useChartMode()
  const s = status(mode)
  const top = data.slice(0, 10)
  return (
    <ChartCard title="Token budget variance" subtitle="Annualized spend as a share of approved budget. Amber past the alert level, red over budget." empty={top.length === 0}>
      <ResponsiveContainer width="100%" height={Math.max(240, top.length * 32)}>
        <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: axisText(mode) }} unit="%" />
          <YAxis type="category" dataKey="agent" tick={{ fontSize: 11, fill: axisText(mode) }} width={190} />
          <Tooltip formatter={(v) => [`${v}% of budget`, 'Consumption']} contentStyle={tooltipStyle} />
          <Bar isAnimationActive={false} dataKey="consumptionPct" name="Budget consumed" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {top.map((d) => (
              <Cell key={d.agentId} fill={d.consumptionPct >= 100 ? s.critical : d.consumptionPct >= d.alertLevelPct ? s.warning : s.good} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
