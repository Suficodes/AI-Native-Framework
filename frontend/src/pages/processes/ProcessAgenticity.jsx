// Process Agenticity tab — requirements doc Section 6.A. Process hierarchy
// list; the D2D process (PROC-D2D) is the doc's primary worked example and
// sorts first (buildProcesses() already seeds it as the first record).
import { useEffect, useState } from 'react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { useNavigate } from 'react-router-dom'
import { getProcesses } from '../../data/mockApi'
import { divisionName } from '../../data/processesAggregates.ts'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { ProcessesTabs } from './ProcessesTabs.jsx'

export default function ProcessAgenticity() {
  const navigate = useNavigate()
  const [processes, setProcesses] = useState(null)
  useEffect(() => { getProcesses().then(setProcesses) }, [])

  const columns = [
    {
      key: 'name', header: 'Process', width: proportional(3, { minWidth: 200 }),
      renderCell: (row) => (
        <Text
          weight="medium" color="accent"
          onClick={() => navigate(`/processes/agenticity/${row.id}`)}
          style={{ cursor: 'pointer' }}
        >
          {row.name}
        </Text>
      ),
    },
    { key: 'division', header: 'Division', width: proportional(2, { minWidth: 160 }) },
    {
      key: 'currentAgenticity', header: 'Current', width: pixel(90),
      renderCell: (row) => <Badge label={row.currentAgenticity} variant="neutral" />,
    },
    {
      key: 'targetAgenticity', header: 'Target', width: pixel(90),
      renderCell: (row) => <Badge label={row.targetAgenticity} variant="info" />,
    },
    { key: 'readinessScore', header: 'Readiness', width: pixel(90) },
    { key: 'riskScore', header: 'Risk', width: pixel(80) },
    {
      key: 'estimatedBenefit', header: 'Estimated benefit', width: pixel(160),
      renderCell: (row) => (
        <span>
          <Aed usd={row.estimatedBenefit.value} compact /> <ValueTag tag={row.estimatedBenefit.tag} />
        </span>
      ),
    },
  ]

  const rows = (processes ?? []).map((p) => ({ ...p, division: divisionName(p.divisionId) }))

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Processes & Quality Procedures</Heading>
        <Text color="secondary" size="lg">
          Process hierarchy and step-level agenticity (L0–L6), led by the 14-step Demand-to-Delivery process.
        </Text>
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <ProcessesTabs active="agenticity" />
      </div>

      {!processes ? (
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
