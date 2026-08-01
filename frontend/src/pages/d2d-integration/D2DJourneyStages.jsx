// The 12-stage D2D journey visualization (requirements doc Section 11:
// Business need -> AI opportunity identified -> D2D demand created ->
// AI-assisted shaping -> Solution recommendation -> Harness design -> Build
// -> Evaluation -> Go-live -> Performance monitoring -> VR validation ->
// Playbook update). Shows how many demands currently sit at each stage.
import { HStack } from '@astryxdesign/core/HStack'
import { Badge } from '@astryxdesign/core/Badge'
import { D2D_STAGE_ORDER } from '../../data/types'

export function D2DJourneyStages({ demands }) {
  return (
    <HStack gap={2} style={{ flexWrap: 'wrap' }}>
      {D2D_STAGE_ORDER.map(({ stage, label }) => {
        const count = demands.filter((d) => d.stage === stage).length
        return <Badge key={stage} label={`${label} (${count})`} variant={count > 0 ? 'info' : 'neutral'} />
      })}
    </HStack>
  )
}
