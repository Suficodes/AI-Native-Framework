// Overview tab — reporting relationships + org placement (requirements doc
// Section 8's worked example: "Manager: IT Lead, Business Owner: DBE
// Manager, Technical Owner: AI Platform Team, Risk Owner: Information
// Security").
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { divisionName, sectionName } from '../../../data/processesAggregates.ts'
import { employeeName } from '../../../data/lookups.ts'
import { positionForAgent } from '../../../data/agentsAggregates.ts'
import { formatDate } from '../../../utils/format.js'

export function OverviewTab({ agent }) {
  const position = positionForAgent(agent)
  return (
    <VStack gap={5}>
      <Card padding={4}>
        <MetadataList columns={3}>
          <MetadataListItem label="Division">{divisionName(agent.orgAssignment.divisionId)}</MetadataListItem>
          <MetadataListItem label="Section">{sectionName(agent.orgAssignment.sectionId)}</MetadataListItem>
          <MetadataListItem label="Position">{position ? position.title : 'Not tied to a specific position'}</MetadataListItem>
          <MetadataListItem label="Agent type">{agent.agentType}</MetadataListItem>
          <MetadataListItem label="Model">{agent.model} ({agent.modelVersion})</MetadataListItem>
          <MetadataListItem label="Working hours">{agent.workingHours}</MetadataListItem>
          <MetadataListItem label="Date onboarded">{formatDate(agent.dateOnboarded)}</MetadataListItem>
          <MetadataListItem label="Next performance review">{formatDate(agent.nextPerformanceReview)}</MetadataListItem>
        </MetadataList>
      </Card>

      <Card padding={4}>
        <MetadataList columns={2}>
          <MetadataListItem label="Manager">{employeeName(agent.managerEmployeeId) ?? '—'}</MetadataListItem>
          <MetadataListItem label="Business owner">{employeeName(agent.businessOwnerEmployeeId) ?? '—'}</MetadataListItem>
          <MetadataListItem label="Technical owner">{employeeName(agent.technicalOwnerEmployeeId) ?? '—'}</MetadataListItem>
          <MetadataListItem label="Risk owner">{employeeName(agent.riskOwnerEmployeeId) ?? '—'}</MetadataListItem>
          <MetadataListItem label="Product owner">{agent.productOwnerEmployeeId ? employeeName(agent.productOwnerEmployeeId) : 'Not assigned'}</MetadataListItem>
        </MetadataList>
      </Card>
    </VStack>
  )
}
