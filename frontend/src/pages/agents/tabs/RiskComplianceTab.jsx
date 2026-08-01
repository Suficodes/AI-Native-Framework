// Risk & Compliance tab — compliance/override metrics, budget guardrails,
// and any open incidents for this agent.
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Aed } from '../../../dewa/Aed.jsx'
import { budgetControlForAgent, incidentsForAgent } from '../../../data/agentsAggregates.ts'
import { formatDate } from '../../../utils/format.js'

const SEVERITY_VARIANT = { Low: 'neutral', Medium: 'warning', High: 'warning', Critical: 'error' }

export function RiskComplianceTab({ agent }) {
  const budget = budgetControlForAgent(agent.id)
  const incidents = incidentsForAgent(agent.id)

  return (
    <VStack gap={5}>
      <Card padding={4}>
        <MetadataList columns={3}>
          <MetadataListItem label="Compliance score">{agent.complianceScore}</MetadataListItem>
          <MetadataListItem label="Human override rate">{agent.humanOverrideRatePct}%</MetadataListItem>
          <MetadataListItem label="Quality score">{agent.qualityScore}</MetadataListItem>
        </MetadataList>
      </Card>

      {budget && (
        <Card padding={4}>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-3)' }}>Budget controls</Text>
          <MetadataList columns={3}>
            <MetadataListItem label="Annual budget"><Aed usd={budget.annualBudget} /></MetadataListItem>
            <MetadataListItem label="Monthly budget"><Aed usd={budget.monthlyBudget} /></MetadataListItem>
            <MetadataListItem label="Per-transaction limit"><Aed usd={budget.perTransactionLimit} /></MetadataListItem>
            <MetadataListItem label="Retry limit">{budget.retryLimit}</MetadataListItem>
            <MetadataListItem label="Alert level">{budget.alertLevelPct}%</MetadataListItem>
            <MetadataListItem label="Suspension threshold">{budget.suspensionThresholdPct}%</MetadataListItem>
            <MetadataListItem label="Approved models">{budget.approvedModels.join(', ')}</MetadataListItem>
          </MetadataList>
        </Card>
      )}

      <Card padding={4}>
        <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>Incidents ({incidents.length})</Text>
        {incidents.length === 0 ? (
          <Text size="sm" color="secondary">No incidents on record.</Text>
        ) : (
          <VStack gap={2}>
            {incidents.map((i) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size="sm">{i.title}</Text>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Text size="sm" color="secondary">{formatDate(i.openedAt)}</Text>
                  <Badge label={i.severity} variant={SEVERITY_VARIANT[i.severity]} />
                  <Badge label={i.status} variant="neutral" />
                </div>
              </div>
            ))}
          </VStack>
        )}
      </Card>
    </VStack>
  )
}
