// Executive Overview — the CAIO dashboard (requirements doc Section 4).
// Route: "/" (see router.jsx).
import { useEffect, useState } from 'react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { getOrganization } from '../../data/mockApi'
import { KpiGrid } from './KpiGrid.jsx'
import { AttentionPanel } from './AttentionPanel.jsx'
import { WorkforceDistributionChart } from './charts/WorkforceDistributionChart.jsx'
import { AgenticityByDivisionChart } from './charts/AgenticityByDivisionChart.jsx'
import { ValueVsCostChart } from './charts/ValueVsCostChart.jsx'
import { AgentPerformanceChart } from './charts/AgentPerformanceChart.jsx'
import { StrategicContributionChart } from './charts/StrategicContributionChart.jsx'
import { InitiativeStatusChart } from './charts/InitiativeStatusChart.jsx'
import { TokenCostByModelChart } from './charts/TokenCostByModelChart.jsx'
import { QpComplianceChart } from './charts/QpComplianceChart.jsx'

export default function ExecutiveOverview() {
  // Awaiting a real (delayed) mockApi call gates the whole dashboard behind
  // one genuine loading state, rather than each KPI/chart re-fetching —
  // matches how a real API-backed page would behave.
  const [ready, setReady] = useState(false)
  useEffect(() => { getOrganization().then(() => setReady(true)) }, [])

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <span className="eyebrow">CAIO Dashboard</span>
        <Heading level={1} type="display-3">Executive Overview</Heading>
        <Text color="secondary" size="lg">
          How much of DEWA runs on human, human+agent, and agent-only work — and what it is producing.
        </Text>
      </div>

      {!ready ? (
        <VStack gap={4}>
          <div className="auto-grid" style={{ '--min': '230px' }}>
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={110} radius={2} />)}
          </div>
          <Skeleton height={320} radius={2} />
        </VStack>
      ) : (
        <VStack gap={6}>
          <KpiGrid />

          <div>
            <Heading level={2} type="display-4" style={{ margin: '0 0 var(--spacing-4)' }}>Enterprise Charts</Heading>
            <div className="auto-grid" style={{ '--min': '420px' }}>
              <WorkforceDistributionChart />
              <AgenticityByDivisionChart />
              <ValueVsCostChart />
              <AgentPerformanceChart />
              <StrategicContributionChart />
              <InitiativeStatusChart />
              <TokenCostByModelChart />
              <QpComplianceChart />
            </div>
          </div>

          <AttentionPanel />
        </VStack>
      )}
    </div>
  )
}
