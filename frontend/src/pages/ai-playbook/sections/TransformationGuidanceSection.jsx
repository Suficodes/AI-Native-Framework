// Playbook section 3 — department transformation guidance. One card per org
// unit in scope, with the from/to statement and the recommended moves derived
// from that unit's own agenticity gap, coverage, and agent population.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { AGENTICITY_LABELS } from '../../../data/types'
import { GuidanceList } from '../PlaybookSection.jsx'

export function TransformationGuidanceSection({ playbook }) {
  const units = playbook.transformationGuidance
  if (units.length === 0) {
    return <EmptyState title="No org unit in scope" description="This scope does not resolve to an organizational unit to write guidance for." />
  }
  return (
    <VStack gap={4}>
      {units.map((unit) => (
        <Card key={unit.unitId} padding={4}>
          <VStack gap={3}>
            <HStack justify="between" align="center" gap={3} style={{ flexWrap: 'wrap' }}>
              <Text weight="semibold" size="lg">{unit.unitName}</Text>
              <HStack gap={2} align="center">
                {unit.currentAgenticity && (
                  <Badge label={`${unit.currentAgenticity} — ${AGENTICITY_LABELS[unit.currentAgenticity]}`} variant="neutral" />
                )}
                {unit.targetAgenticity && (
                  <Badge label={`Target ${unit.targetAgenticity}`} variant="success" />
                )}
                <Badge label={`${unit.aiCoveragePct}% AI coverage`} variant="info" />
              </HStack>
            </HStack>
            <div className="auto-grid" style={{ '--min': '280px' }}>
              <VStack gap={1}>
                <Text size="sm" weight="semibold" color="secondary">From</Text>
                <Text size="sm">{unit.fromState}</Text>
              </VStack>
              <VStack gap={1}>
                <Text size="sm" weight="semibold" color="secondary">To</Text>
                <Text size="sm">{unit.toState}</Text>
              </VStack>
            </div>
            <GuidanceList label="Recommended moves" items={unit.moves} ordered />
          </VStack>
        </Card>
      ))}
    </VStack>
  )
}
