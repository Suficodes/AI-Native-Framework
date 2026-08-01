// Token Economics module (requirements doc Section 15) — "a separate
// management module". The eleven KPI cards, the nine-level drill-down, the
// eight visualizations, and the budget-control register.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Selector } from '@astryxdesign/core/Selector'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { getTokenUsage } from '../../data/mockApi'
import {
  LATEST_PERIOD, enterpriseKpis, enterpriseRow, costByDivision, usageByModel,
  tokenTrend, costVsValueByDivision, agentConsumption, budgetVariance,
} from '../../data/tokenAggregates.ts'
import { TOKEN_PERIODS } from '../../data/types'
import { KpiCard } from '../../components/KpiCard.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { TokenHierarchy } from './TokenHierarchy.jsx'
import { BudgetControlsTable } from './BudgetControlsTable.jsx'
import {
  CostByDivisionChart, UsageByModelChart, TokenTrendChart, TokensVsOutcomesChart,
  CostVsValueChart, TopAgentsChart, RetryAgentsChart, BudgetVarianceChart,
} from './TokenCharts.jsx'

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All periods' },
  ...[...TOKEN_PERIODS].reverse().map((p) => ({ value: p, label: p })),
]

export default function TokenEconomics() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [period, setPeriod] = useState(LATEST_PERIOD)
  const [view, setView] = useState('overview')
  const [drillId, setDrillId] = useState(null)

  useEffect(() => { getTokenUsage().then(() => setLoaded(true)) }, [])

  // The drill-down always starts at the enterprise root of the selected period;
  // switching period resets it rather than stranding the user on a stale node.
  const chartPeriod = period === 'all' ? LATEST_PERIOD : period
  useEffect(() => { setDrillId(enterpriseRow(chartPeriod)?.id ?? null) }, [chartPeriod, loaded])

  if (!loaded) return <div className="page-band page-band--wide"><Skeleton height={560} radius={2} /></div>

  const kpis = enterpriseKpis(period)

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Token Economics</Heading>
        <Text color="secondary" size="lg">
          What the digital workforce consumes, what it returns, and whether it is inside budget — enterprise down to a single call.
        </Text>
      </div>

      <HStack gap={3} align="center" style={{ flexWrap: 'wrap', marginBottom: 'var(--spacing-5)' }}>
        <SegmentedControl value={view} onChange={setView} label="View">
          <SegmentedControlItem value="overview" label="Overview" />
          <SegmentedControlItem value="drill-down" label="Drill-down" />
          <SegmentedControlItem value="budgets" label="Budget controls" />
        </SegmentedControl>
        <Selector
          label="Reporting period" isLabelHidden size="sm" width={180}
          options={PERIOD_OPTIONS} value={period} onChange={setPeriod}
        />
      </HStack>

      {view === 'overview' && (
        <VStack gap={6}>
          <div className="auto-grid" style={{ '--min': '210px' }}>
            <KpiCard label="Total tokens" value={kpis.totalTokens} format={{ notation: 'compact', maximumFractionDigits: 1 }} tag="Observed" definition="Input plus output tokens across the selected period." period={period} />
            <KpiCard label="Total token cost" value={kpis.totalTokenCost} currency compact tag="Observed" definition="Billed model cost across the selected period, cached input billed at a reduced rate." period={period} />
            <KpiCard label="Average cost per transaction" value={kpis.avgCostPerTransaction} currency decimals={2} tag="Observed" definition="Total token cost / number of agent calls." period={period} />
            <KpiCard label="Cost per successful outcome" value={kpis.costPerSuccessfulOutcome} currency decimals={2} tag="Observed" definition="Total token cost / calls that produced an accepted business outcome." period={period} />
            <KpiCard label="Tokens per successful outcome" value={kpis.tokensPerSuccessfulOutcome} format={{ notation: 'compact', maximumFractionDigits: 1 }} tag="Observed" definition="Tokens consumed per accepted outcome — the efficiency measure that matters." period={period} />
            <KpiCard label="Wasted-token ratio" value={kpis.wastedTokenRatioPct} suffix="%" tag="Observed" definition="Tokens spent on retried attempts plus those attributable to failed calls, as a share of all tokens." period={period} />
            <KpiCard label="Retry-token ratio" value={kpis.retryTokenRatioPct} suffix="%" tag="Observed" definition="Tokens burned on retried attempts alone. A retry that will not succeed is pure cost." period={period} />
            <KpiCard label="Cache utilization" value={kpis.cacheUtilizationPct} suffix="%" tag="Observed" definition="Cached tokens as a share of input tokens — the cheapest available cost reduction." period={period} />
            <KpiCard label="Small-model routing rate" value={kpis.smallModelRoutingRatePct} suffix="%" tag="Observed" definition="Share of model spend routed to the approved cheaper models." period={period} />
            <KpiCard label="Value per million tokens" value={kpis.valuePerMillionTokens} currency tag="Estimated" definition="Attributed value divided by tokens consumed, per million tokens." period={period} />
            <KpiCard label="Budget consumption" value={kpis.budgetConsumptionPct} suffix="%" tag="Observed" definition="Spend against the approved budget for the same span of months." period={period} />
            <KpiCard label="Agent calls" value={kpis.transactionCount} format={{ notation: 'compact', maximumFractionDigits: 1 }} tag="Observed" definition="Total agent transactions in the selected period." period={period} />
          </div>

          <div className="auto-grid" style={{ '--min': '400px' }}>
            <TokenTrendChart data={tokenTrend()} />
            <TokensVsOutcomesChart data={tokenTrend()} />
            <CostByDivisionChart data={costByDivision(chartPeriod)} />
            <UsageByModelChart data={usageByModel(chartPeriod)} />
            <CostVsValueChart data={costVsValueByDivision(chartPeriod)} />
            <TopAgentsChart data={agentConsumption(chartPeriod)} />
            <RetryAgentsChart data={agentConsumption(chartPeriod)} />
            <BudgetVarianceChart data={budgetVariance()} />
          </div>
        </VStack>
      )}

      {view === 'drill-down' && (
        drillId ? (
          <TokenHierarchy
            rowId={drillId}
            onSelect={setDrillId}
            onOpenTransaction={(txId) => navigate(`/token-economics/transactions/${txId}`)}
          />
        ) : (
          <EmptyState title="No ledger for this period" description={`The token ledger has no enterprise row for ${chartPeriod}.`} />
        )
      )}

      {view === 'budgets' && <BudgetControlsTable rows={budgetVariance()} />}
    </div>
  )
}
