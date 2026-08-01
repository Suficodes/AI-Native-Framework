// The eight tabs requirements doc Section 14 lists. All eight are views over
// the same VR record set — one page owns the tab state and renders the active
// panel, rather than eight routes over eight diverging datasets.
import { TabList, Tab } from '@astryxdesign/core/TabList'

export const VR_TABS = [
  { value: 'portfolio', label: 'VR Portfolio' },
  { value: 'business-case', label: 'Business Case' },
  { value: 'baselines', label: 'Baselines' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'costs', label: 'Costs' },
  { value: 'validation', label: 'Validation' },
  { value: 'post-go-live', label: 'Post-Go-Live Review' },
  { value: 'executive', label: 'Executive Analytics' },
]

export function VRTabs({ active, onChange }) {
  return (
    <TabList value={active} onChange={onChange}>
      {VR_TABS.map((tab) => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
    </TabList>
  )
}
