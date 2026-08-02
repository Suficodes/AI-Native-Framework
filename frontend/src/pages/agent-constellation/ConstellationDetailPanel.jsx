// Detail for a selected constellation node. Deliberately thin: it summarises,
// then hands off to the module that actually owns the record rather than
// duplicating the agent or process page here.
import { useNavigate } from 'react-router-dom'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { SidePanel } from '../../components/SidePanel.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { AGENTICITY_ORDER } from '../../data/types.ts'

const TIER_LABELS = { domain: 'Division', agent: 'AI agent', leaf: 'Work item' }

export function ConstellationDetailPanel({ graph, nodeId, onClose }) {
  const navigate = useNavigate()
  const node = nodeId ? graph.byId.get(nodeId) : null
  const children = node ? graph.childrenOf.get(node.id) ?? [] : []

  return (
    <SidePanel
      isOpen={Boolean(node)}
      onClose={onClose}
      eyebrow={node ? TIER_LABELS[node.tier] : undefined}
      title={node?.label ?? ''}
    >
      {node && (
        <>
          {node.sublabel && <Text color="secondary">{node.sublabel}</Text>}

          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-2)',
              flexWrap: 'wrap',
              margin: 'var(--spacing-3) 0',
            }}
          >
            {node.metrics.agenticity != null && (
              <Badge label={`Agenticity ${AGENTICITY_ORDER[node.metrics.agenticity]}`} variant="info" />
            )}
            {node.metrics.performance != null && (
              <Badge label={`Performance ${node.metrics.performance}`} variant="neutral" />
            )}
            {node.metrics.agentCount != null && (
              <Badge label={`${node.metrics.agentCount} agents`} variant="neutral" />
            )}
            {node.metrics.leafCount != null && (
              <Badge label={`${node.metrics.leafCount} processes & QPs`} variant="neutral" />
            )}
          </div>

          {children.length > 0 && (
            <>
              <span className="eyebrow">Connected ({children.length})</span>
              <ul style={{ listStyle: 'none', margin: '4px 0 var(--spacing-4)', padding: 0 }}>
                {children.map((child) => (
                  <li key={child.id} style={{ padding: '3px 0' }}>
                    <Text size="sm">{child.label}</Text>
                    {child.sublabel && (
                      <Text size="xs" color="secondary"> · {child.sublabel}</Text>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {children.length === 0 && node.tier === 'agent' && (
            <Text size="sm" color="secondary" style={{ display: 'block', marginBottom: 'var(--spacing-4)' }}>
              No processes or Quality Procedures assigned yet.
            </Text>
          )}

          {node.href && (
            <DewaButton variant="primary" onClick={() => navigate(node.href)}>
              Open in the Control Tower
            </DewaButton>
          )}
        </>
      )}
    </SidePanel>
  )
}
