// Custom React Flow node renderers shared by OrgChart.jsx (Mode A) and
// OrgNetworkGraph.jsx (Mode B). Kept in one file since all three are small
// and change together whenever the node "look" changes.
import { Handle, Position as FlowPosition } from '@xyflow/react'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { WORKFORCE_TYPE_LABELS } from '../../data/types'

const LEVEL_LABEL = {
  Enterprise: 'Enterprise', Division: 'Division', SuperDepartment: 'Super Department',
  Department: 'Department', Section: 'Section',
}

const cardStyle = (isDimmed, extra) => ({
  width: 220, padding: '10px 12px', borderRadius: 'var(--radius-container)',
  border: '1px solid var(--color-border)', background: 'var(--color-background-surface)',
  cursor: 'pointer', opacity: isDimmed ? 0.4 : 1, transition: 'opacity 0.2s ease-out',
  ...extra,
})

export function OrgLevelNode({ data }) {
  const { node, counts, hasChildren, isCollapsed, isDimmed, agenticityLabel, onToggleCollapse, onSelect } = data
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(node)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(node) }}
      style={cardStyle(isDimmed)}
    >
      <Handle type="target" position={FlowPosition.Top} style={{ visibility: node.parentId ? 'visible' : 'hidden' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>{LEVEL_LABEL[node.level]}</span>
        {hasChildren && (
          <button
            type="button"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id) }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2, lineHeight: 0, fontSize: 12 }}
          >
            {isCollapsed ? '▸' : '▾'}
          </button>
        )}
      </div>
      <Text weight="semibold" size="sm" style={{ display: 'block', margin: '2px 0 6px' }}>{node.name}</Text>
      <div style={{ display: 'flex', gap: 6 }}>
        <Badge label={`${counts.human} human`} variant="neutral" />
        <Badge label={`${counts.agent} agent`} variant="info" />
      </div>
      {agenticityLabel && (
        <Text size="xs" color="secondary" style={{ display: 'block', marginTop: 4 }}>{agenticityLabel} agenticity</Text>
      )}
      <Handle type="source" position={FlowPosition.Bottom} style={{ visibility: hasChildren && !isCollapsed ? 'visible' : 'hidden' }} />
    </div>
  )
}

export function PositionNode({ data }) {
  const { position, employeeName, agentCount, isDimmed, color, onSelect } = data
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(position)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(position) }}
      style={cardStyle(isDimmed, { width: 210, borderLeft: `4px solid ${color}` })}
    >
      <Handle type="target" position={FlowPosition.Top} />
      <Text weight="semibold" size="sm" style={{ display: 'block' }}>{position.title}</Text>
      <Text size="xs" color="secondary" style={{ display: 'block', margin: '2px 0 6px' }}>
        {employeeName ?? WORKFORCE_TYPE_LABELS[position.workforceType]}
      </Text>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Badge label={WORKFORCE_TYPE_LABELS[position.workforceType]} variant="neutral" />
        {agentCount > 0 && <Badge label={`${agentCount} agent${agentCount > 1 ? 's' : ''}`} variant="info" />}
      </div>
      <Handle type="source" position={FlowPosition.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
}

export function SectionHeaderNode({ data }) {
  const { node, isDimmed, agenticityLabel } = data
  return (
    <div style={{ padding: '4px 10px', opacity: isDimmed ? 0.5 : 1 }}>
      <Handle type="target" position={FlowPosition.Top} style={{ visibility: 'hidden' }} />
      <Text weight="semibold" size="xs">{node.name}</Text>
      {agenticityLabel && <Text size="xs" color="secondary" style={{ display: 'block' }}>{agenticityLabel} agenticity</Text>}
      <Handle type="source" position={FlowPosition.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
}
