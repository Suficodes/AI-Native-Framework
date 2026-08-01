// "Executive Attention Required" panel (requirements doc Section 4).
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { useNavigate } from 'react-router-dom'
import { computeAttentionItems } from '../../data/executiveAggregates'

const ROWS = [
  { key: 'agentsUnderReview', label: 'Agents under review', to: '/agents' },
  { key: 'tokenBudgetOverruns', label: 'Token budget overruns', to: '/token-economics' },
  { key: 'unvalidatedBenefits', label: 'Unvalidated benefits', to: '/value-realization' },
  { key: 'expiredQps', label: 'Expired / under-review Quality Procedures', to: '/processes/quality-procedures' },
  { key: 'failedEvaluations', label: 'Failed harness evaluations', to: '/harness-engineering' },
  { key: 'delayedInitiatives', label: 'D2D initiatives delayed or blocked', to: '/ai-initiatives' },
  { key: 'highOverrideAgents', label: 'High human override rate', to: '/agents' },
  { key: 'openIncidents', label: 'Security or compliance incidents', to: '/observability' },
]

export function AttentionPanel() {
  const navigate = useNavigate()
  const items = computeAttentionItems()
  const rows = ROWS.map((r) => ({ ...r, count: items[r.key]?.length ?? 0 })).filter((r) => r.count > 0)

  return (
    <Card padding={4}>
      <Text weight="semibold" style={{ marginBottom: 'var(--spacing-3)' }}>Executive Attention Required</Text>
      {rows.length === 0 ? (
        <EmptyState title="Nothing needs attention" description="All tracked risk signals are within normal range." />
      ) : (
        <VStack gap={0}>
          {rows.map((r, i) => (
            <HStack
              key={r.key} align="center" justify="space-between"
              onClick={() => navigate(r.to)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(r.to) }}
              style={{
                padding: 'var(--spacing-3) var(--spacing-1)', cursor: 'pointer',
                borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
              }}
            >
              <Text size="sm">{r.label}</Text>
              <Badge label={r.count} variant={r.count > 3 ? 'error' : 'warning'} />
            </HStack>
          ))}
        </VStack>
      )}
    </Card>
  )
}
