// Position side panel — requirements doc Section 5's field list: title, job
// description, key responsibilities, activities, competencies, assigned
// employee, assigned Copilot/agents, AI work-coverage %, human/agent
// contribution, quality-adjusted AI coverage, verified capacity released,
// related processes, related Quality Procedures. No hardcoding of the
// Senior Business Analyst worked example — its six activity rows and
// assigned agent fall out of the generic rendering below because the
// underlying data (positions.seed.ts, organizationAggregates.ts) already
// carries the exact figures from the requirements doc.
import { useEffect, useRef } from 'react'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { useNavigate } from 'react-router-dom'
import { SidePanel } from '../../components/SidePanel.jsx'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { dataset } from '../../data/mockApi'
import { WORKFORCE_TYPE_LABELS } from '../../data/types'
import {
  agentsForPosition, performanceStatusForPosition, relatedProcessesForPosition, relatedQpsForPosition,
} from '../../data/organizationAggregates.ts'

function LinkRow({ onClick, children }) {
  return (
    <div
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      style={{ cursor: 'pointer', padding: '4px 0' }}
    >
      {children}
    </div>
  )
}

export function PositionPanel({ positionId, onClose }) {
  const navigate = useNavigate()
  const lastIdRef = useRef(positionId)
  useEffect(() => { if (positionId) lastIdRef.current = positionId }, [positionId])
  const displayId = positionId ?? lastIdRef.current
  if (!displayId) return null

  const position = dataset.positions.find((p) => p.id === displayId)
  const jobDescription = dataset.jobDescriptions.find((j) => j.id === position.jobDescriptionId)
  const employee = position.assignedEmployeeId
    ? dataset.employees.find((e) => e.id === position.assignedEmployeeId)
    : null
  const agents = agentsForPosition(displayId)
  const performanceStatus = performanceStatusForPosition(displayId)
  const processes = relatedProcessesForPosition(displayId)
  const qps = relatedQpsForPosition(displayId)

  return (
    <SidePanel isOpen={Boolean(positionId)} onClose={onClose} eyebrow={WORKFORCE_TYPE_LABELS[position.workforceType]} title={position.title}>
      <VStack gap={5}>
        <Text color="secondary">{jobDescription?.summary}</Text>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Key responsibilities</Text>
          <VStack gap={1}>
            {jobDescription?.keyResponsibilities.map((r) => <Text key={r} size="sm">• {r}</Text>)}
          </VStack>
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Competencies</Text>
          <HStack gap={1} style={{ flexWrap: 'wrap' }}>
            {jobDescription?.competencies.map((c) => <Badge key={c} label={c} variant="neutral" />)}
          </HStack>
        </div>

        {jobDescription && jobDescription.activities.length > 0 && (
          <div>
            <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>Activities — AI contribution</Text>
            <VStack gap={2}>
              {jobDescription.activities.map((a) => (
                <HStack key={a.id} justify="between" align="center">
                  <Text size="sm">{a.name}</Text>
                  <Badge
                    label={`${a.aiContributionPct}%`}
                    variant={a.aiContributionPct >= 70 ? 'success' : a.aiContributionPct > 0 ? 'info' : 'neutral'}
                  />
                </HStack>
              ))}
            </VStack>
          </div>
        )}

        <MetadataList columns="single">
          <MetadataListItem label="Assigned employee">{employee ? employee.name : 'Unassigned'}</MetadataListItem>
          <MetadataListItem label="Assigned Copilot / agents">
            {agents.length === 0 ? 'None' : (
              <VStack gap={1}>
                {agents.map((a) => (
                  <LinkRow key={a.id} onClick={() => navigate(`/agents/${a.id}`)}>{a.name}</LinkRow>
                ))}
              </VStack>
            )}
          </MetadataListItem>
          <MetadataListItem label="AI work coverage">
            {position.aiWorkCoveragePct}% <ValueTag tag="Estimated" />
          </MetadataListItem>
          <MetadataListItem label="Human contribution">{position.humanContributionPct}%</MetadataListItem>
          <MetadataListItem label="Agent contribution">{position.agentContributionPct}%</MetadataListItem>
          <MetadataListItem label="Quality-adjusted AI coverage">
            {position.qualityAdjustedAiCoveragePct}% <ValueTag tag="Observed" />
          </MetadataListItem>
          <MetadataListItem label="Verified capacity released">
            {position.verifiedCapacityReleasedHours.value} h <ValueTag tag={position.verifiedCapacityReleasedHours.tag} />
          </MetadataListItem>
          <MetadataListItem label="Performance status">
            <Badge label={performanceStatus} variant="neutral" />
          </MetadataListItem>
        </MetadataList>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Related processes ({processes.length})
          </Text>
          <VStack gap={1}>
            {processes.map((p) => (
              <LinkRow key={p.id} onClick={() => navigate(`/processes/agenticity/${p.id}`)}>
                <Text size="sm">{p.name}</Text>
              </LinkRow>
            ))}
          </VStack>
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Related Quality Procedures ({qps.length})
          </Text>
          <VStack gap={1}>
            {qps.map((q) => (
              <LinkRow key={q.id} onClick={() => navigate(`/processes/quality-procedures/${q.id}`)}>
                <Text size="sm">{q.title}</Text>
              </LinkRow>
            ))}
          </VStack>
        </div>
      </VStack>
    </SidePanel>
  )
}
