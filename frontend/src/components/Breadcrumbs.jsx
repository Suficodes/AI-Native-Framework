// Breadcrumbs (requirements doc UX section 24). Derived from the route rather
// than passed in by every page: a breadcrumb that each page hand-writes drifts
// out of step with the router the moment a path changes.
import { Link, useLocation } from 'react-router-dom'
import { Text } from '@astryxdesign/core/Text'
import { ALL_NAV } from '../app/nav.jsx'

/** Segments that are structural, not navigable — never render as a crumb. */
const PASSTHROUGH = new Set(['demands', 'traces', 'transactions', 'ai-rooms', 'example'])

/** Human labels for path segments the nav table does not cover. */
const SEGMENT_LABELS = {
  'executive-analytics': 'Executive Analytics',
  ledger: 'Work Contribution Ledger',
  agents: 'Agents',
  humans: 'Humans',
  agenticity: 'Process Agenticity',
  'quality-procedures': 'Quality Procedures',
  d2d: 'D2D department example',
}

const titleCase = (segment) => segment
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

/**
 * @param trail  Optional label for the current record, e.g. an agent's name.
 *               Without it the last crumb would be a raw ID.
 */
export function Breadcrumbs({ trail }) {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const crumbs = []
  let path = ''
  for (const [i, segment] of segments.entries()) {
    path += `/${segment}`
    if (PASSTHROUGH.has(segment)) continue

    const isLast = i === segments.length - 1
    // The final segment is usually a record ID; `trail` names it properly.
    const navMatch = ALL_NAV.find((item) => item.path === path)
    const label = navMatch?.label
      ?? SEGMENT_LABELS[segment]
      ?? (isLast && trail ? trail : titleCase(segment))

    crumbs.push({ label, path, isLast })
  }

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--spacing-3)' }}>
      <ol style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-2)',
        listStyle: 'none', margin: 0, padding: 0,
      }}
      >
        <li>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Text size="sm" color="accent">Control Tower</Text>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Text size="sm" color="secondary" aria-hidden="true">›</Text>
            {crumb.isLast ? (
              <Text size="sm" weight="medium" aria-current="page">{crumb.label}</Text>
            ) : (
              <Link to={crumb.path} style={{ textDecoration: 'none' }}>
                <Text size="sm" color="accent">{crumb.label}</Text>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
