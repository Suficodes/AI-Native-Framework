// Harnesses tab — the agent's assigned harness (requirements doc Section
// 8). Full harness detail/designer lands in the Harness Engineering module
// (Step 7); this tab shows the summary and links there.
import { useNavigate } from 'react-router-dom'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { harnessForAgent } from '../../../data/agentsAggregates.ts'
import { employeeName } from '../../../data/lookups.ts'

export function HarnessesTab({ agent }) {
  const navigate = useNavigate()
  const harness = harnessForAgent(agent)

  if (!harness) return <EmptyState title="No harness assigned" description="This agent has no harness on record yet." />

  return (
    <Card padding={4}>
      <VStack gap={4}>
        <div>
          <Text
            weight="semibold" size="lg" color="accent"
            onClick={() => navigate(`/harness-engineering/${harness.id}`)}
            role="button" tabIndex={0} style={{ cursor: 'pointer' }}
          >
            {harness.name}
          </Text>
          <Text color="secondary" size="sm">v{harness.version}</Text>
        </div>
        <MetadataList columns={3}>
          <MetadataListItem label="Status"><Badge label={harness.status} variant="info" /></MetadataListItem>
          <MetadataListItem label="Business owner">{employeeName(harness.businessOwnerId) ?? '—'}</MetadataListItem>
          <MetadataListItem label="Technical owner">{employeeName(harness.technicalOwnerId) ?? '—'}</MetadataListItem>
          <MetadataListItem label="Confidence threshold">{Math.round(harness.confidenceThreshold * 100)}%</MetadataListItem>
          <MetadataListItem label="Retry limit">{harness.retryLimits}</MetadataListItem>
          <MetadataListItem label="Token limit">{harness.tokenLimit.toLocaleString()}</MetadataListItem>
          <MetadataListItem label="Kill switch">{harness.killSwitchEnabled ? 'Enabled' : 'Disabled'}</MetadataListItem>
        </MetadataList>
      </VStack>
    </Card>
  )
}
