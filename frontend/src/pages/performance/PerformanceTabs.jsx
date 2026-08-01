// Shared tab bar for the Performance module's two views. Section 13 opens with
// "Create separate Human and Agent performance views" — they are deliberately
// two screens with different metrics, not one table with a filter.
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { useNavigate } from 'react-router-dom'

export function PerformanceTabs({ active }) {
  const navigate = useNavigate()
  return (
    <TabList
      value={active}
      onChange={(value) => navigate(value === 'agents' ? '/performance/agents' : '/performance/humans')}
    >
      <Tab value="agents" label="Agent Performance" />
      <Tab value="humans" label="Human AI-Native Performance" />
    </TabList>
  )
}
