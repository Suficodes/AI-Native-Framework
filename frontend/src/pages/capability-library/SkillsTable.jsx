// The library itself — every reusable skill, how often it was called, and what
// reusing it instead of rebuilding it avoided.
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { VStack } from '@astryxdesign/core/VStack'
import { Aed } from '../../dewa/Aed.jsx'
import { sectionName } from '../../data/processesAggregates.ts'

const MATURITY_VARIANT = { Standard: 'success', Approved: 'info', Pilot: 'warning' }

export function SkillsTable({ skills }) {
  const columns = [
    {
      key: 'name',
      header: 'Skill',
      width: proportional(2.4, { minWidth: 230 }),
      renderCell: (row) => (
        <VStack gap={1}>
          <Text size="sm" weight="medium">{row.name}</Text>
          <Text size="xs" color="secondary">{row.description}</Text>
        </VStack>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: pixel(118),
      renderCell: (row) => <Badge label={row.category} variant="neutral" />,
    },
    {
      key: 'maturity',
      header: 'Maturity',
      width: pixel(106),
      renderCell: (row) => <Badge label={row.maturity} variant={MATURITY_VARIANT[row.maturity]} />,
    },
    {
      key: 'ownerSectionId',
      header: 'Owned by',
      width: proportional(1.2, { minWidth: 140 }),
      renderCell: (row) => <Text size="sm" color="secondary">{sectionName(row.ownerSectionId)}</Text>,
    },
    {
      key: 'callsThisQuarter',
      header: 'Calls',
      width: pixel(74),
      renderCell: (row) => <span className="mono">{row.callsThisQuarter}</span>,
    },
    {
      key: 'reuseInstances',
      header: 'Harnesses',
      width: pixel(96),
      renderCell: (row) => <span className="mono">{row.reuseInstances}</span>,
    },
    {
      key: 'bespokeBuildCost',
      header: 'Build once',
      width: pixel(112),
      renderCell: (row) => <Aed aed={row.bespokeBuildCost} compact />,
    },
    {
      key: 'netAvoided',
      header: 'Rebuilds avoided',
      width: pixel(140),
      renderCell: (row) =>
        row.reuseInstances > 1 ? (
          <Text weight="medium"><Aed aed={row.netAvoided} compact /></Text>
        ) : (
          <Text size="xs" color="secondary">first use</Text>
        ),
    },
  ]

  return <Table data={skills} columns={columns} idKey="id" hasHover />
}
