// Story Mode (Section 18): the fourteen-step executive walkthrough, with
// play/pause, step navigation and the narration for the current beat. In
// presentation mode this is the only chrome left on screen.
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { STORY_STEPS } from '../../data/enterpriseMapStory.ts'
import { DewaButton } from '../../dewa/DewaButton.jsx'

export function StoryBar({ stepIndex, playing, onStep, onPlayPause, onExit, presentation }) {
  const step = STORY_STEPS[stepIndex]
  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-background-surface)',
        padding: presentation ? 'var(--spacing-5) var(--spacing-6)' : 'var(--spacing-4) var(--spacing-5)',
      }}
    >
      <VStack gap={3}>
        <HStack justify="between" align="center" gap={3} style={{ flexWrap: 'wrap' }}>
          <HStack gap={3} align="center" style={{ flexWrap: 'wrap' }}>
            <Badge label={`Step ${step.number} of ${STORY_STEPS.length}`} variant="info" />
            <Text weight="semibold" size={presentation ? 'lg' : 'md'}>{step.title}</Text>
          </HStack>
          <HStack gap={2} align="center">
            <DewaButton
              label="Previous" variant="ghost"
              onClick={() => onStep(Math.max(0, stepIndex - 1))}
              isDisabled={stepIndex === 0}
            />
            <DewaButton label={playing ? 'Pause' : 'Play'} variant="secondary" onClick={onPlayPause} />
            <DewaButton
              label="Next" variant="ghost"
              onClick={() => onStep(Math.min(STORY_STEPS.length - 1, stepIndex + 1))}
              isDisabled={stepIndex === STORY_STEPS.length - 1}
            />
            <DewaButton label="Exit story" variant="ghost" onClick={onExit} />
          </HStack>
        </HStack>

        <Text
          color="secondary"
          size={presentation ? 'lg' : 'md'}
          style={{ display: 'block', maxWidth: '90ch', lineHeight: 1.55 }}
        >
          {step.narration}
        </Text>

        <ProgressBar
          value={((stepIndex + 1) / STORY_STEPS.length) * 100}
          label={`Story progress`}
          isLabelHidden
          variant="accent"
        />
      </VStack>
    </div>
  )
}
