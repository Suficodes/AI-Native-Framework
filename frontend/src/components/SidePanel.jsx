// <SidePanel> — the shared slide-in panel CONVENTIONS.md requires in place
// of modals ("No modals for primary content — use components/SidePanel.jsx
// (slide-in)"). First consumer: pages/organization/{Section,Position}Panel.jsx.
import { useEffect } from 'react'
import { IconButton } from '@astryxdesign/core/IconButton'
import { Text } from '@astryxdesign/core/Text'
import { usePresence } from '../dewa/usePresence.js'

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export function SidePanel({ isOpen, onClose, eyebrow, title, width = 420, children }) {
  const { mounted, motion } = usePresence(isOpen)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!mounted) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.32)',
          opacity: motion === 'entered' ? 1 : 0, transition: 'opacity 0.22s ease-out',
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width, maxWidth: '92vw',
          background: 'var(--color-background-body)', borderLeft: '1px solid var(--color-border)',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)', overflowY: 'auto',
          transform: motion === 'entered' ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s ease-out',
        }}
      >
        <div
          style={{
            position: 'sticky', top: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 'var(--spacing-2)', padding: 'var(--spacing-4) var(--spacing-5)',
            borderBottom: '1px solid var(--color-border)', background: 'var(--color-background-body)',
          }}
        >
          <div>
            {eyebrow && <span className="eyebrow" style={{ display: 'block', marginBottom: 4 }}>{eyebrow}</span>}
            <Text weight="semibold" size="lg">{title}</Text>
          </div>
          <IconButton label="Close" icon={<CloseIcon />} variant="ghost" size="sm" onClick={onClose} />
        </div>
        <div style={{ padding: 'var(--spacing-5)' }}>{children}</div>
      </aside>
    </div>
  )
}
