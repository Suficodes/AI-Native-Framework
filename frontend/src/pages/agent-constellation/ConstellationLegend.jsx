// Right panel — the colour key, then the full agent roster. Selecting a roster
// row drives the same selection state as clicking a mark on the canvas.
import { Text } from '@astryxdesign/core/Text'
import { legendEntries, domainColor } from './constellationColors.js'
import { useChartMode } from '../../lib/useChartMode.js'

export function ConstellationLegend({ graph, selectedId, onSelect, onHover }) {
  const mode = useChartMode()
  const entries = legendEntries(mode, graph.domains)
  const domainIndex = new Map(graph.domains.map((d, i) => [d.domainId, i]))
  const agents = graph.nodes.filter((n) => n.tier === 'agent')

  return (
    <aside className="cn-panel" aria-label="Legend and agent roster">
      <span className="eyebrow">Legend</span>
      <ul className="cn-legend">
        {entries.map((entry) => (
          <li key={entry.label}>
            <span
              className="cn-swatch"
              style={{
                background: entry.color,
                width: entry.shape === 'domain' ? 11 : 7,
                height: entry.shape === 'domain' ? 11 : 7,
              }}
            />
            <Text size="sm" color="secondary">{entry.label}</Text>
          </li>
        ))}
      </ul>

      <span className="eyebrow" style={{ marginTop: 'var(--spacing-3)' }}>
        Agent roster ({agents.length})
      </span>
      <ul className="cn-roster">
        {agents.map((agent) => (
          <li key={agent.id}>
            <button
              type="button"
              className={`cn-roster-row ${selectedId === agent.id ? 'is-active' : ''}`}
              onClick={() => onSelect(agent.id)}
              onMouseEnter={() => onHover(agent.id)}
              onMouseLeave={() => onHover(null)}
              aria-pressed={selectedId === agent.id}
            >
              <span
                className="cn-swatch"
                style={{ background: domainColor(mode, domainIndex.get(agent.domainId) ?? 0) }}
              />
              <span className="cn-roster-label">
                <Text size="sm" weight="medium">{agent.label}</Text>
                <Text size="xs" color="secondary">{agent.sublabel}</Text>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
