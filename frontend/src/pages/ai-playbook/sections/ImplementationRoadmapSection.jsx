// Playbook section 13 — implementation roadmap. The in-scope AI initiatives
// placed on Now / Next / Later by their delivery stage, each carrying the
// dependency that actually gates it.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { PLAYBOOK_HORIZONS, PLAYBOOK_HORIZON_LABELS } from '../../../data/types'
import { Aed } from '../../../dewa/Aed.jsx'
import { formatDate } from '../../../utils/format.js'

const STATUS_VARIANT = { OnTrack: 'success', AtRisk: 'warning', Delayed: 'error', Blocked: 'error', Complete: 'info' }

export function ImplementationRoadmapSection({ playbook }) {
  const navigate = useNavigate()
  const items = playbook.implementationRoadmap
  if (items.length === 0) {
    return <EmptyState title="Nothing in the delivery pipeline" description="No AI initiative is registered against this scope yet." />
  }

  return (
    <div className="auto-grid" style={{ '--min': '300px' }}>
      {PLAYBOOK_HORIZONS.map((horizon) => {
        const inHorizon = items.filter((i) => i.horizon === horizon)
        return (
          <Card key={horizon} padding={4}>
            <VStack gap={3}>
              <HStack justify="between" align="center">
                <Text weight="semibold">{PLAYBOOK_HORIZON_LABELS[horizon]}</Text>
                <Badge label={String(inHorizon.length)} variant="neutral" />
              </HStack>
              {inHorizon.length === 0 ? (
                <Text size="sm" color="secondary">Nothing scheduled in this horizon.</Text>
              ) : inHorizon.map((item) => (
                <VStack key={item.initiativeId} gap={1} style={{ paddingTop: 'var(--spacing-2)', borderTop: '1px solid var(--color-border)' }}>
                  <Text
                    size="sm" weight="medium" color="accent" role="button" tabIndex={0}
                    style={{ cursor: 'pointer', display: 'block' }}
                    onClick={() => navigate(`/ai-initiatives/${item.initiativeId}`)}
                  >
                    {item.title}
                  </Text>
                  <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
                    <Badge label={item.stage} variant="neutral" />
                    <Badge label={item.status} variant={STATUS_VARIANT[item.status] ?? 'neutral'} />
                    <Text size="sm" color="secondary"><Aed aed={item.expectedValue.value} compact /></Text>
                    {item.goLiveDate && <Text size="sm" color="secondary">Go-live {formatDate(item.goLiveDate)}</Text>}
                  </HStack>
                  {item.dependencies.map((dep) => (
                    <Text key={dep} size="sm" color="secondary">• {dep}</Text>
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
