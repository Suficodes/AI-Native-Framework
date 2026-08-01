// "AI-Native Enterprise Map" — deliberately its own top-level route (see
// router.jsx), NOT nested under the standard App shell/SideNav, because the
// requirements doc calls for a full-screen experience with its own
// presentation mode. Real content (shared graph dataset + applyLens()
// architecture, 10 lenses, Story Mode, minimap/legend) lands in Step 11.
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Button } from '@astryxdesign/core/Button'

const Icon = () => (
  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3v15M15 6v15" />
    <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
  </svg>
)

export default function EnterpriseMapShell() {
  const navigate = useNavigate()
  return (
    <div style={{ height: '100dvh', width: '100vw', display: 'grid', placeItems: 'center', background: 'var(--color-background-body)' }}>
      <EmptyState
        icon={<Icon />}
        title="AI-Native Enterprise Map"
        description="The full-screen, 10-lens interactive map with Story Mode and presentation mode lands in the final build step."
        actions={<Button label="Back to Control Tower" variant="secondary" onClick={() => navigate('/')} />}
      />
    </div>
  )
}
