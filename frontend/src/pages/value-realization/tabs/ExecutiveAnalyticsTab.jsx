// VR tab 8 — the executive dashboard Section 14 specifies: expected, realized,
// validated and unvalidated benefit; net value; value by division, agent,
// strategic objective and benefit type; cost per outcome; Useful Intelligence
// per AED. Every figure comes from lib/calc.ts's named formulas.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { valueByDivision, valueByAgent, valueByStrategicObjective } from '../../../data/valueAggregates.ts'
import { categorical, axisText, gridColor } from '../../../lib/chartColors'
import { useChartMode } from '../../../lib/useChartMode'
import { KpiCard } from '../../../components/KpiCard.jsx'
import { Aed } from '../../../dewa/Aed.jsx'
import { ValueTag } from '../../../dewa/ValueTag.jsx'

function MoneyCard({ label, amount, tag, note, signed = false }) {
  return (
    <Card padding={4}>
      <VStack gap={2}>
        <Text size="sm" color="secondary" weight="medium">{label}</Text>
        <div className="kpi-value"><Aed aed={amount} compact signed={signed} /></div>
        <HStack justify="between" align="center">
          <Text size="sm" color="secondary">{note}</Text>
          <ValueTag tag={tag} />
        </HStack>
      </VStack>
    </Card>
  )
}

function HorizontalBars({ title, subtitle, data, dataKey, labelKey, color }) {
  const mode = useChartMode()
  if (data.length === 0) {
    return <Card padding={4}><EmptyState title={title} description="No records in scope yet." /></Card>
  }
  return (
    <Card padding={4}>
      <VStack gap={1} style={{ marginBottom: 'var(--spacing-3)' }}>
        <Text weight="semibold">{title}</Text>
        <Text size="sm" color="secondary">{subtitle}</Text>
      </VStack>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: axisText(mode) }} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
          <YAxis type="category" dataKey={labelKey} tick={{ fontSize: 11, fill: axisText(mode) }} width={170} />
          <Tooltip
            formatter={(v) => [`AED ${Number(v).toLocaleString()}`, 'Net value']}
            contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
          />
          <Bar isAnimationActive={false} dataKey={dataKey} name="Net value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function ExecutiveAnalyticsTab({ summary }) {
  const mode = useChartMode()
  const c = categorical(mode)
  const byDivision = valueByDivision()

  return (
    <VStack gap={5}>
      <div className="auto-grid" style={{ '--min': '230px' }}>
        <MoneyCard label="Expected benefit" amount={summary.expectedBenefit} tag="Estimated" note="Approved targets" />
        <MoneyCard label="Realized benefit" amount={summary.realizedBenefit} tag="Observed" note="Actual results to date" />
        <MoneyCard label="Validated benefit" amount={summary.validatedBenefit} tag="Validated" note="Past all validation gates" />
        <MoneyCard label="Unvalidated benefit" amount={summary.unvalidatedBenefit} tag="Estimated" note="Still in the workflow" />
        <MoneyCard label="Net value" amount={summary.netValue} tag="Validated" note="Validated benefit less AI cost" signed />
        <MoneyCard label="Total AI cost" amount={summary.totalAiCost} tag="Verified" note="All eleven cost categories" />
      </div>

      <div className="auto-grid" style={{ '--min': '230px' }}>
        <KpiCard
          label="AI value realization"
          value={summary.valueRealizationPct}
          suffix="%"
          tag="Validated"
          definition="Validated realized benefit / approved target benefit (requirements doc Section 14.2)."
          source="VR records"
        />
        <KpiCard
          label="Cost per verified hour released"
          value={summary.costPerVerifiedHourReleased}
          tag="Verified"
          definition="Total AI cost / verified human hours released, evidenced from the Work Contribution Ledger."
          source="VR records joined to the ledger"
        />
        <KpiCard
          label="Cost per outcome"
          value={summary.costPerOutcome}
          tag="Verified"
          definition="Total AI cost / validated records that met or beat their target."
          source="VR records"
        />
        <KpiCard
          label="Useful Intelligence per AED"
          value={summary.usefulIntelligencePerAed}
          format={{ maximumFractionDigits: 5 }}
          tag="Verified"
          definition="Successful business outcomes / total AI cost (requirements doc Section 14.2)."
          source="VR records"
        />
      </div>

      <Card padding={4}>
        <VStack gap={1} style={{ marginBottom: 'var(--spacing-3)' }}>
          <Text weight="semibold">Benefit and cost by division</Text>
          <Text size="sm" color="secondary">Gross benefit against the AI cost booked to deliver it.</Text>
        </VStack>
        {byDivision.length === 0 ? (
          <EmptyState title="No division data" description="No VR record resolves to a division yet." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDivision} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor(mode)} vertical={false} />
              <XAxis dataKey="division" tick={{ fontSize: 11, fill: axisText(mode) }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: axisText(mode) }} width={54} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
              <Tooltip
                formatter={(v, name) => [`AED ${Number(v).toLocaleString()}`, name]}
                contentStyle={{ background: 'var(--color-background-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar isAnimationActive={false} dataKey="benefit" name="Gross benefit" fill={c[0]} radius={[4, 4, 0, 0]} maxBarSize={38} />
              <Bar isAnimationActive={false} dataKey="cost" name="AI cost" fill={c[1]} radius={[4, 4, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="auto-grid" style={{ '--min': '380px' }}>
        <HorizontalBars
          title="Net value by agent" subtitle="Which digital workers are carrying the portfolio."
          data={valueByAgent()} dataKey="net" labelKey="agent" color={c[2]}
        />
        <HorizontalBars
          title="Net value by strategic objective" subtitle="Where AI value lands against DEWA's strategy."
          data={valueByStrategicObjective()} dataKey="net" labelKey="objective" color={c[6]}
        />
      </div>
    </VStack>
  )
}
