// Agent module — requirements doc Section 8: the enterprise Digital
// Employee Registry.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { ExportButton } from '../../components/ExportButton.jsx'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getAgents } from '../../data/mockApi'
import { divisionName, sectionName } from '../../data/processesAggregates.ts'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'

const STATUS_VARIANT = {
  Active: 'success', Probation: 'warning', Evaluation: 'info', Development: 'neutral',
  Proposed: 'neutral', Restricted: 'warning', Suspended: 'error', Retired: 'neutral',
}

export default function Agents() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState(null)
  useEffect(() => { getAgents().then(setAgents) }, [])

  const columns = [
    {
      key: 'name', header: 'Agent', width: proportional(2, { minWidth: 200 }),
      renderCell: (row) => (
        <Text
          weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/agents/${row.id}`)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/agents/${row.id}`) } }}
        >
          {row.name}
        </Text>
      ),
    },
    { key: 'digitalJobTitle', header: 'Digital job title', width: proportional(1.8, { minWidth: 180 }) },
    { key: 'division', header: 'Division', width: proportional(1.6, { minWidth: 160 }) },
    { key: 'agentType', header: 'Type', width: pixel(120) },
    { key: 'model', header: 'Model', width: proportional(1.4, { minWidth: 140 }) },
    { key: 'autonomyLevel', header: 'Autonomy', width: pixel(90), renderCell: (row) => <Badge label={row.autonomyLevel} variant="neutral" /> },
    { key: 'status', header: 'Status', width: pixel(100), renderCell: (row) => <Badge label={row.status} variant={STATUS_VARIANT[row.status]} /> },
    { key: 'performanceScore', header: 'Performance', width: pixel(100) },
    {
      key: 'valueGenerated', header: 'Value generated', width: pixel(150),
      renderCell: (row) => <Text size="sm"><Aed aed={row.valueGenerated.value} compact /> <ValueTag tag={row.valueGenerated.tag} /></Text>,
    },
  ]

  const rows = (agents ?? []).map((a) => ({ ...a, division: divisionName(a.orgAssignment.divisionId), section: sectionName(a.orgAssignment.sectionId) }))

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Agents</Heading>
        <Text color="secondary" size="lg">The enterprise Digital Employee Registry — every agent, its owners, and its standing.</Text>
        <div style={{ marginTop: 'var(--spacing-3)' }}>
          <ExportButton filename="agents" columns={[{key:'id',header:'ID'},{key:'name',header:'Agent'},{key:'digitalJobTitle',header:'Digital job title'},{key:'division',header:'Division'},{key:'agentType',header:'Type'},{key:'model',header:'Model'},{key:'autonomyLevel',header:'Autonomy'},{key:'status',header:'Status'},{key:'performanceScore',header:'Performance'}]} rows={rows} />
        </div>
      </div>

      {!agents ? (
        <Skeleton height={480} radius={2} />
      ) : (
        <Card padding={0}>
          <div style={{ overflowX: 'auto' }}>
            <Table data={rows} columns={columns} idKey="id" hasHover />
          </div>
        </Card>
      )}
    </div>
  )
}
