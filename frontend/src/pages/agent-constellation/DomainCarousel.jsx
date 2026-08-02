// The ‹ Division › pill that cycles focus between divisions without leaving
// focus mode.
import { Text } from '@astryxdesign/core/Text'
import { IconButton } from '@astryxdesign/core/IconButton'

const chevron = (d) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export function DomainCarousel({ domains, activeId, onChange }) {
  const index = domains.findIndex((d) => d.id === activeId)
  if (index < 0) return null

  const step = (delta) => onChange(domains[(index + delta + domains.length) % domains.length].id)

  return (
    <div className="cn-carousel" role="group" aria-label="Division focus">
      <IconButton
        label="Previous division"
        icon={chevron('M15 18l-6-6 6-6')}
        variant="ghost"
        size="sm"
        onClick={() => step(-1)}
      />
      <Text weight="medium" size="sm" className="cn-carousel-label">
        {domains[index].label}
      </Text>
      <IconButton
        label="Next division"
        icon={chevron('M9 18l6-6-6-6')}
        variant="ghost"
        size="sm"
        onClick={() => step(1)}
      />
    </div>
  )
}
