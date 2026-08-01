// Administration (requirements doc Section 19) — 19 configuration screens
// behind one tab bar, each rendering the REAL master data it governs rather
// than a placeholder. One config list + one generic register (adminScreens.js
// + AdminRegister.jsx); only Integration Status has its own component, because
// it is an architecture view rather than a table of records.
import { useNavigate, useParams } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { ADMIN_SCREENS } from './adminScreens.js'
import { AdminRegister } from './AdminRegister.jsx'
import { IntegrationArchitecture } from './IntegrationArchitecture.jsx'

export default function Administration() {
  const navigate = useNavigate()
  const { screen } = useParams()
  const active = screen ?? ADMIN_SCREENS[0].slug
  const current = ADMIN_SCREENS.find((s) => s.slug === active) ?? ADMIN_SCREENS[0]

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        {/* Every page needs an h1. Administration previously had none, which
            left the document outline and screen readers without a page title. */}
        <Heading level={1} type="display-3">Administration</Heading>
        <Text color="secondary" size="lg">
          The master data and configuration the rest of the Control Tower runs on.
        </Text>
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)', overflowX: 'auto' }}>
        <TabList value={active} onChange={(slug) => navigate(`/administration/${slug}`, { replace: true })}>
          {ADMIN_SCREENS.map((s) => (
            <Tab key={s.slug} value={s.slug} label={s.label} />
          ))}
        </TabList>
      </div>

      <VStack gap={4}>
        <Heading level={2} type="display-4" style={{ margin: 0 }}>{current.label}</Heading>
        {current.custom === 'integration'
          ? <IntegrationArchitecture />
          : <AdminRegister screen={current} />}
      </VStack>
    </div>
  )
}
