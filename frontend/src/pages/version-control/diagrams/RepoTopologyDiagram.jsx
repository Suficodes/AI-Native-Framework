// How dozens of AI projects sit under one GitHub organization: a platform and
// a capability layer that many delivery repos depend on, rather than every
// initiative rebuilding the same foundations.
import { categorical, axisText } from '../../../lib/chartColors.js'
import { useChartMode } from '../../../lib/useChartMode.js'

const W = 900
const H = 300

const DELIVERY = [
  'dewa-ai-generation-grid-anomaly',
  'dewa-ai-customer-complaint-triage',
  'dewa-ai-corporate-invoice-validation',
  'dewa-ai-transmission-maintenance',
]

export function RepoTopologyDiagram() {
  const mode = useChartMode()
  const c = categorical(mode)
  const neutral = axisText(mode)

  const orgColor = c[6]
  const platformColor = c[0]
  const capabilityColor = c[2]
  const deliveryColor = c[3]

  const boxW = 196
  const gap = (W - DELIVERY.length * boxW) / (DELIVERY.length - 1)

  return (
    <svg
      className="vcd"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Repository topology: a single GitHub organization contains a shared platform repository and per-skill capability repositories, which the per-initiative delivery repositories depend on rather than duplicating."
    >
      {/* Org */}
      <rect x={W / 2 - 130} y="6" width="260" height="42" rx="10" fill="none" stroke={orgColor} strokeWidth="2" />
      <text className="vcd-stage" x={W / 2} y="26" textAnchor="middle" fill={orgColor}>github.com/dewa-ai</text>
      <text className="vcd-note" x={W / 2} y="41" textAnchor="middle" fill={neutral}>one organization · SSO · CODEOWNERS</text>

      {/* Shared layer */}
      <rect x="86" y="82" width="300" height="52" rx="10" fill="none" stroke={platformColor} strokeWidth="1.6" />
      <text className="vcd-stage" x="236" y="104" textAnchor="middle" fill={platformColor}>dewa-ai-platform</text>
      <text className="vcd-note" x="236" y="121" textAnchor="middle" fill={neutral}>runtime · scaffolding · connector clients</text>

      <rect x="514" y="82" width="300" height="52" rx="10" fill="none" stroke={capabilityColor} strokeWidth="1.6" />
      <text className="vcd-stage" x="664" y="104" textAnchor="middle" fill={capabilityColor}>dewa-ai-capability-*</text>
      <text className="vcd-note" x="664" y="121" textAnchor="middle" fill={neutral}>one reusable skill per repo, versioned</text>

      <line x1={W / 2 - 60} y1="48" x2="236" y2="82" stroke={neutral} strokeWidth="1" />
      <line x1={W / 2 + 60} y1="48" x2="664" y2="82" stroke={neutral} strokeWidth="1" />

      {/* Delivery repos depend on the shared layer */}
      {DELIVERY.map((name, i) => {
        const x = i * (boxW + gap)
        const cx = x + boxW / 2
        return (
          <g key={name}>
            <line x1="236" y1="134" x2={cx} y2="206" stroke={neutral} strokeWidth="1" strokeDasharray="3 3" />
            <line x1="664" y1="134" x2={cx} y2="206" stroke={neutral} strokeWidth="1" strokeDasharray="3 3" />
            <rect x={x} y="206" width={boxW} height="52" rx="10" fill="none" stroke={deliveryColor} strokeWidth="1.4" />
            <text className="vcd-repo" x={cx} y="230" textAnchor="middle" fill={deliveryColor}>{name}</text>
            <text className="vcd-note" x={cx} y="246" textAnchor="middle" fill={neutral}>one AI initiative</text>
          </g>
        )
      })}

      <text className="vcd-note" x={W / 2} y="284" textAnchor="middle" fill={neutral}>
        dashed = depends on a pinned version · delivery repos consume the shared layer, never fork it
      </text>
    </svg>
  )
}
