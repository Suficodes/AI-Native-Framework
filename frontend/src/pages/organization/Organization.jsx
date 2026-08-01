// Organization module — requirements doc Section 5. Route: "/organization"
// (see router.jsx). Toolbar (view mode, current/target toggle, filters) +
// Mode A/B graph + Section/Position side panels.
import { useEffect, useMemo, useState } from 'react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { getOrganization, dataset } from '../../data/mockApi'
import { OrgFilters } from './OrgFilters.jsx'
import { OrgChart } from './OrgChart.jsx'
import { OrgNetworkGraph } from './OrgNetworkGraph.jsx'
import { SectionPanel } from './SectionPanel.jsx'
import { PositionPanel } from './PositionPanel.jsx'
import { agenticityForSection, performanceStatusForPosition, strategicObjectivesForSection } from '../../data/organizationAggregates.ts'

const EMPTY_FILTERS = {
  search: '', divisionId: null, workforceType: null, agenticityLevel: null,
  performanceStatus: null, strategicObjectiveId: null,
}

function positionMatches(position, filters, agenticityMode) {
  if (filters.divisionId && position.divisionId !== filters.divisionId) return false
  if (filters.workforceType && position.workforceType !== filters.workforceType) return false
  if (filters.agenticityLevel && agenticityForSection(position.sectionId, agenticityMode) !== filters.agenticityLevel) return false
  if (filters.performanceStatus && performanceStatusForPosition(position.id) !== filters.performanceStatus) return false
  if (filters.strategicObjectiveId && !strategicObjectivesForSection(position.sectionId).includes(filters.strategicObjectiveId)) return false
  if (filters.search) {
    const q = filters.search.toLowerCase()
    const employee = position.assignedEmployeeId ? dataset.employees.find((e) => e.id === position.assignedEmployeeId) : null
    if (!position.title.toLowerCase().includes(q) && !(employee && employee.name.toLowerCase().includes(q))) return false
  }
  return true
}

function ancestorChain(nodeId, nodesById) {
  const chain = []
  let current = nodesById[nodeId]
  while (current?.parentId) { chain.push(current.parentId); current = nodesById[current.parentId] }
  return chain
}

export default function Organization() {
  const [ready, setReady] = useState(false)
  useEffect(() => { getOrganization().then(() => setReady(true)) }, [])

  const [mode, setMode] = useState('traditional')
  const [agenticityMode, setAgenticityMode] = useState('current')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [collapsedIds, setCollapsedIds] = useState(() => new Set(
    dataset.orgNodes.filter((n) => n.level === 'SuperDepartment' || n.level === 'Department' || n.level === 'Section').map((n) => n.id),
  ))
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [selectedPositionId, setSelectedPositionId] = useState(null)

  const hasActiveFilter = Boolean(
    filters.search || filters.divisionId || filters.workforceType
    || filters.agenticityLevel || filters.performanceStatus || filters.strategicObjectiveId,
  )

  const matchedPositionIds = useMemo(() => {
    if (!hasActiveFilter) return new Set()
    return new Set(dataset.positions.filter((p) => positionMatches(p, filters, agenticityMode)).map((p) => p.id))
  }, [filters, agenticityMode, hasActiveFilter])

  useEffect(() => {
    if (!hasActiveFilter) return
    const nodesById = Object.fromEntries(dataset.orgNodes.map((n) => [n.id, n]))
    const toExpand = new Set()
    for (const position of dataset.positions) {
      if (!matchedPositionIds.has(position.id)) continue
      toExpand.add(position.sectionId)
      for (const ancestorId of ancestorChain(position.sectionId, nodesById)) toExpand.add(ancestorId)
    }
    setCollapsedIds((prev) => new Set([...prev].filter((id) => !toExpand.has(id))))
  }, [matchedPositionIds, hasActiveFilter])

  const toggleCollapse = (nodeId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId)
      return next
    })
  }

  const handleSelectNode = (node) => { if (node.level === 'Section') setSelectedSectionId(node.id) }
  const handleSelectPosition = (position) => setSelectedPositionId(position.id)

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Organization</Heading>
        <Text color="secondary" size="lg">
          Enterprise → Division → Super Department → Department → Section → Position, and how human,
          human+agent, and agent-only work is distributed across it.
        </Text>
      </div>

      {!ready ? (
        <Skeleton height={640} radius={2} />
      ) : (
        <VStack gap={4}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
            <SegmentedControl value={mode} onChange={setMode} label="View mode">
              <SegmentedControlItem value="traditional" label="Traditional org chart" />
              <SegmentedControlItem value="network" label="AI-native network" />
            </SegmentedControl>
            <SegmentedControl value={agenticityMode} onChange={setAgenticityMode} label="Agenticity state">
              <SegmentedControlItem value="current" label="Current state" />
              <SegmentedControlItem value="target" label="Target state" />
            </SegmentedControl>
          </div>

          <OrgFilters filters={filters} onChange={setFilters} />

          {mode === 'traditional' ? (
            <OrgChart
              collapsedIds={collapsedIds} onToggleCollapse={toggleCollapse}
              matchedPositionIds={matchedPositionIds} hasActiveFilter={hasActiveFilter}
              agenticityMode={agenticityMode}
              onSelectNode={handleSelectNode} onSelectPosition={handleSelectPosition}
            />
          ) : (
            <OrgNetworkGraph
              matchedPositionIds={matchedPositionIds} hasActiveFilter={hasActiveFilter}
              agenticityMode={agenticityMode} onSelectPosition={handleSelectPosition}
            />
          )}
        </VStack>
      )}

      <SectionPanel sectionId={selectedSectionId} onClose={() => setSelectedSectionId(null)} agenticityMode={agenticityMode} />
      <PositionPanel positionId={selectedPositionId} onClose={() => setSelectedPositionId(null)} />
    </div>
  )
}
