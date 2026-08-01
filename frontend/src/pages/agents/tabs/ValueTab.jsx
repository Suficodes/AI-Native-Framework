// Value tab — cost vs. value generated, plus any Value Realization records
// this agent is tied to (requirements doc Section 17).
import { useNavigate } from 'react-router-dom'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { ValueTag } from '../../../dewa/ValueTag.jsx'
import { Aed } from '../../../dewa/Aed.jsx'
import { valueRealizationForAgent } from '../../../data/agentsAggregates.ts'

export function ValueTab({ agent }) {
  const navigate = useNavigate()
  const vrRecords = valueRealizationForAgent(agent.id)
  const netValue = agent.valueGenerated.value - agent.cost.value

  return (
    <VStack gap={5}>
      <Card padding={4}>
        <MetadataList columns={3}>
          <MetadataListItem label="Cost"><Aed aed={agent.cost.value} /> <ValueTag tag={agent.cost.tag} /></MetadataListItem>
          <MetadataListItem label="Value generated"><Aed aed={agent.valueGenerated.value} /> <ValueTag tag={agent.valueGenerated.tag} /></MetadataListItem>
          <MetadataListItem label="Net value"><Aed aed={netValue} signed /></MetadataListItem>
        </MetadataList>
      </Card>

      {vrRecords.length > 0 && (
        <Card padding={4}>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-3)' }}>Value Realization records ({vrRecords.length})</Text>
          <VStack gap={2}>
            {vrRecords.map((v) => (
              <div
                key={v.id} onClick={() => navigate(`/value-realization/${v.id}`)} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/value-realization/${v.id}`) }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <Text size="sm">{v.benefitType}</Text>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Text size="sm" color="secondary"><Aed aed={v.netBenefit} /></Text>
                  <Badge label={v.validationStatus} variant="neutral" />
                </div>
              </div>
            ))}
          </VStack>
        </Card>
      )}
    </VStack>
  )
}
