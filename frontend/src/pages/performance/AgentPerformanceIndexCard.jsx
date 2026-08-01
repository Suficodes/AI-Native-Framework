// The Agent Performance Index explainer — Section 13.A's seven weighted
// dimensions. Shows the fleet average per dimension alongside its weight, so
// the index score is auditable rather than a black box.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { indexDimensionAverages } from '../../data/performanceAggregates.ts'

function variantFor(score) {
  return score >= 85 ? 'success' : score >= 65 ? 'accent' : score >= 50 ? 'warning' : 'error'
}

export function AgentPerformanceIndexCard({ indexScore }) {
  const dimensions = indexDimensionAverages()
  return (
    <Card padding={4}>
      <VStack gap={3}>
        <HStack justify="between" align="center" gap={2} style={{ flexWrap: 'wrap' }}>
          <VStack gap={0}>
            <Text weight="semibold" style={{ display: 'block' }}>Agent Performance Index</Text>
            <Text size="sm" color="secondary">Seven weighted dimensions, averaged across the agent fleet.</Text>
          </VStack>
          <Badge label={`Fleet index ${indexScore}`} variant={indexScore >= 85 ? 'success' : indexScore >= 65 ? 'info' : 'warning'} />
        </HStack>
        {dimensions.map((dim) => (
          <VStack key={dim.key} gap={1}>
            <ProgressBar
              value={dim.average}
              label={`${dim.label} — weight ${Math.round(dim.weight * 100)}%`}
              hasValueLabel
              variant={variantFor(dim.average)}
            />
          </VStack>
        ))}
      </VStack>
    </Card>
  )
}
