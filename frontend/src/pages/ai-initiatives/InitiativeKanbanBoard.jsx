// Kanban view for the AI Initiatives portfolio — one column per delivery
// stage (requirements doc Section 7's 11 stages, INITIATIVE_STAGE_ORDER).
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { useNavigate } from 'react-router-dom'
import { INITIATIVE_STAGE_ORDER } from '../../data/types'

const STATUS_VARIANT = { OnTrack: 'success', AtRisk: 'warning', Delayed: 'error', Blocked: 'error', Complete: 'neutral' }

export function InitiativeKanbanBoard({ initiatives }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-3)', overflowX: 'auto', paddingBottom: 'var(--spacing-3)' }}>
      {INITIATIVE_STAGE_ORDER.map((stage) => {
        const stageItems = initiatives.filter((i) => i.stage === stage)
        return (
          <div key={stage} style={{ flex: '0 0 240px', width: 240 }}>
            <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>
              {stage} ({stageItems.length})
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              {stageItems.map((initiative) => (
                <Card
                  key={initiative.id} padding={3}
                  onClick={() => navigate(`/ai-initiatives/${initiative.id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/ai-initiatives/${initiative.id}`) }}
                  style={{ cursor: 'pointer' }}
                >
                  <Text size="sm" weight="medium" style={{ display: 'block', marginBottom: 6 }}>{initiative.title}</Text>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Badge label={initiative.status} variant={STATUS_VARIANT[initiative.status]} />
                    <Badge label={initiative.aiType} variant="neutral" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
