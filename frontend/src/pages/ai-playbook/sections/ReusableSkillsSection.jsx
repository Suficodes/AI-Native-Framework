// Playbook section 15 — approved reusable skills. Skills already used by a
// harness in scope are marked "In use here"; the rest are the approved
// enterprise inventory to check before designing a new harness block.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { isSkillInScope } from '../../../data/playbookScope.ts'
import { sectionName } from '../../../data/processesAggregates.ts'
import { formatNumber } from '../../../utils/format.js'

const MATURITY_VARIANT = { Standard: 'success', Approved: 'info', Pilot: 'warning' }

export function ReusableSkillsSection({ playbook }) {
  const skills = playbook.reusableSkills
  if (skills.length === 0) {
    return <EmptyState title="No approved skills yet" description="The reusable skills registry is empty for this scope." />
  }

  const rows = skills.map((skill) => ({ ...skill, inScope: isSkillInScope(skill, playbook.scope) }))

  const columns = [
    {
      key: 'name',
      header: 'Skill',
      width: proportional(2, { minWidth: 210 }),
      renderCell: (row) => (
        <VStack gap={1}>
          <Text size="sm" weight="medium">{row.name}</Text>
          {row.inScope && <Badge label="In use here" variant="success" />}
        </VStack>
      ),
    },
    { key: 'description', header: 'What it does', width: proportional(2.6, { minWidth: 260 }), renderCell: (row) => <Text size="sm" color="secondary">{row.description}</Text> },
    { key: 'category', header: 'Category', width: pixel(120), renderCell: (row) => <Badge label={row.category} variant="neutral" /> },
    { key: 'ownerSectionId', header: 'Owner', width: proportional(1.3, { minWidth: 150 }), renderCell: (row) => <Text size="sm" color="secondary">{sectionName(row.ownerSectionId)}</Text> },
    { key: 'maturity', header: 'Maturity', width: pixel(110), renderCell: (row) => <Badge label={row.maturity} variant={MATURITY_VARIANT[row.maturity]} /> },
    { key: 'approvedForAutonomy', header: 'Max autonomy', width: pixel(120), renderCell: (row) => <Text size="sm">{row.approvedForAutonomy}</Text> },
    { key: 'reuseCount', header: 'Reuses', width: pixel(90), renderCell: (row) => <Text size="sm" className="mono">{formatNumber(row.reuseCount)}</Text> },
    { key: 'avgTokenCostPerCall', header: 'Avg tokens/call', width: pixel(130), renderCell: (row) => <Text size="sm" className="mono">{formatNumber(row.avgTokenCostPerCall)}</Text> },
  ]

  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows} columns={columns} idKey="id" hasHover density="balanced" textOverflow="wrap" />
      </div>
    </Card>
  )
}
