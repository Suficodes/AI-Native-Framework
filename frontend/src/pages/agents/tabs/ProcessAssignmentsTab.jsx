// Process Assignments tab — the agent's assigned processes and Quality
// Procedures (requirements doc Section 8).
import { useNavigate } from 'react-router-dom'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { processesForAgent, qpsForAgent } from '../../../data/agentsAggregates.ts'

function LinkRow({ onClick, children }) {
  return (
    <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick() }} style={{ cursor: 'pointer', padding: '4px 0' }}>
      {children}
    </div>
  )
}

export function ProcessAssignmentsTab({ agent }) {
  const navigate = useNavigate()
  const processes = processesForAgent(agent)
  const qps = qpsForAgent(agent)

  if (processes.length === 0 && qps.length === 0) {
    return <EmptyState title="No assignments yet" description="This agent isn't tied to a process or Quality Procedure yet." />
  }

  return (
    <VStack gap={5}>
      <Card padding={4}>
        <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-3)' }}>Assigned processes ({processes.length})</Text>
        <VStack gap={1}>
          {processes.map((p) => (
            <LinkRow key={p.id} onClick={() => navigate(`/processes/agenticity/${p.id}`)}>
              <Text size="sm">{p.name} <Badge label={p.currentAgenticity} variant="neutral" /></Text>
            </LinkRow>
          ))}
        </VStack>
      </Card>

      <Card padding={4}>
        <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-3)' }}>Assigned Quality Procedures ({qps.length})</Text>
        <VStack gap={1}>
          {qps.map((q) => (
            <LinkRow key={q.id} onClick={() => navigate(`/processes/quality-procedures/${q.id}`)}>
              <Text size="sm">{q.title} <Badge label={q.indicator} variant="info" /></Text>
            </LinkRow>
          ))}
        </VStack>
      </Card>
    </VStack>
  )
}
