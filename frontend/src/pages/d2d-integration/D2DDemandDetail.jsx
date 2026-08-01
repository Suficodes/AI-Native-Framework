// D2D Demand Detail — requirements doc Section 11's full field list, plus
// the contribution timeline showing which activities were completed by
// Human / Copilot / Agent / Human approval.
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
import { getD2DDemands } from '../../data/mockApi'
import { divisionName, agentName, harnessName } from '../../data/processesAggregates.ts'
import { employeeName, processName, qpTitle, strategicObjectiveName } from '../../data/lookups.ts'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { formatDate } from '../../utils/format.js'

const ACTOR_VARIANT = { Human: 'neutral', Copilot: 'info', Agent: 'success', HumanApproval: 'warning' }

function BulletList({ label, items }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>{label}</Text>
      <VStack gap={1}>{items.map((item) => <Text key={item} size="sm">• {item}</Text>)}</VStack>
    </div>
  )
}

export default function D2DDemandDetail() {
  const { demandId } = useParams()
  const navigate = useNavigate()
  const [demand, setDemand] = useState(undefined)
  useEffect(() => {
    getD2DDemands().then((all) => setDemand(all.find((d) => d.id === demandId) ?? null))
  }, [demandId])

  if (demand === undefined) return <div className="page-band page-band--wide"><Skeleton height={420} radius={2} /></div>
  if (demand === null) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="Demand not found" description={`No D2D demand with ID "${demandId}".`} />
      </div>
    )
  }

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to D2D Integration" variant="ghost" onClick={() => navigate('/d2d-integration')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">D2D Demand · {demand.id}</span>
        <Heading level={1} type="display-3">{demand.title}</Heading>
        <Text color="secondary" size="lg">{divisionName(demand.divisionId)} · submitted by {employeeName(demand.submitterEmployeeId) ?? '—'}</Text>
      </div>

      <VStack gap={5}>
        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="Stage"><Badge label={demand.stage} variant="info" /></MetadataListItem>
            <MetadataListItem label="SLA">{demand.slaDays} days</MetadataListItem>
            <MetadataListItem label="BRD status"><Badge label={demand.brdStatus} variant="neutral" /></MetadataListItem>
            <MetadataListItem label="Go-live status"><Badge label={demand.goLiveStatus === 'Live' ? 'Live' : 'Not live'} variant={demand.goLiveStatus === 'Live' ? 'success' : 'neutral'} /></MetadataListItem>
            <MetadataListItem label="VR status">{demand.vrStatus}</MetadataListItem>
            <MetadataListItem label="Estimated value"><Aed usd={demand.estimatedValue.value} /> <ValueTag tag={demand.estimatedValue.tag} /></MetadataListItem>
            <MetadataListItem label="Token budget">{demand.tokenBudget.toLocaleString()}</MetadataListItem>
            <MetadataListItem label="Process">
              <Text color="accent" onClick={() => navigate(`/processes/agenticity/${demand.processId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                {processName(demand.processId) ?? '—'}
              </Text>
            </MetadataListItem>
            <MetadataListItem label="Quality Procedure">
              {demand.qpId ? (
                <Text color="accent" onClick={() => navigate(`/processes/quality-procedures/${demand.qpId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                  {qpTitle(demand.qpId)}
                </Text>
              ) : '—'}
            </MetadataListItem>
            <MetadataListItem label="Strategic objective">{strategicObjectiveName(demand.strategicObjectiveId) ?? '—'}</MetadataListItem>
            <MetadataListItem label="Agent proposed">
              {demand.agentProposedId ? (
                <Text color="accent" onClick={() => navigate(`/agents/${demand.agentProposedId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                  {agentName(demand.agentProposedId)}
                </Text>
              ) : 'None proposed yet'}
            </MetadataListItem>
            <MetadataListItem label="Harness proposed">
              {demand.harnessProposedId ? (
                <Text color="accent" onClick={() => navigate(`/harness-engineering/${demand.harnessProposedId}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
                  {harnessName(demand.harnessProposedId)}
                </Text>
              ) : 'None proposed yet'}
            </MetadataListItem>
          </MetadataList>
        </Card>

        <Card padding={4}>
          <VStack gap={4}>
            <div>
              <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>AI opportunity</Text>
              <Text color="secondary">{demand.aiOpportunity}</Text>
            </div>
            <HStack gap={4} style={{ flexWrap: 'wrap' }}>
              <div>
                <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>Architecture assessment</Text>
                <Text size="sm" color="secondary">{demand.architectureAssessment}</Text>
              </div>
              <div>
                <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>Security assessment</Text>
                <Text size="sm" color="secondary">{demand.securityAssessment}</Text>
              </div>
            </HStack>
            <BulletList label="Stakeholders" items={demand.stakeholders} />
            <BulletList label="Duplicate findings" items={demand.duplicateFindings.length ? demand.duplicateFindings : null} />
          </VStack>
        </Card>

        <div>
          <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Delivery milestones</Heading>
          <Card padding={4}>
            <VStack gap={2}>
              {demand.milestones.map((m) => (
                <HStack key={m.name} justify="between" align="center">
                  <Text size="sm">{m.name}</Text>
                  <HStack gap={2} align="center">
                    <Text size="sm" color="secondary">{formatDate(m.date)}</Text>
                    <Badge label={m.done ? 'Done' : 'Pending'} variant={m.done ? 'success' : 'neutral'} />
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </Card>
        </div>

        <div>
          <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Contribution timeline</Heading>
          <Card padding={4}>
            {demand.contributionTimeline.length === 0 ? (
              <Text size="sm" color="secondary">No activity recorded yet.</Text>
            ) : (
              <VStack gap={3}>
                {demand.contributionTimeline.map((event, i) => (
                  <HStack key={`${event.timestamp}-${i}`} justify="between" align="center">
                    <HStack gap={2} align="center">
                      <Badge label={event.actor} variant={ACTOR_VARIANT[event.actor]} />
                      <Text size="sm">{event.activity}</Text>
                    </HStack>
                    <Text size="sm" color="secondary">{formatDate(event.timestamp)}</Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </Card>
        </div>
      </VStack>
    </div>
  )
}
