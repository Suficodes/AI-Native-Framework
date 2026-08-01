// Process detail — requirements doc Section 6.A step-level view. Route:
// /processes/agenticity/:processId. PROC-D2D (the 14-step Demand-to-
// Delivery process) is the doc's primary worked example; this page is
// generic, so it renders correctly for any process.
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getProcesses, getProcessSteps } from '../../data/mockApi'
import { divisionName, sectionName, qpsForProcess, agentName, harnessName } from '../../data/processesAggregates.ts'
import { QP_INDICATOR_LABELS } from '../../data/types'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'

export default function ProcessDetail() {
  const { processId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  useEffect(() => {
    Promise.all([getProcesses(), getProcessSteps()]).then(([processes, steps]) => {
      const process = processes.find((p) => p.id === processId)
      setData({ process, steps: steps.filter((s) => s.processId === processId).sort((a, b) => a.order - b.order) })
    })
  }, [processId])

  if (!data) return <div className="page-band page-band--wide"><Skeleton height={480} radius={2} /></div>
  if (!data.process) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="Process not found" description={`No process with ID "${processId}".`} />
      </div>
    )
  }

  const { process, steps } = data
  const qps = qpsForProcess(process.id)

  const columns = [
    { key: 'order', header: '#', width: pixel(36) },
    { key: 'name', header: 'Step', width: proportional(2, { minWidth: 180 }) },
    {
      key: 'ownership', header: 'Current → future owner', width: proportional(1.4, { minWidth: 150 }),
      renderCell: (row) => <Text size="sm">{row.currentOwner} → {row.futureOwner}</Text>,
    },
    {
      key: 'contribution', header: 'Contribution', width: pixel(140),
      renderCell: (row) => <Text size="sm">H {row.humanContributionPct}% / A {row.agentContributionPct}%</Text>,
    },
    {
      key: 'automationLevel', header: 'Automation', width: pixel(90),
      renderCell: (row) => <Badge label={row.automationLevel} variant="neutral" />,
    },
    {
      key: 'controlRequirement', header: 'Control', width: pixel(90),
      renderCell: (row) => <Badge label={row.controlRequirement} variant="info" />,
    },
    {
      key: 'timing', header: 'Timing', width: pixel(140),
      renderCell: (row) => <Text size="sm">{row.avgProcessingTimeMins}m avg · SLA {row.slaMins}m</Text>,
    },
    {
      key: 'quality', header: 'Quality / exceptions', width: pixel(150),
      renderCell: (row) => <Text size="sm">{row.qualityScore}% quality · {row.exceptionRatePct}% exceptions</Text>,
    },
    {
      key: 'assigned', header: 'Assigned agent / harness', width: proportional(1.5, { minWidth: 160 }),
      renderCell: (row) => (
        <Text size="sm">
          {agentName(row.assignedAgentId) ?? '—'} / {harnessName(row.assignedHarnessId) ?? '—'}
        </Text>
      ),
    },
    {
      key: 'valueOpportunity', header: 'Value opportunity', width: pixel(150),
      renderCell: (row) => (
        <Text size="sm"><Aed usd={row.valueOpportunity.value} compact /> <ValueTag tag={row.valueOpportunity.tag} /></Text>
      ),
    },
  ]

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Process Agenticity" variant="ghost" onClick={() => navigate('/processes/agenticity')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">Process</span>
        <Heading level={1} type="display-3">{process.name}</Heading>
        <Text color="secondary" size="lg">{divisionName(process.divisionId)} · owned by {sectionName(process.ownerSectionId)}</Text>
      </div>

      <VStack gap={5}>
        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="Current agenticity"><Badge label={process.currentAgenticity} variant="neutral" /></MetadataListItem>
            <MetadataListItem label="Target agenticity"><Badge label={process.targetAgenticity} variant="info" /></MetadataListItem>
            <MetadataListItem label="Readiness score">{process.readinessScore}</MetadataListItem>
            <MetadataListItem label="Risk score">{process.riskScore}</MetadataListItem>
            <MetadataListItem label="Estimated benefit">
              <Aed usd={process.estimatedBenefit.value} /> <ValueTag tag={process.estimatedBenefit.tag} />
            </MetadataListItem>
            <MetadataListItem label="Process steps">{steps.length}</MetadataListItem>
          </MetadataList>
        </Card>

        <div>
          <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Process steps</Heading>
          <Card padding={0}>
            <div style={{ overflowX: 'auto' }}>
              <Table data={steps} columns={columns} idKey="id" hasHover density="compact" />
            </div>
          </Card>
        </div>

        <div>
          <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Related Quality Procedures ({qps.length})</Heading>
          {qps.length === 0 ? (
            <Text color="secondary" size="sm">None linked yet.</Text>
          ) : (
            <VStack gap={2}>
              {qps.map((qp) => (
                <HStack
                  key={qp.id} justify="space-between" align="center"
                  onClick={() => navigate(`/processes/quality-procedures/${qp.id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/processes/quality-procedures/${qp.id}`) }}
                  style={{ cursor: 'pointer', padding: 'var(--spacing-2) 0' }}
                >
                  <Text size="sm">{qp.title}</Text>
                  <Badge label={`${qp.indicator} — ${QP_INDICATOR_LABELS[qp.indicator]}`} variant="neutral" />
                </HStack>
              ))}
            </VStack>
          )}
        </div>
      </VStack>
    </div>
  )
}
