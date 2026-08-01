// Playbook section 12 — token budget. Consumption and budget for the agents in
// scope, plus the control metric the doc cares about: cost per verified hour
// released (lib/calc.ts), not cost per prompt.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { KpiCard } from '../../../components/KpiCard.jsx'
import { Aed } from '../../../dewa/Aed.jsx'
import { ValueTag } from '../../../dewa/ValueTag.jsx'
import { DewaButton } from '../../../dewa/DewaButton.jsx'
import { GuidanceList } from '../PlaybookSection.jsx'
import { formatNumber } from '../../../utils/format.js'

export function TokenBudgetSection({ playbook }) {
  const navigate = useNavigate()
  const budget = playbook.tokenBudget

  return (
    <VStack gap={4}>
      <div className="auto-grid" style={{ '--min': '210px' }}>
        <Card padding={4}>
          <VStack gap={2}>
            <Text size="sm" color="secondary" weight="medium">Consumption to date</Text>
            <div className="kpi-value"><Aed aed={budget.periodCost} compact /></div>
            <HStack justify="between" align="center">
              <Text size="sm" color="secondary">Agent-level token cost</Text>
              <ValueTag tag="Observed" />
            </HStack>
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={2}>
            <Text size="sm" color="secondary" weight="medium">Approved annual budget</Text>
            <div className="kpi-value"><Aed aed={budget.annualBudget} compact /></div>
            <HStack justify="between" align="center">
              <Text size="sm" color="secondary">Monthly <Aed aed={budget.monthlyBudget} compact /></Text>
              <ValueTag tag="Verified" />
            </HStack>
          </VStack>
        </Card>
        <KpiCard
          label="Cost per verified hour released"
          value={budget.costPerVerifiedHourReleased}
          tag="Verified"
          definition="Total AI cost / verified human hours released (requirements doc Section 14.2)."
          source="Token usage joined to the Work Contribution Ledger"
        />
        <KpiCard
          label="Budget utilization"
          value={budget.utilizationPct}
          suffix="%"
          tag="Observed"
          definition="Consumption to date against the approved annual budget for the agents in scope."
          source="Token usage and budget controls"
        />
      </div>

      <Card padding={4}>
        <VStack gap={3}>
          <Text weight="semibold">Token composition</Text>
          <ProgressBar value={budget.utilizationPct} label={`Annual budget consumed — ${budget.utilizationPct}%`} hasValueLabel variant={budget.utilizationPct >= 80 ? 'error' : budget.utilizationPct >= 60 ? 'warning' : 'success'} />
          <HStack gap={5} style={{ flexWrap: 'wrap' }}>
            <VStack gap={0}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>Input tokens</Text>
              <Text size="sm" weight="semibold" className="mono">{formatNumber(budget.inputTokens)}</Text>
            </VStack>
            <VStack gap={0}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>Output tokens</Text>
              <Text size="sm" weight="semibold" className="mono">{formatNumber(budget.outputTokens)}</Text>
            </VStack>
            <VStack gap={0}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>Cached tokens</Text>
              <Text size="sm" weight="semibold" className="mono">{formatNumber(budget.cachedTokens)}</Text>
            </VStack>
          </HStack>
        </VStack>
      </Card>

      <Card padding={4}><GuidanceList label="Budget guidance" items={budget.guidance} /></Card>

      <div>
        <DewaButton label="Open Token Economics" variant="secondary" onClick={() => navigate('/token-economics')} />
      </div>
    </VStack>
  )
}
