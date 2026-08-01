// Token Usage tab — this agent's token/cost record plus its harness-level
// breakdown (requirements doc Section 18: token economics).
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Aed } from '../../../dewa/Aed.jsx'
import { tokenUsageForAgent } from '../../../data/agentsAggregates.ts'

export function TokenUsageTab({ agent }) {
  const { agentRecord, harnessRecords } = tokenUsageForAgent(agent.id)
  if (!agentRecord) return <EmptyState title="No token usage recorded" description="This agent has no token usage record yet." />

  return (
    <VStack gap={5}>
      <Card padding={4}>
        <MetadataList columns={3}>
          <MetadataListItem label="Model">{agentRecord.model}</MetadataListItem>
          <MetadataListItem label="Outcome"><Badge label={agentRecord.outcome} variant={agentRecord.outcome === 'Success' ? 'success' : agentRecord.outcome === 'Failure' ? 'error' : 'warning'} /></MetadataListItem>
          <MetadataListItem label="Human intervention">{agentRecord.humanIntervention ? 'Yes' : 'No'}</MetadataListItem>
          <MetadataListItem label="Input tokens">{agentRecord.inputTokens.toLocaleString()}</MetadataListItem>
          <MetadataListItem label="Output tokens">{agentRecord.outputTokens.toLocaleString()}</MetadataListItem>
          <MetadataListItem label="Cached tokens">{agentRecord.cachedTokens.toLocaleString()}</MetadataListItem>
          <MetadataListItem label="Reasoning units">{agentRecord.reasoningUnits.toLocaleString()}</MetadataListItem>
          <MetadataListItem label="Retrieval calls">{agentRecord.retrievalCalls}</MetadataListItem>
          <MetadataListItem label="Tool calls">{agentRecord.toolCalls}</MetadataListItem>
          <MetadataListItem label="Retries">{agentRecord.retries}</MetadataListItem>
          <MetadataListItem label="Latency">{agentRecord.latencyMs} ms</MetadataListItem>
          <MetadataListItem label="Cost"><Aed usd={agentRecord.cost} /></MetadataListItem>
        </MetadataList>
      </Card>

      {harnessRecords.length > 0 && (
        <Card padding={4}>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-3)' }}>Harness-level breakdown</Text>
          <VStack gap={2}>
            {harnessRecords.map((r) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text size="sm">{r.refLabel}</Text>
                <Text size="sm" color="secondary"><Aed usd={r.cost} /> · {(r.inputTokens + r.outputTokens).toLocaleString()} tokens</Text>
              </div>
            ))}
          </VStack>
        </Card>
      )}
    </VStack>
  )
}
