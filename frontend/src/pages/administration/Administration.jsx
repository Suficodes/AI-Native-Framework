import { useNavigate, useParams } from 'react-router-dom'
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { ADMIN_SCREENS } from './adminScreens.js'
import ComingSoon from '../ComingSoon.jsx'

export default function Administration() {
  const navigate = useNavigate()
  const { screen } = useParams()
  const active = screen ?? ADMIN_SCREENS[0].slug
  const current = ADMIN_SCREENS.find((s) => s.slug === active) ?? ADMIN_SCREENS[0]

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <TabList value={active} onChange={(slug) => navigate(`/administration/${slug}`, { replace: true })}>
          {ADMIN_SCREENS.map((s) => (
            <Tab key={s.slug} value={s.slug} label={s.label} />
          ))}
        </TabList>
      </div>
      <ComingSoon
        title={current.label}
        description={`Configuration screen for ${current.label.toLowerCase()}. Full CRUD-over-mock-data lands with the module it configures.`}
      />
    </div>
  )
}
