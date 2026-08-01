// Performance tab — the 7-dimension Agent Performance Index (requirements
// doc Section 12) plus the underlying KPIs for this agent's latest period.
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { ValueTag } from '../../../dewa/ValueTag.jsx'
import { Aed } from '../../../dewa/Aed.jsx'
import { performanceForAgent } from '../../../data/agentsAggregates.ts'

const RESULT_VARIANT = {
  ExceedsExpectations: 'success', MeetsExpectations: 'info', NeedsOptimization: 'warning',
  Restricted: 'warning', Suspended: 'error', Retired: 'neutral',
}

const INDEX_LABELS = {
  businessOutcome: 'Business outcome', quality: 'Quality', productivity: 'Productivity',
  reliability: 'Reliability', humanCollaboration: 'Human collaboration',
  costEfficiency: 'Cost efficiency', complianceAndSafety: 'Compliance & safety',
}

export function PerformanceTab({ agent }) {
  const record = performanceForAgent(agent.id)
  if (!record) return <EmptyState title="No performance record yet" description="This agent has no performance record for the current period." />

  return (
    <VStack gap={5}>
      <Card padding={4}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
          <Text weight="semibold">Agent Performance Index — {record.period}</Text>
          <Badge label={record.result} variant={RESULT_VARIANT[record.result]} />
        </div>
        <MetadataList columns={4}>
          {Object.entries(INDEX_LABELS).map(([key, label]) => (
            <MetadataListItem key={key} label={label}>{record.index[key]}</MetadataListItem>
          ))}
          <MetadataListItem label="Weighted score">{record.index.weightedScore}</MetadataListItem>
        </MetadataList>
      </Card>

      <Card padding={4}>
        <MetadataList columns={3}>
          <MetadataListItem label="Successful completion rate">{record.successfulCompletionRatePct}%</MetadataListItem>
          <MetadataListItem label="Accuracy">{record.accuracyPct}%</MetadataListItem>
          <MetadataListItem label="First-time-right">{record.firstTimeRightPct}%</MetadataListItem>
          <MetadataListItem label="SLA compliance">{record.slaCompliancePct}%</MetadataListItem>
          <MetadataListItem label="Reliability">{record.reliabilityPct}%</MetadataListItem>
          <MetadataListItem label="Human override rate">{record.humanOverrideRatePct}%</MetadataListItem>
          <MetadataListItem label="Exception rate">{record.exceptionRatePct}%</MetadataListItem>
          <MetadataListItem label="Escalation rate">{record.escalationRatePct}%</MetadataListItem>
          <MetadataListItem label="Token efficiency">{record.tokenEfficiency}%</MetadataListItem>
          <MetadataListItem label="Cost per successful outcome"><Aed aed={record.costPerSuccessfulOutcome} /></MetadataListItem>
          <MetadataListItem label="Compliance score">{record.complianceScore}</MetadataListItem>
          <MetadataListItem label="Value generated">
            <Aed aed={record.valueGenerated.value} /> <ValueTag tag={record.valueGenerated.tag} />
          </MetadataListItem>
        </MetadataList>
      </Card>
    </VStack>
  )
}
