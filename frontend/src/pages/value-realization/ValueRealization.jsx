// Value Realization module (requirements doc Section 14) — "must be a
// complete functional module". Eight tabs over one VR record set: the tab
// switches the view, never the underlying data, so no two tabs can disagree
// about what a benefit is worth.
//
// Routes: /value-realization and /value-realization/executive-analytics (the
// doc names the executive dashboard as its own destination, so it gets a
// direct URL as well as being tab 8).
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { getValueRealization } from '../../data/mockApi'
import { vrRows, vrPortfolioSummary } from '../../data/valueAggregates.ts'
import { VRTabs } from './VRTabs.jsx'
import { PortfolioTab } from './tabs/PortfolioTab.jsx'
import { BusinessCaseTab } from './tabs/BusinessCaseTab.jsx'
import { BaselinesTab } from './tabs/BaselinesTab.jsx'
import { BenefitsTab } from './tabs/BenefitsTab.jsx'
import { CostsTab } from './tabs/CostsTab.jsx'
import { ValidationTab } from './tabs/ValidationTab.jsx'
import { PostGoLiveTab } from './tabs/PostGoLiveTab.jsx'
import { ExecutiveAnalyticsTab } from './tabs/ExecutiveAnalyticsTab.jsx'

export default function ValueRealization() {
  const location = useLocation()
  const navigate = useNavigate()
  const deepLinkedToExecutive = location.pathname.endsWith('/executive-analytics')
  const [active, setActive] = useState(deepLinkedToExecutive ? 'executive' : 'portfolio')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { getValueRealization().then(() => setLoaded(true)) }, [])
  useEffect(() => { setActive(deepLinkedToExecutive ? 'executive' : 'portfolio') }, [deepLinkedToExecutive])

  const rows = loaded ? vrRows() : []
  const summary = loaded ? vrPortfolioSummary() : null

  // Keep the URL honest when the user tabs in or out of the executive view.
  const changeTab = (value) => {
    setActive(value)
    if (value === 'executive' && !deepLinkedToExecutive) navigate('/value-realization/executive-analytics')
    else if (value !== 'executive' && deepLinkedToExecutive) navigate('/value-realization')
  }

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Value Realization</Heading>
        <Text color="secondary" size="lg">
          What AI has actually returned — baselined, costed, validated through five gates, and tracked after go-live.
        </Text>
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <VRTabs active={active} onChange={changeTab} />
      </div>

      {!summary ? (
        <Skeleton height={560} radius={2} />
      ) : (
        <VStack gap={5}>
          {active === 'portfolio' && <PortfolioTab rows={rows} />}
          {active === 'business-case' && <BusinessCaseTab />}
          {active === 'baselines' && <BaselinesTab />}
          {active === 'benefits' && <BenefitsTab rows={rows} summary={summary} />}
          {active === 'costs' && <CostsTab rows={rows} summary={summary} />}
          {active === 'validation' && <ValidationTab rows={rows} />}
          {active === 'post-go-live' && <PostGoLiveTab />}
          {active === 'executive' && <ExecutiveAnalyticsTab summary={summary} />}
        </VStack>
      )}
    </div>
  )
}
