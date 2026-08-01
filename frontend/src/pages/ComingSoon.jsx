// Shared placeholder for routes not yet built. Referenced directly from
// router.jsx for any module/detail route this build hasn't reached — each
// gets replaced by its real page component (and the router import updated)
// as that module's build step lands. See PROJECT.md's build-step log.
import { EmptyState } from '@astryxdesign/core/EmptyState'

const Icon = () => (
  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 4v5" />
  </svg>
)

export default function ComingSoon({ title, description }) {
  return (
    <div className="page-band page-band--wide">
      <EmptyState
        icon={<Icon />}
        title={title}
        description={description ?? 'This module is scaffolded in the route table and navigable now — full content lands in its build step.'}
      />
    </div>
  )
}
