// Scope picker for the AI Playbook. Changing either selector navigates to
// /ai-playbook/:scopeType/:scopeId — the scope lives in the URL so a playbook
// view is shareable and back/forward work, and so every scope goes through the
// same single route rather than a per-scope screen.
import { useNavigate } from 'react-router-dom'
import { Selector } from '@astryxdesign/core/Selector'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { PLAYBOOK_SCOPE_LABELS } from '../../data/types'
import { playbookScopeOptions } from '../../data/playbookScope.ts'

const TYPE_OPTIONS = Object.entries(PLAYBOOK_SCOPE_LABELS).map(([value, label]) => ({ value, label }))

export function PlaybookScopePicker({ scopeType, scopeId }) {
  const navigate = useNavigate()
  const entityOptions = playbookScopeOptions(scopeType)

  const changeType = (nextType) => {
    const first = playbookScopeOptions(nextType)[0]
    if (first) navigate(`/ai-playbook/${nextType}/${first.value}`)
  }

  return (
    <HStack gap={3} align="center" style={{ flexWrap: 'wrap' }}>
      <Text size="sm" color="secondary" weight="medium">Show guidance for</Text>
      <Selector
        label="Scope type" isLabelHidden size="sm" width={200}
        options={TYPE_OPTIONS} value={scopeType} onChange={changeType}
      />
      <Selector
        label="Scope" isLabelHidden size="sm" width={320} hasSearch
        options={entityOptions} value={scopeId}
        onChange={(nextId) => navigate(`/ai-playbook/${scopeType}/${nextId}`)}
        placeholder="Select…"
      />
    </HStack>
  )
}
