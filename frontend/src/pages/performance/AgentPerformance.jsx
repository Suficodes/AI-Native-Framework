// Performance module — Agent Performance (requirements doc Section 13.A):
// the 13 KPIs, the 7-dimension Agent Performance Index, the six result
// outcomes, and the per-agent register.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { ExportButton } from '../../components/ExportButton.jsx'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getAgentPerformance } from '../../data/mockApi'
import {
  agentPerformanceKpis, agentPerformanceRows, agentResultDistribution,
  PERFORMANCE_RESULT_LABELS,
} from '../../data/performanceAggregates.ts'
import { KpiCard } from '../../components/KpiCard.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { PerformanceTabs } from './PerformanceTabs.jsx'
import { AgentPerformanceIndexCard } from './AgentPerformanceIndexCard.jsx'
import { ResultDistributionChart } from './ResultDistributionChart.jsx'

const RESULT_VARIANT = {
  ExceedsExpectations: 'success', MeetsExpectations: 'info', NeedsOptimization: 'warning',
  Restricted: 'error', Suspended: 'error', Retired: 'neutral',
}

export default function AgentPerformance() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { getAgentPerformance().then(() => setLoaded(true)) }, [])

  const kpis = loaded ? agentPerformanceKpis() : null
  const rows = loaded ? agentPerformanceRows() : []
  const distribution = loaded ? agentResultDistribution() : []

  const columns = [
    {
      key: 'agentName',
      header: 'Agent',
      width: proportional(2, { minWidth: 190 }),
      renderCell: (row) => (
        <Text
          size="sm" weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/agents/${row.agentId}`)}
        >
          {row.agentName}
        </Text>
      ),
    },
    { key: 'index', header: 'Index', width: pixel(80), renderCell: (row) => <Text size="sm" weight="semibold" className="mono">{row.index.weightedScore}</Text> },
    { key: 'result', header: 'Result', width: pixel(160), renderCell: (row) => <Badge label={PERFORMANCE_RESULT_LABELS[row.result]} variant={RESULT_VARIANT[row.result]} /> },
    { key: 'successfulCompletionRatePct', header: 'Completion', width: pixel(100), renderCell: (row) => <Text size="sm">{row.successfulCompletionRatePct}%</Text> },
    { key: 'accuracyPct', header: 'Accuracy', width: pixel(90), renderCell: (row) => <Text size="sm">{row.accuracyPct}%</Text> },
    { key: 'firstTimeRightPct', header: 'First-time-right', width: pixel(120), renderCell: (row) => <Text size="sm">{row.firstTimeRightPct}%</Text> },
    { key: 'slaCompliancePct', header: 'SLA', width: pixel(80), renderCell: (row) => <Text size="sm">{row.slaCompliancePct}%</Text> },
    { key: 'humanOverrideRatePct', header: 'Override', width: pixel(90), renderCell: (row) => <Text size="sm">{row.humanOverrideRatePct}%</Text> },
    { key: 'exceptionRatePct', header: 'Exceptions', width: pixel(100), renderCell: (row) => <Text size="sm">{row.exceptionRatePct}%</Text> },
    { key: 'costPerSuccessfulOutcome', header: 'Cost / outcome', width: pixel(130), renderCell: (row) => <Text size="sm"><Aed aed={row.costPerSuccessfulOutcome} /></Text> },
    { key: 'valueGenerated', header: 'Value generated', width: pixel(140), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.valueGenerated.value} compact /></Text> },
  ]

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Performance</Heading>
        <Text color="secondary" size="lg">How the digital workforce is performing, and against which weighted dimensions.</Text>
        <div style={{ marginTop: 'var(--spacing-3)' }}>
          <ExportButton filename="agent-performance" columns={[{key:'agentId',header:'Agent ID'},{key:'agentName',header:'Agent'},{key:'result',header:'Result'},{key:'successfulCompletionRatePct',header:'Completion %'},{key:'accuracyPct',header:'Accuracy %'},{key:'slaCompliancePct',header:'SLA %'},{key:'humanOverrideRatePct',header:'Override %'},{key:'costPerSuccessfulOutcome',header:'Cost per outcome'}]} rows={rows} />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)' }}><PerformanceTabs active="agents" /></div>

      {!kpis ? (
        <Skeleton height={520} radius={2} />
      ) : (
        <VStack gap={6}>
          <div className="auto-grid" style={{ '--min': '200px' }}>
            <KpiCard label="Agents reviewed" value={kpis.agentCount} tag="Observed" definition="Agents with a performance record for the current review period." period="Q3 2026" />
            <KpiCard label="Fleet index score" value={kpis.indexScore} tag="Observed" definition="Average weighted Agent Performance Index across all reviewed agents." />
            <KpiCard label="Successful completion" value={kpis.successfulCompletionRatePct} suffix="%" tag="Observed" definition="Share of assigned work items the agent completed successfully." />
            <KpiCard label="Accuracy" value={kpis.accuracyPct} suffix="%" tag="Observed" definition="Share of agent output accepted as factually correct on review." />
            <KpiCard label="First-time-right" value={kpis.firstTimeRightPct} suffix="%" tag="Observed" definition="Share of output accepted without any human edit." />
            <KpiCard label="Quality score" value={kpis.qualityScore} tag="Observed" definition="Evaluation-suite quality score averaged across the fleet." />
            <KpiCard label="SLA compliance" value={kpis.slaCompliancePct} suffix="%" tag="Observed" definition="Share of work items completed inside the agreed service level." />
            <KpiCard label="Reliability" value={kpis.reliabilityPct} suffix="%" tag="Observed" definition="Share of runs completing without a technical failure." />
            <KpiCard label="Human override rate" value={kpis.humanOverrideRatePct} suffix="%" tag="Observed" definition="Share of agent output a human amended or rejected. Lower is better." />
            <KpiCard label="Exception rate" value={kpis.exceptionRatePct} suffix="%" tag="Observed" definition="Share of items that fell outside the approved boundary. Lower is better." />
            <KpiCard label="Escalation rate" value={kpis.escalationRatePct} suffix="%" tag="Observed" definition="Share of items escalated to a named human role. Lower is better." />
            <KpiCard label="Token efficiency" value={kpis.tokenEfficiency} tag="Observed" definition="Useful output per token consumed, indexed 0–100." />
            <KpiCard label="Compliance score" value={kpis.complianceScore} tag="Verified" definition="Responsible-AI and guardrail compliance score. Below 60 restricts the agent." />
            <KpiCard label="Cost per successful outcome" value={kpis.costPerSuccessfulOutcome} currency decimals={2} tag="Observed" definition="Average fully-loaded cost of one accepted business outcome, across the agent fleet." />
            <KpiCard label="Value generated" value={kpis.valueGenerated} currency compact tag="Validated" definition="Total business value attributed to the agent fleet this review period." />
          </div>

          <div className="auto-grid" style={{ '--min': '340px' }}>
            <AgentPerformanceIndexCard indexScore={kpis.indexScore} />
            <ResultDistributionChart data={distribution} />
          </div>

          <div>
            <Heading level={2} type="display-4" style={{ margin: '0 0 var(--spacing-3)' }}>Agent performance register</Heading>
            <Card padding={0}>
              <div style={{ overflowX: 'auto' }}>
                <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
              </div>
            </Card>
          </div>
        </VStack>
      )}
    </div>
  )
}
