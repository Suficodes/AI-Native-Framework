// <RoleSwitcher> — simulates the 17 view roles from the requirements doc
// (Section 20). This is view-simulation only: no real auth/authorization
// exists in this prototype, so it always renders paired with a
// "Simulated view — no authentication" badge (never shown alone) so a demo
// never implies real access control.
import { Selector } from '@astryxdesign/core/Selector'
import { Badge } from '@astryxdesign/core/Badge'
import { Tooltip } from '@astryxdesign/core/Tooltip'
import { HStack } from '@astryxdesign/core/HStack'
import { ROLES } from '../data/roles.ts'

const OPTIONS = ROLES.map((r) => ({ value: r.id, label: r.name }))

export function RoleSwitcher({ roleId, onRoleChange }) {
  return (
    <HStack gap={2} align="center">
      <Selector
        label="Viewing as"
        isLabelHidden
        size="sm"
        width={180}
        options={OPTIONS}
        value={roleId}
        onChange={onRoleChange}
        placeholder="Select role…"
      />
      <Tooltip content="This prototype has no real authentication. The role switcher changes which view is shown — it does not enforce access." placement="below">
        <Badge label="Simulated view" variant="neutral" />
      </Tooltip>
    </HStack>
  )
}
