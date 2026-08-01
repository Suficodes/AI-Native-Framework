// Playbook section 7 — buy / configure / build decision. The criteria are
// doctrine; the count beside each is how many of THIS scope's recommendations
// the decision rule (data/playbookRecommendations.ts) landed on it.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { GuidanceList } from '../PlaybookSection.jsx'

const DECISION_VARIANT = { Buy: 'success', Configure: 'info', Build: 'warning' }

export function SourcingSection({ playbook }) {
  return (
    <div className="auto-grid" style={{ '--min': '300px' }}>
      {playbook.sourcingCriteria.map((criterion) => (
        <Card key={criterion.decision} padding={4}>
          <VStack gap={3}>
            <HStack justify="between" align="center">
              <Text weight="semibold" size="lg">{criterion.decision}</Text>
              <Badge
                label={`${criterion.recommendedCount} in scope`}
                variant={criterion.recommendedCount > 0 ? DECISION_VARIANT[criterion.decision] : 'neutral'}
              />
            </HStack>
            <GuidanceList label="Choose this when" items={criterion.whenToUse} />
            <GuidanceList label="Platforms" items={criterion.platforms} />
          </VStack>
        </Card>
      ))}
    </div>
  )
}
