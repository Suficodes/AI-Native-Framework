// Shared tab bar for the two Processes & Quality Procedures module pages
// (requirements doc Section 6: "Create two main tabs"). Each top-level page
// renders this at the top rather than nesting both under a layout route —
// simplest option for exactly two tabs.
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { useNavigate } from 'react-router-dom'

export function ProcessesTabs({ active }) {
  const navigate = useNavigate()
  return (
    <TabList
      value={active}
      onChange={(value) => navigate(value === 'agenticity' ? '/processes/agenticity' : '/processes/quality-procedures')}
    >
      <Tab value="agenticity" label="Process Agenticity" />
      <Tab value="quality-procedures" label="Quality Procedures" />
    </TabList>
  )
}
