// The boundary that matters most in practice: source control carries
// definitions, not operational data. Rendered as two facing columns rather than
// a diagram because the content is a list — the comparison is the visual.
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { GOES_IN_GIT, NEVER_IN_GIT } from '../../data/versionControlGuide.ts'

const Check = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12.5l5.5 5.5L20 6.5" />
  </svg>
)

const Cross = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

function Column({ tone, heading, caption, items, Icon }) {
  return (
    <Card padding={4}>
      <div className={`vc-boundary-head vc-tone-${tone}`}>
        <span className="vc-boundary-icon"><Icon /></span>
        <Text weight="semibold">{heading}</Text>
      </div>
      <Text size="sm" color="secondary" style={{ display: 'block', margin: '4px 0 var(--spacing-3)' }}>
        {caption}
      </Text>
      <ul className="vc-boundary-list">
        {items.map((item) => (
          <li key={item.label} className={`vc-tone-${tone}`}>
            <Text size="sm" weight="medium">{item.label}</Text>
            <Text size="xs" color="secondary">{item.detail}</Text>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function BoundaryPanel() {
  return (
    <div className="vc-boundary">
      <Column
        tone="in"
        heading="Goes in the repository"
        caption="Anything that defines how the system behaves."
        items={GOES_IN_GIT}
        Icon={Check}
      />
      <Column
        tone="out"
        heading="Never in the repository"
        caption="Anything operational, secret, or rebuildable. Referenced by name or version instead."
        items={NEVER_IN_GIT}
        Icon={Cross}
      />
    </div>
  )
}
