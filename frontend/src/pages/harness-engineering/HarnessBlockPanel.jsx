// Side panel showing one workflow block's configuration (requirements doc
// Section 9: "Allow the user to click each block and view configuration.").
// Config shape varies per block type (HarnessBlock.config is a plain
// Record<string, string | string[]>), so this renders generically rather
// than hand-writing a layout per block type.
import { useEffect, useRef } from 'react'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { SidePanel } from '../../components/SidePanel.jsx'
import { HARNESS_FLOW } from '../../data/types'

export function humanizeKey(key) {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())
}

export function HarnessBlockPanel({ blockType, block, onClose }) {
  const lastTypeRef = useRef(blockType)
  useEffect(() => { if (blockType) lastTypeRef.current = blockType }, [blockType])
  const displayType = blockType ?? lastTypeRef.current
  if (!displayType) return null

  const flowDef = HARNESS_FLOW.find((b) => b.type === displayType)
  const entries = block ? Object.entries(block.config) : []

  return (
    <SidePanel isOpen={Boolean(blockType)} onClose={onClose} eyebrow="Workflow block" title={flowDef?.label ?? displayType}>
      {entries.length === 0 ? (
        <EmptyState title="No configuration on record" description="This block has no configuration for this harness yet." />
      ) : (
        <VStack gap={4}>
          {entries.map(([key, value]) => (
            <div key={key}>
              <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>{humanizeKey(key)}</Text>
              {Array.isArray(value) ? (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {value.map((v) => <Badge key={v} label={v} variant="neutral" />)}
                </div>
              ) : (
                <Text size="sm" color="secondary">{value}</Text>
              )}
            </div>
          ))}
        </VStack>
      )}
    </SidePanel>
  )
}
