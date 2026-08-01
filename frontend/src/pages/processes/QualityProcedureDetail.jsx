// Quality Procedure detail — requirements doc Section 6.B's full field list,
// plus the "how a QP converts into an agent workflow" panel (Section 6.B:
// agent instructions, workflow steps, guardrails, evaluation criteria,
// audit evidence). Route: /processes/quality-procedures/:qpId. QP-01 (the
// D2D Demand Intake & BRD Preparation procedure — the doc's worked example)
// renders through this same generic page.
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
import { getQualityProcedures, getProcesses } from '../../data/mockApi'
import { sectionName, agentName, harnessName } from '../../data/processesAggregates.ts'
import { QP_INDICATOR_LABELS } from '../../data/types'
import { formatDate } from '../../utils/format.js'
import { DewaButton } from '../../dewa/DewaButton.jsx'

function BulletList({ label, items }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>{label}</Text>
      <VStack gap={1}>{items.map((item) => <Text key={item} size="sm">• {item}</Text>)}</VStack>
    </div>
  )
}

export default function QualityProcedureDetail() {
  const { qpId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  useEffect(() => {
    Promise.all([getQualityProcedures(), getProcesses()]).then(([qps, processes]) => {
      setData({ qp: qps.find((q) => q.id === qpId), process: processes.find((p) => p.id === qps.find((q) => q.id === qpId)?.relatedProcessId) })
    })
  }, [qpId])

  if (!data) return <div className="page-band page-band--wide"><Skeleton height={480} radius={2} /></div>
  if (!data.qp) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="Quality Procedure not found" description={`No Quality Procedure with ID "${qpId}".`} />
      </div>
    )
  }

  const { qp, process } = data
  const assignedAgents = qp.assignedAgentIds.map((id) => ({ id, name: agentName(id) })).filter((a) => a.name)

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Quality Procedures" variant="ghost" onClick={() => navigate('/processes/quality-procedures')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">Quality Procedure · {qp.id}</span>
        <Heading level={1} type="display-3">{qp.title}</Heading>
        <Text color="secondary" size="lg">{sectionName(qp.sectionOwnerId)} · v{qp.version}</Text>
      </div>

      <VStack gap={5}>
        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="Status"><Badge label={qp.status} variant={qp.status === 'Active' ? 'success' : qp.status === 'Expired' ? 'error' : 'neutral'} /></MetadataListItem>
            <MetadataListItem label="Indicator"><Badge label={`${qp.indicator} — ${QP_INDICATOR_LABELS[qp.indicator]}`} variant="info" /></MetadataListItem>
            <MetadataListItem label="Effective date">{formatDate(qp.effectiveDate)}</MetadataListItem>
            <MetadataListItem label="Review date">{formatDate(qp.reviewDate)}</MetadataListItem>
            <MetadataListItem label="SLA">{qp.slaHours} h</MetadataListItem>
            <MetadataListItem label="KPI">{qp.kpi}</MetadataListItem>
            <MetadataListItem label="Current AI coverage">{qp.currentAiCoveragePct}%</MetadataListItem>
            <MetadataListItem label="Target AI coverage">{qp.targetAiCoveragePct}%</MetadataListItem>
            <MetadataListItem label="Related process">
              {process ? (
                <Text
                  color="accent" onClick={() => navigate(`/processes/agenticity/${process.id}`)}
                  role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                >
                  {process.name}
                </Text>
              ) : '—'}
            </MetadataListItem>
            <MetadataListItem label="Assigned agents">
              {assignedAgents.length === 0 ? 'None' : (
                <VStack gap={1}>
                  {assignedAgents.map((a) => (
                    <Text key={a.id} color="accent" onClick={() => navigate(`/agents/${a.id}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                      {a.name}
                    </Text>
                  ))}
                </VStack>
              )}
            </MetadataListItem>
            <MetadataListItem label="Agent harness">
              {qp.harnessId && harnessName(qp.harnessId) ? (
                <Text color="accent" onClick={() => navigate(`/harness-engineering/${qp.harnessId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                  {harnessName(qp.harnessId)}
                </Text>
              ) : '—'}
            </MetadataListItem>
          </MetadataList>
        </Card>

        <Card padding={4}>
          <VStack gap={4}>
            <BulletList label="Responsible roles" items={qp.responsibleRoles} />
            <BulletList label="Activities" items={qp.activities} />
            <HStack gap={4} style={{ flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}><BulletList label="Inputs" items={qp.inputs} /></div>
              <div style={{ flex: 1, minWidth: 220 }}><BulletList label="Outputs" items={qp.outputs} /></div>
            </HStack>
            <BulletList label="Business rules" items={qp.businessRules} />
            <BulletList label="Controls" items={qp.controls} />
            <BulletList label="Evidence" items={qp.evidence} />
            <BulletList label="Approvals" items={qp.approvals} />
            <BulletList label="Exception rules" items={qp.exceptionRules} />
          </VStack>
        </Card>

        <div>
          <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Agent conversion</Heading>
          <Text color="secondary" size="sm" style={{ marginBottom: 'var(--spacing-3)' }}>
            How this Quality Procedure converts into an agent-executable workflow.
          </Text>
          <Card padding={4}>
            <VStack gap={4}>
              <BulletList label="Agent instructions" items={qp.agentConversion.agentInstructions} />
              <BulletList label="Workflow steps" items={qp.agentConversion.workflowSteps} />
              <BulletList label="Guardrails" items={qp.agentConversion.guardrails} />
              <BulletList label="Evaluation criteria" items={qp.agentConversion.evaluationCriteria} />
              <BulletList label="Audit evidence" items={qp.agentConversion.auditEvidence} />
            </VStack>
          </Card>
        </div>
      </VStack>
    </div>
  )
}
