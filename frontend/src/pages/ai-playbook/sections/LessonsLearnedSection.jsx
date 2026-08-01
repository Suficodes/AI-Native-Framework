// Playbook section 14 — lessons learned. Filtered to the lessons that touch
// this scope's processes (topped up from its divisions when a narrow scope has
// too few), so the section changes as the scope changes.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'

const SOURCE_VARIANT = { Delivery: 'info', Incident: 'error', Evaluation: 'warning', Adoption: 'neutral' }

export function LessonsLearnedSection({ playbook }) {
  const lessons = playbook.lessonsLearned
  if (lessons.length === 0) {
    return <EmptyState title="No lessons recorded" description="Nothing has been captured against this scope yet." />
  }

  return (
    <div className="auto-grid" style={{ '--min': '340px' }}>
      {lessons.map((lesson) => (
        <Card key={lesson.id} padding={4}>
          <VStack gap={3}>
            <HStack justify="between" align="start" gap={2}>
              <Text weight="semibold" style={{ flex: 1 }}>{lesson.title}</Text>
              <Badge label={lesson.sourceType} variant={SOURCE_VARIANT[lesson.sourceType]} />
            </HStack>
            <VStack gap={1}>
              <Text size="sm" color="secondary" weight="semibold" style={{ display: 'block' }}>What happened</Text>
              <Text size="sm" color="secondary">{lesson.context}</Text>
            </VStack>
            <VStack gap={1}>
              <Text size="sm" color="secondary" weight="semibold" style={{ display: 'block' }}>Lesson</Text>
              <Text size="sm">{lesson.lesson}</Text>
            </VStack>
            <VStack gap={1}>
              <Text size="sm" color="secondary" weight="semibold" style={{ display: 'block' }}>Do this instead</Text>
              <Text size="sm">{lesson.recommendation}</Text>
            </VStack>
          </VStack>
        </Card>
      ))}
    </div>
  )
}
