// Custom React Flow node for one block in the harness's left-to-right
// workflow (requirements doc Section 9: Trigger -> Context retrieval ->
// Validation -> Reasoning -> Tool call -> Output generation -> Quality
// evaluation -> Human approval -> Commit to system -> Log outcome -> Value
// update). Click opens the block's config in HarnessBlockPanel.
import { Handle, Position as FlowPosition } from '@xyflow/react'
import { Text } from '@astryxdesign/core/Text'

export function HarnessFlowNode({ data }) {
  const { order, label, isSelected, onSelect } = data
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect() }}
      style={{
        width: 170, padding: '10px 12px', borderRadius: 'var(--radius-container)',
        border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
        background: isSelected ? 'var(--color-background-accent-subtle, var(--color-background-surface))' : 'var(--color-background-surface)',
        cursor: 'pointer', textAlign: 'center',
      }}
    >
      <Handle type="target" position={FlowPosition.Left} style={{ visibility: order === 1 ? 'hidden' : 'visible' }} />
      <span className="eyebrow" style={{ fontSize: 10 }}>Step {order}</span>
      <Text weight="semibold" size="sm" style={{ display: 'block', marginTop: 2 }}>{label}</Text>
      <Handle type="source" position={FlowPosition.Right} style={{ visibility: order === 11 ? 'hidden' : 'visible' }} />
    </div>
  )
}
