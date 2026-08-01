// Playbook section 4 — quick wins. The highest value-per-effort process steps
// in scope that are fully human today but have a non-human target owner,
// ranked by value weighted by process readiness and discounted by risk.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Aed } from '../../../dewa/Aed.jsx'
import { ValueTag } from '../../../dewa/ValueTag.jsx'

const EFFORT_VARIANT = { Low: 'success', Medium: 'warning', High: 'error' }

export function QuickWinsSection({ playbook }) {
  const navigate = useNavigate()
  const wins = playbook.quickWins
  if (wins.length === 0) {
    return <EmptyState title="No quick wins available" description="Every step in scope is either already agent-supported or has a human target owner." />
  }

  const columns = [
    {
      key: 'title',
      header: 'Step',
      width: proportional(2, { minWidth: 220 }),
      renderCell: (row) => (
        <VStack gap={0}>
          <Text size="sm" weight="medium">{row.title}</Text>
          <Text
            size="sm" color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer', display: 'block' }}
            onClick={() => navigate(`/processes/agenticity/${row.processId}`)}
          >
            {row.processName}
          </Text>
        </VStack>
      ),
    },
    { key: 'rationale', header: 'Why now', width: proportional(2.6, { minWidth: 260 }), renderCell: (row) => <Text size="sm" color="secondary">{row.rationale}</Text> },
    { key: 'effort', header: 'Effort', width: pixel(96), renderCell: (row) => <Badge label={row.effort} variant={EFFORT_VARIANT[row.effort]} /> },
    { key: 'timeToValueWeeks', header: 'Time to value', width: pixel(112), renderCell: (row) => <Text size="sm">{row.timeToValueWeeks} weeks</Text> },
    {
      key: 'valueOpportunity',
      header: 'Value opportunity',
      width: pixel(150),
      renderCell: (row) => (
        <VStack gap={1}>
          <Text size="sm" weight="semibold"><Aed aed={row.valueOpportunity.value} compact /></Text>
          <ValueTag tag={row.valueOpportunity.tag} />
        </VStack>
      ),
    },
  ]

  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={wins} columns={columns} idKey="id" hasHover density="balanced" textOverflow="wrap" />
      </div>
    </Card>
  )
}
