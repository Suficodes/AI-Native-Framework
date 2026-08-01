// Playbook section 6 — recommended copilots and agents. Each card carries the
// exact ten fields the requirements doc lists for a recommendation: problem
// addressed, process supported, human role affected, expected AI contribution,
// required human controls, recommended platform, expected value, complexity,
// risk, delivery priority.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Aed } from '../../../dewa/Aed.jsx'
import { ValueTag } from '../../../dewa/ValueTag.jsx'
import { GuidanceList } from '../PlaybookSection.jsx'

const LEVEL_VARIANT = { Low: 'success', Medium: 'warning', High: 'error' }
const PRIORITY_VARIANT = { P1: 'error', P2: 'warning', P3: 'neutral' }
const MATURITY_VARIANT = { Live: 'success', 'In delivery': 'info', Proposed: 'neutral' }

export function RecommendedAgentsSection({ playbook }) {
  const navigate = useNavigate()
  const recommendations = playbook.recommendedAgents
  if (recommendations.length === 0) {
    return <EmptyState title="No recommendations yet" description="No AI initiative is registered against anything in this scope." />
  }

  return (
    <VStack gap={4}>
      {recommendations.map((rec) => (
        <Card key={rec.id} padding={4}>
          <VStack gap={3}>
            <HStack justify="between" align="center" gap={3} style={{ flexWrap: 'wrap' }}>
              <Text weight="semibold" size="lg">{rec.name}</Text>
              <HStack gap={2} align="center">
                <Badge label={`Priority ${rec.deliveryPriority}`} variant={PRIORITY_VARIANT[rec.deliveryPriority]} />
                <Badge label={rec.maturity} variant={MATURITY_VARIANT[rec.maturity]} />
                <Badge label={rec.sourcing} variant="info" />
              </HStack>
            </HStack>

            <VStack gap={1}>
              <Text size="sm" weight="semibold" color="secondary">Problem addressed</Text>
              <Text size="sm">{rec.problemAddressed}</Text>
            </VStack>

            <MetadataList columns={3}>
              <MetadataListItem label="Process supported">
                {rec.processId ? (
                  <Text
                    color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/processes/agenticity/${rec.processId}`)}
                  >
                    {rec.processSupported}
                  </Text>
                ) : rec.processSupported}
              </MetadataListItem>
              <MetadataListItem label="Human role affected">{rec.humanRoleAffected}</MetadataListItem>
              <MetadataListItem label="Recommended platform">{rec.recommendedPlatform}</MetadataListItem>
              <MetadataListItem label="Expected AI contribution">{rec.expectedAiContribution}</MetadataListItem>
              <MetadataListItem label="Expected value">
                <HStack gap={2} align="center">
                  <Aed aed={rec.expectedValue.value} compact />
                  <ValueTag tag={rec.expectedValue.tag} />
                </HStack>
              </MetadataListItem>
              <MetadataListItem label="Complexity / Risk">
                <HStack gap={2} align="center">
                  <Badge label={`Complexity ${rec.complexity}`} variant={LEVEL_VARIANT[rec.complexity]} />
                  <Badge label={`Risk ${rec.risk}`} variant={LEVEL_VARIANT[rec.risk]} />
                </HStack>
              </MetadataListItem>
            </MetadataList>

            <GuidanceList label="Required human controls" items={rec.requiredHumanControls} />

            <HStack gap={3} align="center" style={{ flexWrap: 'wrap' }}>
              {rec.agentId && (
                <Text
                  size="sm" color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/agents/${rec.agentId}`)}
                >
                  Already served by a registered agent →
                </Text>
              )}
              {rec.initiativeId && (
                <Text
                  size="sm" color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/ai-initiatives/${rec.initiativeId}`)}
                >
                  Open the AI initiative →
                </Text>
              )}
            </HStack>
          </VStack>
        </Card>
      ))}
    </VStack>
  )
}
