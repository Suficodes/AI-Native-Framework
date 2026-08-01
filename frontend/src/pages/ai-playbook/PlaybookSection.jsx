// The shared wrapper every one of the AI Playbook's 15 sections renders into:
// a numbered anchor heading, a one-line purpose, and the section body. Keeping
// the chrome here is what lets each section component be nothing but its own
// derived content.
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'

export function PlaybookSection({ id, number, title, purpose, children }) {
  return (
    <section id={id} className="playbook-section">
      <VStack gap={3}>
        <div>
          <span className="eyebrow">Section {number}</span>
          <Heading level={2} type="display-4" style={{ margin: '0 0 var(--spacing-1)' }}>{title}</Heading>
          {purpose && <Text color="secondary" size="sm" style={{ display: 'block' }}>{purpose}</Text>}
        </div>
        {children}
      </VStack>
    </section>
  )
}

/** A labelled bullet list — the shape most playbook guidance takes. */
export function GuidanceList({ label, items, ordered = false }) {
  if (!items || items.length === 0) return null
  const List = ordered ? 'ol' : 'ul'
  return (
    <div>
      {label && <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>{label}</Text>}
      {/* Astryx's reset strips list markers, so they are re-declared here —
          numbered guidance reads as a sequence, unnumbered as a set. */}
      <List style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: 'var(--spacing-1)', listStyle: ordered ? 'decimal' : 'disc' }}>
        {/* Index in the key as well as the text: derived guidance lines are not
            guaranteed unique, and a duplicate must render, not collide. */}
        {items.map((item, i) => (
          <li key={`${i}-${typeof item === 'string' ? item : ''}`}>
            <Text size="sm" color="secondary">{item}</Text>
          </li>
        ))}
      </List>
    </div>
  )
}
