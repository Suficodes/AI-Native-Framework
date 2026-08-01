// OrgFilters — the Organization module's filter bar. Lifts a plain filter
// state object to the parent; Organization.jsx turns it into a position
// predicate via data/organizationAggregates.ts (AND semantics, see the
// 2026-08-01 design spec).
import { Selector } from '@astryxdesign/core/Selector'
import { TextInput } from '@astryxdesign/core/TextInput'
import { dataset } from '../../data/mockApi'
import { AGENTICITY_LABELS, AGENTICITY_ORDER, WORKFORCE_TYPE_LABELS } from '../../data/types'

const DIVISION_OPTIONS = dataset.orgNodes
  .filter((n) => n.level === 'Division')
  .map((n) => ({ value: n.id, label: n.name }))

const WORKFORCE_OPTIONS = Object.entries(WORKFORCE_TYPE_LABELS).map(([value, label]) => ({ value, label }))

const AGENTICITY_OPTIONS = AGENTICITY_ORDER.map((value) => ({ value, label: `${value} — ${AGENTICITY_LABELS[value]}` }))

const PERFORMANCE_OPTIONS = ['ExceedsExpectations', 'MeetsExpectations', 'NeedsOptimization', 'Restricted', 'Suspended', 'Retired', 'N/A']
  .map((value) => ({ value, label: value }))

const OBJECTIVE_OPTIONS = dataset.strategicObjectives.map((o) => ({ value: o.id, label: o.name }))

export function OrgFilters({ filters, onChange }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value })
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap', alignItems: 'center' }}>
      <TextInput
        label="Search" isLabelHidden size="sm" width={220} placeholder="Search name or position…"
        value={filters.search} onChange={set('search')}
      />
      <Selector
        label="Division" isLabelHidden size="sm" width={200} hasClear
        options={DIVISION_OPTIONS} value={filters.divisionId} onChange={set('divisionId')} placeholder="Division"
      />
      <Selector
        label="Workforce type" isLabelHidden size="sm" width={190} hasClear
        options={WORKFORCE_OPTIONS} value={filters.workforceType} onChange={set('workforceType')} placeholder="Workforce type"
      />
      <Selector
        label="Agenticity" isLabelHidden size="sm" width={220} hasClear
        options={AGENTICITY_OPTIONS} value={filters.agenticityLevel} onChange={set('agenticityLevel')} placeholder="Agenticity level"
      />
      <Selector
        label="Performance" isLabelHidden size="sm" width={180} hasClear
        options={PERFORMANCE_OPTIONS} value={filters.performanceStatus} onChange={set('performanceStatus')} placeholder="Performance status"
      />
      <Selector
        label="Strategic objective" isLabelHidden size="sm" width={210} hasClear
        options={OBJECTIVE_OPTIONS} value={filters.strategicObjectiveId} onChange={set('strategicObjectiveId')} placeholder="Strategic objective"
      />
    </div>
  )
}
