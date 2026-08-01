// The visual Harness Designer — requirements doc Section 9. Route:
// /harness-engineering/:harnessId. HAR-D2D-BRD-01 (the D2D BRD Harness,
// the doc's detailed worked example) renders through this same generic
// page — its 10 guardrails, 9 evaluation criteria, and 7 deployment gates
// come straight from the seed data, no special-casing here.
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { getHarnesses } from '../../data/mockApi'
import { agentName } from '../../data/processesAggregates.ts'
import { employeeName, processName } from '../../data/lookups.ts'
import { HARNESS_DEPLOYMENT_GATES } from '../../data/types'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { formatDate } from '../../utils/format.js'
import { HarnessFlowDiagram } from './HarnessFlowDiagram.jsx'
import { HarnessBlockPanel, humanizeKey } from './HarnessBlockPanel.jsx'

const GATE_VARIANT = {
  Development: 'neutral', TechnicalTesting: 'info', BusinessEvaluation: 'info',
  RiskReview: 'warning', Probation: 'warning', Production: 'success', ScaleApproved: 'success',
}

function BulletList({ label, items }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>{label}</Text>
      <VStack gap={1}>{items.map((item) => <Text key={item} size="sm">• {item}</Text>)}</VStack>
    </div>
  )
}

function scoreVariant(score) {
  return score >= 90 ? 'success' : score >= 75 ? 'warning' : 'error'
}

export default function HarnessDesigner() {
  const { harnessId } = useParams()
  const navigate = useNavigate()
  const [harness, setHarness] = useState(undefined)
  const [selectedBlockType, setSelectedBlockType] = useState(null)
  useEffect(() => {
    getHarnesses().then((all) => setHarness(all.find((h) => h.id === harnessId) ?? null))
  }, [harnessId])

  if (harness === undefined) return <div className="page-band page-band--wide"><Skeleton height={480} radius={2} /></div>
  if (harness === null) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="Harness not found" description={`No harness with ID "${harnessId}".`} />
      </div>
    )
  }

  const gateIndex = HARNESS_DEPLOYMENT_GATES.indexOf(harness.status)
  const selectedBlock = harness.workflowStages.find((b) => b.type === selectedBlockType)

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Harness Registry" variant="ghost" onClick={() => navigate('/harness-engineering')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">Harness · {harness.id}</span>
          <Heading level={1} type="display-3">{harness.name}</Heading>
          <Text color="secondary" size="lg">
            v{harness.version} · {agentName(harness.assignedAgentId) ?? 'Unassigned'} ·{' '}
            {processName(harness.assignedProcessId) ?? 'Unassigned process'}
          </Text>
        </div>
        <Badge label={harness.status} variant={GATE_VARIANT[harness.status]} />
      </div>

      <VStack gap={5}>
        <div>
          <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>Deployment gates</Text>
          <HStack gap={2} style={{ flexWrap: 'wrap' }}>
            {HARNESS_DEPLOYMENT_GATES.map((gate, i) => (
              <Badge key={gate} label={gate} variant={i < gateIndex ? 'success' : i === gateIndex ? GATE_VARIANT[gate] : 'neutral'} />
            ))}
          </HStack>
        </div>

        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="Business owner">{employeeName(harness.businessOwnerId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Technical owner">{employeeName(harness.technicalOwnerId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Confidence threshold">{Math.round(harness.confidenceThreshold * 100)}%</MetadataListItem>
            <MetadataListItem label="Retry limits">{harness.retryLimits}</MetadataListItem>
            <MetadataListItem label="Token limit">{harness.tokenLimit.toLocaleString()}</MetadataListItem>
            <MetadataListItem label="Kill switch"><Badge label={harness.killSwitchEnabled ? 'Enabled' : 'Disabled'} variant={harness.killSwitchEnabled ? 'success' : 'neutral'} /></MetadataListItem>
            <MetadataListItem label="Model routing policy">{harness.modelRoutingPolicy}</MetadataListItem>
            <MetadataListItem label="Logging policy">{harness.loggingPolicy}</MetadataListItem>
          </MetadataList>
        </Card>

        <div>
          <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>Workflow — click a block to view its configuration</Text>
          <HarnessFlowDiagram selectedBlockType={selectedBlockType} onSelectBlock={setSelectedBlockType} />
        </div>

        <Card padding={4}>
          <VStack gap={4}>
            <div>
              <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>System instructions</Text>
              <Text color="secondary">{harness.systemInstructions}</Text>
            </div>
            <div>
              <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>Business instructions</Text>
              <Text color="secondary">{harness.businessInstructions}</Text>
            </div>
            <BulletList label="Approved knowledge sources" items={harness.approvedKnowledgeSources} />
            <BulletList label="Tools and APIs" items={harness.toolsAndApis} />
            <BulletList label="Human approval points" items={harness.humanApprovalPoints} />
            <BulletList label="Guardrails" items={harness.guardrails} />
            <BulletList label="Validation rules" items={harness.validationRules} />
            <BulletList label="Escalation rules" items={harness.escalationRules} />
          </VStack>
        </Card>

        <div>
          <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Evaluation suite</Heading>
          <Card padding={4}>
            <VStack gap={3}>
              {harness.evaluationSuite.map((e) => (
                <ProgressBar key={e.criterion} value={e.scorePct} label={humanizeKey(e.criterion)} hasValueLabel variant={scoreVariant(e.scorePct)} />
              ))}
            </VStack>
          </Card>
        </div>

        <div>
          <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Release history</Heading>
          <Card padding={4}>
            <VStack gap={3}>
              {harness.releaseHistory.map((r) => (
                <HStack key={r.version} justify="between" align="flex-start">
                  <div>
                    <Text weight="medium" size="sm" style={{ display: 'block' }}>v{r.version}</Text>
                    <Text size="sm" color="secondary">{r.notes}</Text>
                  </div>
                  <Text size="sm" color="secondary">{formatDate(r.date)}</Text>
                </HStack>
              ))}
            </VStack>
          </Card>
        </div>
      </VStack>

      <HarnessBlockPanel blockType={selectedBlockType} block={selectedBlock} onClose={() => setSelectedBlockType(null)} />
    </div>
  )
}
