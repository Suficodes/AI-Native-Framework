// Click drill-down for a map node: its metrics, its relationships, and a link
// into the module that owns the real record. Uses the shared SidePanel — no
// modals for primary content (CONVENTIONS.md).
import { useNavigate } from 'react-router-dom'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { SidePanel } from '../../components/SidePanel.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { formatNumber } from '../../utils/format.js'
import { AGENTICITY_ORDER } from '../../data/types'
import { KIND_LABELS, EDGE_KIND_LABELS } from './mapColors.js'

function MetricRow({ label, children }) {
  return (
    <HStack justify="between" align="center" gap={3}>
      <Text size="sm" color="secondary">{label}</Text>
      <Text size="sm" weight="semibold">{children}</Text>
    </HStack>
  )
}

export function MapDetailPanel({ node, graph, onClose, onFocus }) {
  const navigate = useNavigate()
  if (!node) return null

  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const relationships = graph.edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const otherId = e.source === node.id ? e.target : e.source
      return { kind: e.kind, direction: e.source === node.id ? 'out' : 'in', other: byId.get(otherId) }
    })
    .filter((r) => r.other != null && r.kind !== 'contains')

  const m = node.metrics

  return (
    <SidePanel
      isOpen
      onClose={onClose}
      eyebrow={KIND_LABELS[node.kind] ?? node.kind}
      title={node.label}
    >
      <VStack gap={5}>
        {node.sublabel && <Text size="sm" color="secondary">{node.sublabel}</Text>}
        {node.tags.length > 0 && (
          <HStack gap={2} style={{ flexWrap: 'wrap' }}>
            {node.tags.map((tag) => <Badge key={tag} label={tag.replace(/-/g, ' ')} variant="neutral" />)}
          </HStack>
        )}

        <VStack gap={2}>
          <Text weight="semibold" size="sm" style={{ display: 'block' }}>Metrics</Text>
          {m.headcountHuman != null && <MetricRow label="Human headcount">{m.headcountHuman}</MetricRow>}
          {m.headcountAgent != null && <MetricRow label="Agents">{m.headcountAgent}</MetricRow>}
          {m.agenticityCurrent != null && (
            <MetricRow label="Agenticity">
              {AGENTICITY_ORDER[m.agenticityCurrent]} → {AGENTICITY_ORDER[m.agenticityTarget ?? m.agenticityCurrent]}
            </MetricRow>
          )}
          {m.aiCoveragePct != null && <MetricRow label="AI coverage">{m.aiCoveragePct}%</MetricRow>}
          {m.performance != null && <MetricRow label="Performance index">{m.performance}</MetricRow>}
          {m.compliance != null && <MetricRow label="Compliance / evaluation">{m.compliance}</MetricRow>}
          {m.riskScore != null && <MetricRow label="Risk indicator">{m.riskScore}</MetricRow>}
          {m.value != null && <MetricRow label="Value"><Aed aed={m.value} compact /></MetricRow>}
          {m.cost != null && <MetricRow label="Cost"><Aed aed={m.cost} compact /></MetricRow>}
          {m.tokens != null && <MetricRow label="Tokens">{formatNumber(m.tokens)}</MetricRow>}
          {Object.keys(m).length === 0 && (
            <Text size="sm" color="secondary">No metrics recorded for this node kind.</Text>
          )}
        </VStack>

        <VStack gap={2}>
          <Text weight="semibold" size="sm" style={{ display: 'block' }}>
            Relationships ({relationships.length})
          </Text>
          {relationships.length === 0 ? (
            <Text size="sm" color="secondary">
              No cross-cutting relationship is visible under the active lens. Enable more flows in the rail to reveal others.
            </Text>
          ) : (
            <VStack gap={2}>
              {relationships.slice(0, 12).map((rel) => (
                <HStack key={`${rel.kind}-${rel.other.id}-${rel.direction}`} justify="between" align="center" gap={3}>
                  <Text
                    size="sm" color="accent" role="button" tabIndex={0}
                    style={{ cursor: 'pointer', display: 'block' }}
                    onClick={() => onFocus(rel.other)}
                  >
                    {rel.other.label}
                  </Text>
                  <Badge label={EDGE_KIND_LABELS[rel.kind] ?? rel.kind} variant="neutral" />
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>

        {node.href && (
          <DewaButton
            label="Open in the Control Tower"
            variant="secondary"
            onClick={() => navigate(node.href)}
          />
        )}
      </VStack>
    </SidePanel>
  )
}
