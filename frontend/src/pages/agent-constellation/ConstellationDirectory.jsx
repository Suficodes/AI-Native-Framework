// Left panel — what is in the constellation, and a search that filters it.
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { domainColor } from './constellationColors.js'
import { useChartMode } from '../../lib/useChartMode.js'

export function ConstellationDirectory({ graph, query, onQueryChange, focusDomainId, onFocusDomain }) {
  const mode = useChartMode()
  const agentTotal = graph.nodes.filter((n) => n.tier === 'agent').length
  const leafTotal = graph.nodes.filter((n) => n.tier === 'leaf').length
  const maxAgents = Math.max(1, ...graph.domains.map((d) => d.metrics.agentCount))
  const emptyDomains = graph.domains.filter((d) => d.metrics.agentCount === 0)

  return (
    <aside className="cn-panel" aria-label="Constellation directory">
      <span className="eyebrow">Directory</span>

      <div className="cn-stat-row">
        <div className="cn-stat">
          <b>{graph.domains.length}</b>
          <span>Divisions</span>
        </div>
        <div className="cn-stat">
          <b>{agentTotal}</b>
          <span>AI agents</span>
        </div>
        <div className="cn-stat">
          <b>{leafTotal}</b>
          <span>Processes &amp; QPs</span>
        </div>
      </div>

      <TextInput
        label="Search the constellation"
        isLabelHidden
        size="sm"
        placeholder="Search agents, processes…"
        value={query}
        onChange={onQueryChange}
        hasClear
      />

      <span className="eyebrow" style={{ marginTop: 'var(--spacing-3)' }}>Agents per division</span>
      <ul className="cn-bars">
        {graph.domains.map((domain, i) => (
          <li key={domain.id}>
            <button
              type="button"
              className={`cn-bar-row ${focusDomainId === domain.id ? 'is-active' : ''}`}
              onClick={() => onFocusDomain(domain.id)}
              aria-pressed={focusDomainId === domain.id}
            >
              <span className="cn-bar-label">
                <Text size="sm">{domain.label}</Text>
              </span>
              <span className="cn-bar-track">
                <span
                  className="cn-bar-fill"
                  style={{
                    width: `${(domain.metrics.agentCount / maxAgents) * 100}%`,
                    background: domainColor(mode, i),
                  }}
                />
              </span>
              <span className="cn-bar-value">{domain.metrics.agentCount}</span>
            </button>
          </li>
        ))}
      </ul>

      {emptyDomains.length > 0 && (
        <div className="cn-empty-note">
          <Text size="xs" color="secondary">
            {emptyDomains.map((d) => d.label).join(', ')}{' '}
            {emptyDomains.length === 1 ? 'runs' : 'run'} no AI agents yet — a coverage gap, not a
            rendering error.
          </Text>
        </div>
      )}
    </aside>
  )
}
