// Playbook section 9 — harness requirements. The six baseline requirements
// every DEWA harness must meet, each scored against the harnesses actually in
// scope so the section states compliance rather than aspiration.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'

const STATUS_VARIANT = { Met: 'success', Partial: 'warning', NotMet: 'error' }
const STATUS_LABEL = { Met: 'Met', Partial: 'Partially met', NotMet: 'Not met' }
const CATEGORY_LABEL = {
  Structure: 'Structure',
  Guardrails: 'Guardrails',
  HumanControl: 'Human control',
  Evaluation: 'Evaluation',
  Observability: 'Observability',
  CostControl: 'Cost control',
}

export function HarnessRequirementsSection({ playbook }) {
  return (
    <Card padding={4}>
      <VStack gap={3}>
        {playbook.harnessRequirements.map((req) => (
          <HStack
            key={req.requirement} justify="between" align="start" gap={3}
            style={{ flexWrap: 'wrap', paddingBottom: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' }}
          >
            <VStack gap={1} style={{ flex: 1, minWidth: 260 }}>
              <HStack gap={2} align="center">
                <Badge label={CATEGORY_LABEL[req.category]} variant="neutral" />
                <Text size="sm" weight="medium">{req.requirement}</Text>
              </HStack>
              <Text size="sm" color="secondary">{req.evidence}</Text>
            </VStack>
            <Badge label={STATUS_LABEL[req.status]} variant={STATUS_VARIANT[req.status]} />
          </HStack>
        ))}
      </VStack>
    </Card>
  )
}
