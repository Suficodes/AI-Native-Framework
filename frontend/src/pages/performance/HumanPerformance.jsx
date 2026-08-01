// Performance module — Human AI-Native Performance (requirements doc Section
// 13.B). The section opens with "Do not measure employees only by prompt
// count", so there is deliberately no prompt-count metric anywhere on this
// page: the nine dimensions are all about output, supervision, and outcomes.
import { useEffect, useState } from 'react'
import { Heading } from '@astryxdesign/core/Heading'
import { ExportButton } from '../../components/ExportButton.jsx'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getHumanPerformance } from '../../data/mockApi'
import { humanPerformanceKpis, humanPerformanceRows, capacityByDivision } from '../../data/performanceAggregates.ts'
import { KpiCard } from '../../components/KpiCard.jsx'
import { PerformanceTabs } from './PerformanceTabs.jsx'
import { CapacityChart } from './CapacityChart.jsx'

const COMPLIANCE_VARIANT = { Compliant: 'success', UnderReview: 'warning', NonCompliant: 'error' }

export default function HumanPerformance() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { getHumanPerformance().then(() => setLoaded(true)) }, [])

  const kpis = loaded ? humanPerformanceKpis() : null
  const rows = loaded ? humanPerformanceRows() : []
  const capacity = loaded ? capacityByDivision() : []

  const columns = [
    { key: 'employeeName', header: 'Employee', width: proportional(1.6, { minWidth: 160 }), renderCell: (row) => <Text size="sm" weight="medium">{row.employeeName}</Text> },
    { key: 'positionTitle', header: 'Position', width: proportional(1.8, { minWidth: 170 }), renderCell: (row) => <Text size="sm" color="secondary">{row.positionTitle}</Text> },
    { key: 'aiEnabledOutputQuality', header: 'Output quality', width: pixel(120), renderCell: (row) => <Text size="sm">{row.aiEnabledOutputQuality}</Text> },
    { key: 'effectiveCopilotAgentUse', header: 'Effective AI use', width: pixel(130), renderCell: (row) => <Text size="sm">{row.effectiveCopilotAgentUse}</Text> },
    { key: 'capacityReleasedHours', header: 'Released', width: pixel(96), renderCell: (row) => <Text size="sm" className="mono">{row.capacityReleasedHours} h</Text> },
    { key: 'capacityRedeployedHours', header: 'Redeployed', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{row.capacityRedeployedHours} h</Text> },
    { key: 'agentSupervisionEffectiveness', header: 'Supervision', width: pixel(110), renderCell: (row) => <Text size="sm">{row.agentSupervisionEffectiveness}</Text> },
    { key: 'exceptionHandlingScore', header: 'Exceptions', width: pixel(105), renderCell: (row) => <Text size="sm">{row.exceptionHandlingScore}</Text> },
    { key: 'processImprovementContributions', header: 'Improvements', width: pixel(120), renderCell: (row) => <Text size="sm">{row.processImprovementContributions}</Text> },
    { key: 'knowledgeContributionScore', header: 'Knowledge', width: pixel(105), renderCell: (row) => <Text size="sm">{row.knowledgeContributionScore}</Text> },
    { key: 'businessOutcomesScore', header: 'Outcomes', width: pixel(100), renderCell: (row) => <Text size="sm">{row.businessOutcomesScore}</Text> },
    { key: 'responsibleAiCompliance', header: 'Responsible AI', width: pixel(140), renderCell: (row) => <Badge label={row.responsibleAiCompliance} variant={COMPLIANCE_VARIANT[row.responsibleAiCompliance]} /> },
  ]

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Performance</Heading>
        <Text color="secondary" size="lg">How people perform in an AI-native operating model — supervision, judgement, and outcomes.</Text>
        <div style={{ marginTop: 'var(--spacing-3)' }}>
          <ExportButton filename="human-performance" columns={[{key:'employeeName',header:'Employee'},{key:'positionTitle',header:'Position'},{key:'aiEnabledOutputQuality',header:'Output quality'},{key:'capacityReleasedHours',header:'Released hours'},{key:'capacityRedeployedHours',header:'Redeployed hours'},{key:'responsibleAiCompliance',header:'Responsible AI'}]} rows={rows} />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)' }}><PerformanceTabs active="humans" /></div>

      {!kpis ? (
        <Skeleton height={520} radius={2} />
      ) : (
        <VStack gap={6}>
          <Banner
            status="info"
            title="Employees are not measured by prompt count."
            description="Every dimension below is about the quality of AI-enabled output, the effectiveness of agent supervision, and the business outcome — never the volume of interactions with a tool."
          />

          <div className="auto-grid" style={{ '--min': '210px' }}>
            <KpiCard label="Employees reviewed" value={kpis.employeeCount} tag="Observed" definition="Employees with an AI-native performance record this period." period="Q3 2026" />
            <KpiCard label="AI-enabled output quality" value={kpis.aiEnabledOutputQuality} tag="Observed" definition="Quality of work produced with AI assistance, scored 0–100 on review." />
            <KpiCard label="Effective copilot and agent use" value={kpis.effectiveCopilotAgentUse} tag="Observed" definition="How effectively the employee applies available AI to the right work — not how often." />
            <KpiCard label="Capacity released" value={kpis.capacityReleasedHours} suffix=" h" tag="Verified" definition="Human hours freed by AI assistance, evidenced from the Work Contribution Ledger." />
            <KpiCard label="Capacity redeployed" value={kpis.capacityRedeployedHours} suffix=" h" tag="Observed" definition="Released hours actually reassigned to new work." />
            <KpiCard label="Redeployment rate" value={kpis.redeploymentRatePct} suffix="%" tag="Observed" definition="Redeployed hours as a share of released hours. Capacity released but never redeployed produces no business outcome." />
            <KpiCard label="Agent supervision effectiveness" value={kpis.agentSupervisionEffectiveness} tag="Observed" definition="How well the employee reviews, corrects, and improves the agents they supervise." />
            <KpiCard label="Exception handling" value={kpis.exceptionHandlingScore} tag="Observed" definition="Quality of judgement on the cases agents escalate." />
            <KpiCard label="Process improvements" value={kpis.processImprovementContributions} tag="Observed" definition="Accepted process or Quality Procedure improvements contributed this period." />
            <KpiCard label="Knowledge contribution" value={kpis.knowledgeContributionScore} tag="Observed" definition="Contribution to the approved knowledge the agents retrieve from." />
            <KpiCard label="Business outcomes" value={kpis.businessOutcomesScore} tag="Observed" definition="Contribution to the outcomes the role is accountable for." />
            <KpiCard label="Responsible AI compliance" value={kpis.compliantPct} suffix="%" tag="Verified" definition="Share of reviewed employees fully compliant with responsible-AI policy." />
          </div>

          <CapacityChart data={capacity} />

          <div>
            <Heading level={2} type="display-4" style={{ margin: '0 0 var(--spacing-3)' }}>Human AI-native performance register</Heading>
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
