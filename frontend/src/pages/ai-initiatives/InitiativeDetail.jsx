// AI Initiative detail — requirements doc Section 7's full field list.
// Route: /ai-initiatives/:initiativeId.
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { getAIInitiatives } from '../../data/mockApi'
import { divisionName, sectionName, agentName } from '../../data/processesAggregates.ts'
import { employeeName, processName, qpTitle, strategicObjectiveName, excellenceCriterionName, d2dDemandTitle } from '../../data/lookups.ts'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { formatDate } from '../../utils/format.js'

const STATUS_VARIANT = { OnTrack: 'success', AtRisk: 'warning', Delayed: 'error', Blocked: 'error', Complete: 'neutral' }
const RISK_VARIANT = { Low: 'success', Medium: 'warning', High: 'error' }

export default function InitiativeDetail() {
  const { initiativeId } = useParams()
  const navigate = useNavigate()
  const [initiative, setInitiative] = useState(undefined)
  useEffect(() => {
    getAIInitiatives().then((all) => setInitiative(all.find((i) => i.id === initiativeId) ?? null))
  }, [initiativeId])

  if (initiative === undefined) return <div className="page-band page-band--wide"><Skeleton height={420} radius={2} /></div>
  if (initiative === null) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="Initiative not found" description={`No AI initiative with ID "${initiativeId}".`} />
      </div>
    )
  }

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to AI Initiatives" variant="ghost" onClick={() => navigate('/ai-initiatives')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">AI Initiative · {initiative.id}</span>
        <Heading level={1} type="display-3">{initiative.title}</Heading>
        <Text color="secondary" size="lg">{divisionName(initiative.divisionId)} · {sectionName(initiative.sectionId)}</Text>
      </div>

      <VStack gap={5}>
        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="Status"><Badge label={initiative.status} variant={STATUS_VARIANT[initiative.status]} /></MetadataListItem>
            <MetadataListItem label="Delivery stage"><Badge label={initiative.stage} variant="info" /></MetadataListItem>
            <MetadataListItem label="AI type">{initiative.aiType}</MetadataListItem>
            <MetadataListItem label="Agenticity target"><Badge label={initiative.agenticityTarget} variant="neutral" /></MetadataListItem>
            <MetadataListItem label="Risk level"><Badge label={initiative.riskLevel} variant={RISK_VARIANT[initiative.riskLevel]} /></MetadataListItem>
            <MetadataListItem label="Go-live date">{initiative.goLiveDate ? formatDate(initiative.goLiveDate) : 'Not live yet'}</MetadataListItem>
            <MetadataListItem label="Data readiness">{initiative.dataReadiness}%</MetadataListItem>
            <MetadataListItem label="Harness readiness">{initiative.harnessReadiness}%</MetadataListItem>
            <MetadataListItem label="Token budget">{initiative.tokenBudget.toLocaleString()}</MetadataListItem>
            <MetadataListItem label="Expected value">
              <Aed usd={initiative.expectedValue.value} /> <ValueTag tag={initiative.expectedValue.tag} />
            </MetadataListItem>
            <MetadataListItem label="Realized value">
              <Aed usd={initiative.realizedValue.value} /> <ValueTag tag={initiative.realizedValue.tag} />
            </MetadataListItem>
            <MetadataListItem label="Total cost"><Aed usd={initiative.totalCost} /></MetadataListItem>
          </MetadataList>
        </Card>

        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="Strategic objective">{strategicObjectiveName(initiative.strategicObjectiveId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Excellence criterion">{excellenceCriterionName(initiative.excellenceCriterionId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Related process">
              {initiative.relatedProcessId ? (
                <Text color="accent" onClick={() => navigate(`/processes/agenticity/${initiative.relatedProcessId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                  {processName(initiative.relatedProcessId)}
                </Text>
              ) : '—'}
            </MetadataListItem>
            <MetadataListItem label="Related Quality Procedure">
              {initiative.relatedQpId ? (
                <Text color="accent" onClick={() => navigate(`/processes/quality-procedures/${initiative.relatedQpId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                  {qpTitle(initiative.relatedQpId)}
                </Text>
              ) : '—'}
            </MetadataListItem>
            <MetadataListItem label="D2D demand">
              {initiative.d2dDemandId ? (
                <Text color="accent" onClick={() => navigate(`/d2d-integration/demands/${initiative.d2dDemandId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                  {d2dDemandTitle(initiative.d2dDemandId)}
                </Text>
              ) : '—'}
            </MetadataListItem>
            <MetadataListItem label="Business owner">{employeeName(initiative.businessOwnerId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="IT owner">{employeeName(initiative.itOwnerId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Agent owner">
              {initiative.agentOwnerId ? (
                <Text color="accent" onClick={() => navigate(`/agents/${initiative.agentOwnerId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                  {agentName(initiative.agentOwnerId)}
                </Text>
              ) : 'None assigned yet'}
            </MetadataListItem>
          </MetadataList>
        </Card>
      </VStack>
    </div>
  )
}
