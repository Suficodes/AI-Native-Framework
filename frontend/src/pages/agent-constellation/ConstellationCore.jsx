// The enterprise core — a dense cluster of small marks rather than a blur glow
// (DESIGN.md rules out glow borders and glassmorphism). Positions come from a
// fixed golden-angle spiral, so the cluster is identical on every render and
// the repo's screenshot checks stay stable.
import { useMemo } from 'react'
import { axisText } from '../../lib/chartColors.js'

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

export function ConstellationCore({ mode, radius = 76, count = 240, reduced }) {
  const marks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = radius * Math.sqrt((i + 0.5) / count)
        const angle = i * GOLDEN
        return {
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          size: 0.7 + (i % 5) * 0.28,
          delay: (i % 12) * 0.35,
        }
      }),
    [radius, count],
  )
  const color = axisText(mode)

  return (
    <g className="cn-core" aria-hidden="true">
      <circle r={radius + 14} className="cn-core-ring" />
      {marks.map((m, i) => (
        <circle
          key={i}
          cx={m.x}
          cy={m.y}
          r={m.size}
          fill={color}
          className={reduced ? 'cn-core-mark-static' : 'cn-core-mark'}
          style={reduced ? undefined : { animationDelay: `${m.delay}s` }}
        />
      ))}
    </g>
  )
}
