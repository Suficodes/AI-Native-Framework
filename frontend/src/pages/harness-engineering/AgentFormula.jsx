// The "Agent = Model + Instructions + Context + ..." explainer (requirements
// doc Section 9: "Harness Engineering must be a major module, not a minor
// technical page. Explain visually"). Sits at the top of the Harness
// Registry — every harness on this page is a concrete instance of this
// formula.
import { Text } from '@astryxdesign/core/Text'

const TERMS = [
  'Model', 'Instructions', 'Context', 'Knowledge', 'Tools', 'Workflow',
  'Guardrails', 'Evaluations', 'Human checkpoints', 'Observability', 'Cost controls',
]

export function AgentFormula() {
  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-2)',
        padding: 'var(--spacing-4)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-container)', background: 'var(--color-background-surface)',
      }}
    >
      <Text weight="semibold" size="lg">Agent</Text>
      <Text size="lg" color="secondary">=</Text>
      {TERMS.map((term, i) => (
        <div key={term} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <span
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-accent)', color: 'var(--color-text-accent)',
              fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)',
            }}
          >
            {term}
          </span>
          {i < TERMS.length - 1 && <Text color="secondary">+</Text>}
        </div>
      ))}
    </div>
  )
}
