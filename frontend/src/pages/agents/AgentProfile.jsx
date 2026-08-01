// Agent Profile — requirements doc Section 8's 9-tab page. Route:
// /agents/:agentId. AGT-D2D-DOC-01 (the D2D Documentation Agent, the
// doc's worked example) renders through this same generic page.
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Badge } from '@astryxdesign/core/Badge'
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { getAgents } from '../../data/mockApi'
import { divisionName, sectionName } from '../../data/processesAggregates.ts'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { OverviewTab } from './tabs/OverviewTab.jsx'
import { DigitalJobDescriptionTab } from './tabs/DigitalJobDescriptionTab.jsx'
import { ProcessAssignmentsTab } from './tabs/ProcessAssignmentsTab.jsx'
import { HarnessesTab } from './tabs/HarnessesTab.jsx'
import { PerformanceTab } from './tabs/PerformanceTab.jsx'
import { TokenUsageTab } from './tabs/TokenUsageTab.jsx'
import { ValueTab } from './tabs/ValueTab.jsx'
import { RiskComplianceTab } from './tabs/RiskComplianceTab.jsx'
import { AuditHistoryTab } from './tabs/AuditHistoryTab.jsx'

const STATUS_VARIANT = {
  Active: 'success', Probation: 'warning', Evaluation: 'info', Development: 'neutral',
  Proposed: 'neutral', Restricted: 'warning', Suspended: 'error', Retired: 'neutral',
}

const TABS = [
  { value: 'overview', label: 'Overview', Component: OverviewTab },
  { value: 'job-description', label: 'Digital Job Description', Component: DigitalJobDescriptionTab },
  { value: 'process-assignments', label: 'Process Assignments', Component: ProcessAssignmentsTab },
  { value: 'harnesses', label: 'Harnesses', Component: HarnessesTab },
  { value: 'performance', label: 'Performance', Component: PerformanceTab },
  { value: 'token-usage', label: 'Token Usage', Component: TokenUsageTab },
  { value: 'value', label: 'Value', Component: ValueTab },
  { value: 'risk-compliance', label: 'Risk & Compliance', Component: RiskComplianceTab },
  { value: 'audit-history', label: 'Audit History', Component: AuditHistoryTab },
]

export default function AgentProfile() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(undefined)
  const [tab, setTab] = useState('overview')
  useEffect(() => {
    getAgents().then((all) => setAgent(all.find((a) => a.id === agentId) ?? null))
  }, [agentId])

  if (agent === undefined) return <div className="page-band page-band--wide"><Skeleton height={420} radius={2} /></div>
  if (agent === null) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="Agent not found" description={`No agent with ID "${agentId}".`} />
      </div>
    )
  }

  const ActiveTab = TABS.find((t) => t.value === tab).Component

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Agents" variant="ghost" onClick={() => navigate('/agents')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">Agent · {agent.id}</span>
          <Heading level={1} type="display-3">{agent.name}</Heading>
          <Text color="secondary" size="lg">{agent.digitalJobTitle} · {divisionName(agent.orgAssignment.divisionId)} · {sectionName(agent.orgAssignment.sectionId)}</Text>
        </div>
        <Badge label={agent.status} variant={STATUS_VARIANT[agent.status]} />
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)', overflowX: 'auto' }}>
        <TabList value={tab} onChange={setTab}>
          {TABS.map((t) => <Tab key={t.value} value={t.value} label={t.label} />)}
        </TabList>
      </div>

      <ActiveTab agent={agent} />
    </div>
  )
}
