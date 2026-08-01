// Harness Engineering module — requirements doc Section 9: the Harness
// Registry, plus the "Agent = Model + Instructions + ..." explainer that
// makes this a major module rather than a technical footnote.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { ExportButton } from '../../components/ExportButton.jsx'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getHarnesses } from '../../data/mockApi'
import { agentName } from '../../data/processesAggregates.ts'
import { employeeName, processName } from '../../data/lookups.ts'
import { HARNESS_DEPLOYMENT_GATES } from '../../data/types'
import { AgentFormula } from './AgentFormula.jsx'

const GATE_VARIANT = {
  Development: 'neutral', TechnicalTesting: 'info', BusinessEvaluation: 'info',
  RiskReview: 'warning', Probation: 'warning', Production: 'success', ScaleApproved: 'success',
}

export default function HarnessRegistry() {
  const navigate = useNavigate()
  const [harnesses, setHarnesses] = useState(null)
  useEffect(() => { getHarnesses().then(setHarnesses) }, [])

  const columns = [
    {
      key: 'name', header: 'Harness', width: proportional(2, { minWidth: 200 }),
      renderCell: (row) => (
        <Text
          weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/harness-engineering/${row.id}`)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/harness-engineering/${row.id}`) } }}
        >
          {row.name}
        </Text>
      ),
    },
    { key: 'agent', header: 'Assigned agent', width: proportional(1.6, { minWidth: 170 }) },
    { key: 'process', header: 'Assigned process', width: proportional(1.6, { minWidth: 170 }) },
    { key: 'version', header: 'Version', width: pixel(80) },
    {
      key: 'status', header: 'Deployment gate', width: pixel(150),
      renderCell: (row) => <Badge label={row.status} variant={GATE_VARIANT[row.status]} />,
    },
    { key: 'businessOwner', header: 'Business owner', width: proportional(1.4, { minWidth: 150 }) },
    { key: 'technicalOwner', header: 'Technical owner', width: proportional(1.4, { minWidth: 150 }) },
    {
      key: 'confidenceThreshold', header: 'Confidence', width: pixel(100),
      renderCell: (row) => <Text size="sm">{Math.round(row.confidenceThreshold * 100)}%</Text>,
    },
    {
      key: 'killSwitchEnabled', header: 'Kill switch', width: pixel(100),
      renderCell: (row) => <Badge label={row.killSwitchEnabled ? 'Enabled' : 'Disabled'} variant={row.killSwitchEnabled ? 'success' : 'neutral'} />,
    },
  ]

  const rows = (harnesses ?? []).map((h) => ({
    ...h,
    agent: agentName(h.assignedAgentId) ?? '—',
    process: processName(h.assignedProcessId) ?? '—',
    businessOwner: employeeName(h.businessOwnerId) ?? '—',
    technicalOwner: employeeName(h.technicalOwnerId) ?? '—',
  }))

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Harness Engineering</Heading>
        <Text color="secondary" size="lg">
          The Harness Registry and the visual, click-to-configure Harness Designer — every agent is a
          concrete instance of the formula below, deployed through {HARNESS_DEPLOYMENT_GATES.length} gates
          from {HARNESS_DEPLOYMENT_GATES[0]} to {HARNESS_DEPLOYMENT_GATES[HARNESS_DEPLOYMENT_GATES.length - 1]}.
        </Text>
        <div style={{ marginTop: 'var(--spacing-3)' }}>
          <ExportButton filename="harnesses" columns={[{key:'id',header:'ID'},{key:'name',header:'Harness'},{key:'version',header:'Version'},{key:'status',header:'Status'}]} rows={rows} />
        </div>
      </div>

      {!harnesses ? (
        <Skeleton height={480} radius={2} />
      ) : (
        <VStack gap={5}>
          <AgentFormula />
          <Card padding={0}>
            <div style={{ overflowX: 'auto' }}>
              <Table data={rows} columns={columns} idKey="id" hasHover />
            </div>
          </Card>
        </VStack>
      )}
    </div>
  )
}
