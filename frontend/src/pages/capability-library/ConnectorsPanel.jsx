// MCP connectors — the governed doors between agents and enterprise systems.
// A skill reaches SAP through a connector, never directly, which is what makes
// access reviewable in one place instead of per agent.
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { VStack } from '@astryxdesign/core/VStack'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { formatNumber } from '../../utils/format.js'

const STATUS_VARIANT = { Live: 'success', Pilot: 'warning', Planned: 'neutral' }

export function ConnectorsPanel({ connectors }) {
  const columns = [
    {
      key: 'name',
      header: 'Connector',
      width: proportional(1.6, { minWidth: 190 }),
      renderCell: (row) => (
        <VStack gap={1}>
          <Text size="sm" weight="medium">{row.name}</Text>
          <Text size="xs" color="secondary">{row.system}</Text>
        </VStack>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: pixel(100),
      renderCell: (row) => <Badge label={row.status} variant={STATUS_VARIANT[row.status]} />,
    },
    {
      key: 'skillsServed',
      header: 'Skills served',
      width: pixel(114),
      renderCell: (row) => <span className="mono">{row.skillsServed}</span>,
    },
    {
      key: 'callsThisQuarter',
      header: 'Calls this quarter',
      width: pixel(146),
      renderCell: (row) =>
        row.callsThisQuarter > 0
          ? <span className="mono">{formatNumber(row.callsThisQuarter)}</span>
          : <Text size="xs" color="secondary">not connected yet</Text>,
    },
  ]

  return <Table data={connectors} columns={columns} idKey="id" hasHover />
}
