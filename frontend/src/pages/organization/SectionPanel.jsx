// Section side panel — requirements doc Section 5's field list: mandate,
// manager, employee/agent counts, activities, QPs, processes, initiatives,
// AI coverage, process agenticity, realized value, token cost, strategic
// objective contribution.
import { useEffect, useRef } from 'react'
import { VStack } from '@astryxdesign/core/VStack'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { useNavigate } from 'react-router-dom'
import { SidePanel } from '../../components/SidePanel.jsx'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { dataset } from '../../data/mockApi'
import {
  buildOrgIndex, headcountRollup, strategicObjectivesForSection, processesForSection,
  qualityProceduresForSection, aiInitiativesForSection, aiCoverageForSection,
  agenticityForSection, realizedValueForSection, tokenCostForSection, sectionManager,
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

export function SectionPanel({ sectionId, onClose, agenticityMode }) {
  const navigate = useNavigate()
  const lastIdRef = useRef(sectionId)
  useEffect(() => { if (sectionId) lastIdRef.current = sectionId }, [sectionId])
  const displayId = sectionId ?? lastIdRef.current
  if (!displayId) return null

  const node = buildOrgIndex().nodesById[displayId]
  const counts = headcountRollup(displayId)
  const manager = sectionManager(displayId)
  const processes = processesForSection(displayId)
  const qps = qualityProceduresForSection(displayId)
  const initiatives = aiInitiativesForSection(displayId)
  const objectives = strategicObjectivesForSection(displayId)
    .map((id) => dataset.strategicObjectives.find((o) => o.id === id))
    .filter(Boolean)
  const coverage = aiCoverageForSection(displayId)
  const agenticity = agenticityForSection(displayId, agenticityMode)
  const realizedValue = realizedValueForSection(displayId)
  const tokenCost = tokenCostForSection(displayId)

  return (
    <SidePanel isOpen={Boolean(sectionId)} onClose={onClose} eyebrow="Section" title={node.name}>
      <VStack gap={5}>
        <Text color="secondary">{node.mandate ?? 'No mandate on file.'}</Text>

        <MetadataList columns="single">
          <MetadataListItem label="Section manager">{manager ? manager.name : 'Unassigned'}</MetadataListItem>
          <MetadataListItem label="Employees">{counts.human}</MetadataListItem>
          <MetadataListItem label="Agents">{counts.agent}</MetadataListItem>
          <MetadataListItem label="AI work coverage">
            {Math.round(coverage)}% <ValueTag tag="Estimated" />
          </MetadataListItem>
          <MetadataListItem label={`Process agenticity (${agenticityMode})`}>
            {agenticity ?? 'No processes assigned'}
          </MetadataListItem>
          <MetadataListItem label="Realized value">
            <Aed aed={realizedValue} /> <ValueTag tag="Validated" />
          </MetadataListItem>
          <MetadataListItem label="Token cost">
            <Aed aed={tokenCost} /> <ValueTag tag="Observed" />
          </MetadataListItem>
        </MetadataList>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Strategic objective contribution
          </Text>
          {objectives.length === 0 ? (
            <Text size="sm" color="secondary">None linked yet.</Text>
          ) : (
            <VStack gap={1}>{objectives.map((o) => <Text key={o.id} size="sm">{o.name}</Text>)}</VStack>
          )}
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Processes ({processes.length})
          </Text>
          <VStack gap={1}>
            {processes.map((p) => (
              <LinkRow key={p.id} onClick={() => navigate(`/processes/agenticity/${p.id}`)}>
                <Text size="sm">{p.name} <Badge label={p.currentAgenticity} variant="neutral" /></Text>
              </LinkRow>
            ))}
          </VStack>
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            Quality Procedures ({qps.length})
          </Text>
          <VStack gap={1}>
            {qps.map((q) => (
              <LinkRow key={q.id} onClick={() => navigate(`/processes/quality-procedures/${q.id}`)}>
                <Text size="sm">{q.title}</Text>
              </LinkRow>
            ))}
          </VStack>
        </div>

        <div>
          <Text weight="semibold" size="sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            AI initiatives ({initiatives.length})
          </Text>
          <VStack gap={1}>
            {initiatives.map((i) => (
              <LinkRow key={i.id} onClick={() => navigate(`/ai-initiatives/${i.id}`)}>
                <Text size="sm">{i.title} <Badge label={i.status} variant="neutral" /></Text>
              </LinkRow>
            ))}
          </VStack>
        </div>
      </VStack>
    </SidePanel>
  )
}
