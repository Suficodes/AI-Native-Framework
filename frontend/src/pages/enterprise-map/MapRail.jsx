// The Enterprise Map's control rail: lens selector, search, filters, division
// scope, flow toggles and current/target state — Section 18's required
// functionality, all of it feeding the one applyLens() call.
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Badge } from '@astryxdesign/core/Badge'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Selector } from '@astryxdesign/core/Selector'
import { Switch } from '@astryxdesign/core/Switch'
import { LENSES, FILTERS } from '../../data/enterpriseMapLenses.ts'
import { EDGE_KIND_LABELS, legendFor } from './mapColors.js'

/** Flows the doc names as separately toggleable. */
const FLOW_TOGGLES = ['value', 'token', 'supervises', 'depends', 'contributes']

function RailSection({ title, children }) {
  return (
    <VStack gap={2}>
      <Text size="sm" weight="semibold" style={{ display: 'block' }}>{title}</Text>
      {children}
    </VStack>
  )
}

export function MapRail({
  lensId, onLens, search, onSearch, filters, onToggleFilter,
  divisionOptions, divisionNodeId, onDivision, extraEdgeKinds, onToggleEdge,
  targetState, onTargetState, mode, nodeCount, edgeCount,
}) {
  const spec = LENSES.find((l) => l.id === lensId)
  const legend = legendFor(spec.colorBy, mode)

  return (
    <VStack gap={5} style={{ padding: 'var(--spacing-4)', overflowY: 'auto', height: '100%' }}>
      <RailSection title="Lens">
        <VStack gap={1}>
          {LENSES.map((lens) => (
            <button
              key={lens.id}
              type="button"
              onClick={() => onLens(lens.id)}
              aria-current={lens.id === lensId ? 'true' : undefined}
              style={{
                textAlign: 'left', padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid ' + (lens.id === lensId ? 'var(--color-accent)' : 'transparent'),
                background: lens.id === lensId ? 'var(--color-background-muted)' : 'transparent',
                color: lens.id === lensId ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
                fontWeight: lens.id === lensId ? 600 : 400,
                fontSize: 'var(--font-size-sm)', fontFamily: 'inherit',
              }}
            >
              {lens.label}
            </button>
          ))}
        </VStack>
      </RailSection>

      <RailSection title="Search">
        <TextInput
          label="Search the map" isLabelHidden size="sm"
          placeholder="Find a node…" value={search} onChange={onSearch}
        />
      </RailSection>

      <RailSection title="Scope">
        <Selector
          label="Division" isLabelHidden size="sm" hasClear
          options={divisionOptions} value={divisionNodeId} onChange={onDivision}
          placeholder="All divisions"
        />
      </RailSection>

      <RailSection title="Show only">
        <VStack gap={2}>
          {FILTERS.map((filter) => (
            <Switch
              key={filter.id}
              label={filter.label}
              value={filters.includes(filter.id)}
              onChange={() => onToggleFilter(filter.id)}
            />
          ))}
        </VStack>
      </RailSection>

      <RailSection title="Flows">
        <VStack gap={2}>
          {FLOW_TOGGLES.map((kind) => (
            <Switch
              key={kind}
              label={EDGE_KIND_LABELS[kind]}
              value={extraEdgeKinds.includes(kind)}
              onChange={() => onToggleEdge(kind)}
            />
          ))}
        </VStack>
      </RailSection>

      <RailSection title="State">
        <Switch
          label={targetState ? 'Target state' : 'Current state'}
          value={targetState}
          onChange={onTargetState}
        />
      </RailSection>

      <RailSection title="Legend">
        <VStack gap={2}>
          {legend.map((entry) => (
            <HStack key={entry.label} gap={2} align="center">
              <div style={{ width: 12, height: 12, borderRadius: 3, background: entry.color, flex: 'none' }} />
              <Text size="sm" color="secondary">{entry.label}</Text>
            </HStack>
          ))}
        </VStack>
      </RailSection>

      <HStack gap={2} style={{ flexWrap: 'wrap' }}>
        <Badge label={`${nodeCount} nodes`} variant="neutral" />
        <Badge label={`${edgeCount} links`} variant="neutral" />
      </HStack>
    </VStack>
  )
}
