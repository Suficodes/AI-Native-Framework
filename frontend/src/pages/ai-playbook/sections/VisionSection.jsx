// Playbook section 1 — AI-native vision. The statement is enterprise doctrine
// (fixed copy); every number beside it is measured for the active scope, which
// is what stops this reading as a slide.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'

export function VisionSection({ playbook }) {
  const { statement, pillars } = playbook.vision
  return (
    <VStack gap={4}>
      <Card padding={4}>
        <Text size="lg" style={{ display: 'block', lineHeight: 1.55 }}>{statement}</Text>
      </Card>
      <div className="auto-grid" style={{ '--min': '280px' }}>
        {pillars.map((pillar) => (
          <Card key={pillar.name} padding={4}>
            <VStack gap={3}>
              <VStack gap={1}>
                <Text weight="semibold">{pillar.name}</Text>
                <Text size="sm" color="secondary">{pillar.description}</Text>
              </VStack>
              <VStack gap={1}>
                <ProgressBar
                  value={pillar.currentPct}
                  label={`Current — ${pillar.currentPct}%`}
                  variant={pillar.currentPct >= pillar.targetPct * 0.75 ? 'success' : 'accent'}
                />
                <HStack justify="between" align="center">
                  <Text size="sm" color="secondary">{pillar.measure}</Text>
                  <Text size="sm" weight="semibold">Target {pillar.targetPct}%</Text>
                </HStack>
              </VStack>
            </VStack>
          </Card>
        ))}
      </div>
    </VStack>
  )
}
