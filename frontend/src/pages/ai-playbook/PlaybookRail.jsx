// Sticky section rail for the AI Playbook. Fifteen sections is too long to
// navigate by scrolling alone; the rail highlights whichever section is
// currently in view via IntersectionObserver.
import { useEffect, useState } from 'react'
import { Text } from '@astryxdesign/core/Text'
import { PLAYBOOK_SECTIONS } from './sections/registry.js'

export function PlaybookRail() {
  const [activeId, setActiveId] = useState(PLAYBOOK_SECTIONS[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      // Only the top slice of the viewport counts, so "active" means "at the
      // top of the reading area", not "somewhere on screen".
      { rootMargin: '0px 0px -75% 0px', threshold: 0 },
    )
    for (const section of PLAYBOOK_SECTIONS) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const jumpTo = (event, id) => {
    event.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  return (
    <nav className="playbook-rail" aria-label="Playbook sections">
      <Text size="sm" weight="semibold" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>
        Playbook sections
      </Text>
      <ol>
        {PLAYBOOK_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={activeId === section.id ? 'true' : undefined}
              onClick={(e) => jumpTo(e, section.id)}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
