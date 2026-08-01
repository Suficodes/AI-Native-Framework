// Digital Job Description tab — requirements doc Section 8: the agent's
// purpose statement plus its data/system access boundaries.
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'

export function DigitalJobDescriptionTab({ agent }) {
  return (
    <VStack gap={5}>
      <Card padding={4}>
        <VStack gap={4}>
          <div>
            <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Digital job title</Text>
            <Text>{agent.digitalJobTitle}</Text>
          </div>
          <div>
            <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Purpose</Text>
            <Text color="secondary">{agent.purpose}</Text>
          </div>
        </VStack>
      </Card>

      <Card padding={4}>
        <VStack gap={4}>
          <div>
            <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Data access</Text>
            <HStack gap={1} style={{ flexWrap: 'wrap' }}>
              {agent.dataAccess.map((d) => <Badge key={d} label={d} variant="neutral" />)}
            </HStack>
          </div>
          <div>
            <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>System access</Text>
            <HStack gap={1} style={{ flexWrap: 'wrap' }}>
              {agent.systemAccess.map((s) => <Badge key={s} label={s} variant="neutral" />)}
            </HStack>
          </div>
        </VStack>
      </Card>
    </VStack>
  )
}
