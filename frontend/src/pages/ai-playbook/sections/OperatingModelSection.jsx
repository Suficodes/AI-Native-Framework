// Playbook section 2 — human–agent operating model. Principles and
// accountabilities are doctrine; the workforce mix and the mandatory control
// points are counted from the positions and Quality Procedures in scope.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { QP_INDICATOR_LABELS } from '../../../data/types'
import { GuidanceList } from '../PlaybookSection.jsx'

export function OperatingModelSection({ playbook }) {
  const navigate = useNavigate()
  const { principles, workforceMix, controlPoints, humanAccountabilities, agentAccountabilities } = playbook.operatingModel

  return (
    <VStack gap={4}>
      <Card padding={4}><GuidanceList label="Operating principles" items={principles} /></Card>

      <div className="auto-grid" style={{ '--min': '300px' }}>
        <Card padding={4}>
          <VStack gap={3}>
            <Text weight="semibold">Workforce mix in scope</Text>
            {workforceMix.length === 0 ? (
              <Text size="sm" color="secondary">No positions fall inside this scope.</Text>
            ) : workforceMix.map((row) => (
              <ProgressBar
                key={row.type}
                value={row.sharePct}
                label={`${row.label} — ${row.positions} position${row.positions === 1 ? '' : 's'}`}
                hasValueLabel
                variant={row.type === 'Human' ? 'neutral' : 'accent'}
              />
            ))}
          </VStack>
        </Card>

        <Card padding={4}>
          <VStack gap={3}>
            <Text weight="semibold">Mandatory control points</Text>
            <Text size="sm" color="secondary">
              Quality Procedures in scope that retain a human control (C) or an escalation rule (E). These do not automate away.
            </Text>
            {controlPoints.length === 0 ? (
              <EmptyState title="No mandatory control points" description="No Quality Procedure in this scope is marked C or E." />
            ) : (
              <VStack gap={2}>
                {controlPoints.map((point) => (
                  <HStack key={point.qpId} justify="between" align="center" gap={2}>
                    <Text
                      size="sm" color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/processes/quality-procedures/${point.qpId}`)}
                    >
                      {point.qpId} — {point.title}
                    </Text>
                    <Badge label={QP_INDICATOR_LABELS[point.indicator]} variant={point.indicator === 'C' ? 'warning' : 'error'} />
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>
        </Card>
      </div>

      <div className="auto-grid" style={{ '--min': '300px' }}>
        <Card padding={4}><GuidanceList label="The human is accountable for" items={humanAccountabilities} /></Card>
        <Card padding={4}><GuidanceList label="The agent is accountable for" items={agentAccountabilities} /></Card>
      </div>
    </VStack>
  )
}
