// Playbook section 5 — process-agenticity roadmap. Every in-scope process
// placed in a Now / Next / Later horizon from its own agenticity gap,
// readiness, and risk, with the blockers that put it there.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { PLAYBOOK_HORIZONS, PLAYBOOK_HORIZON_LABELS } from '../../../data/types'

const HORIZON_VARIANT = { Now: 'success', Next: 'info', Later: 'neutral' }

export function AgenticityRoadmapSection({ playbook }) {
  const navigate = useNavigate()
  const steps = playbook.agenticityRoadmap
  if (steps.length === 0) {
    return <EmptyState title="No processes in scope" description="This scope does not own a registered business process." />
  }

  return (
    <div className="auto-grid" style={{ '--min': '300px' }}>
      {PLAYBOOK_HORIZONS.map((horizon) => {
        const inHorizon = steps.filter((s) => s.horizon === horizon)
        return (
          <Card key={horizon} padding={4}>
            <VStack gap={3}>
              <HStack justify="between" align="center">
                <Text weight="semibold">{PLAYBOOK_HORIZON_LABELS[horizon]}</Text>
                <Badge label={String(inHorizon.length)} variant={HORIZON_VARIANT[horizon]} />
              </HStack>
              {inHorizon.length === 0 ? (
                <Text size="sm" color="secondary">Nothing scheduled in this horizon.</Text>
              ) : inHorizon.map((step) => (
                <VStack key={step.processId} gap={1} style={{ paddingTop: 'var(--spacing-2)', borderTop: '1px solid var(--color-border)' }}>
                  <Text
                    size="sm" weight="medium" color="accent" role="button" tabIndex={0}
                    style={{ cursor: 'pointer', display: 'block' }}
                    onClick={() => navigate(`/processes/agenticity/${step.processId}`)}
                  >
                    {step.processName}
                  </Text>
                  <Text size="sm" color="secondary">
                    {step.currentAgenticity} → {step.targetAgenticity}
                    {' '}({step.levelGap <= 0 ? 'already at target' : `${step.levelGap} level${step.levelGap === 1 ? '' : 's'} to close`})
                    {' · '}readiness {step.readinessScore}% · risk {step.riskScore}
                  </Text>
                  {step.blockers.map((blocker) => (
                    <Text key={blocker} size="sm" color="secondary">• {blocker}</Text>
                  ))}
                </VStack>
              ))}
            </VStack>
          </Card>
        )
      })}
    </div>
  )
}
