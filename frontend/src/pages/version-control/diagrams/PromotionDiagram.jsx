// Promotion path: one tagged build moves through environments unchanged.
// The point of the drawing is that nothing is rebuilt between stages.
import { categorical, status, axisText } from '../../../lib/chartColors.js'
import { useChartMode } from '../../../lib/useChartMode.js'

// Notes stay short enough to sit inside a 152px box at 10px mono — the full
// gate list is the table directly above this diagram, so nothing is lost here.
const STAGES = [
  { key: 'pr', label: 'Pull request', note: 'all gates green' },
  { key: 'main', label: 'main', note: 'tagged v1.4.0' },
  { key: 'dev', label: 'Development', note: 'synthetic data' },
  { key: 'staging', label: 'Staging', note: 'masked prod copy' },
  { key: 'prod', label: 'Production', note: 'risk sign-off' },
]

const W = 900
const H = 132
const BOX_W = 152
const BOX_H = 62
const GAP = (W - STAGES.length * BOX_W) / (STAGES.length - 1)

export function PromotionDiagram() {
  const mode = useChartMode()
  const c = categorical(mode)
  const s = status(mode)
  const neutral = axisText(mode)
  const colorFor = (key) =>
    key === 'prod' ? s.good : key === 'pr' ? neutral : c[0]

  return (
    <svg
      className="vcd"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Promotion path: a pull request passes checks, merges to main and is tagged, then the same tagged build is promoted through development, staging and production without being rebuilt."
    >
      {STAGES.map((stage, i) => {
        const x = i * (BOX_W + GAP)
        const color = colorFor(stage.key)
        return (
          <g key={stage.key}>
            <rect
              x={x} y={26} width={BOX_W} height={BOX_H} rx="10"
              fill="none" stroke={color} strokeWidth={stage.key === 'prod' ? 2 : 1.4}
            />
            <text className="vcd-stage" x={x + BOX_W / 2} y={52} textAnchor="middle" fill={color}>{stage.label}</text>
            <text className="vcd-note" x={x + BOX_W / 2} y={72} textAnchor="middle" fill={neutral}>{stage.note}</text>
            {i < STAGES.length - 1 && (
              <g>
                <line
                  x1={x + BOX_W + 6} y1={57} x2={x + BOX_W + GAP - 10} y2={57}
                  stroke={neutral} strokeWidth="1.4"
                />
                <path
                  d={`M ${x + BOX_W + GAP - 10} 57 l -6 -4 v 8 z`}
                  fill={neutral}
                />
              </g>
            )}
          </g>
        )
      })}
      <text className="vcd-note" x={W / 2} y={118} textAnchor="middle" fill={neutral}>
        the same artifact throughout — promoted, never rebuilt
      </text>
    </svg>
  )
}
