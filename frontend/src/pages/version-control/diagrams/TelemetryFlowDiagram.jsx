// What comes back out of GitHub and where it lands. This is the answer to
// "how is data pulled from Copilot and used in the project": metrics and
// metadata are read on a schedule, normalised once, and fanned out to the
// modules that already exist. Source code never crosses.
import { categorical, axisText } from '../../../lib/chartColors.js'
import { useChartMode } from '../../../lib/useChartMode.js'

const W = 900
const H = 340

const SOURCES = [
  'Copilot Metrics API',
  'Seat assignments',
  'Repo + PR events',
  'Actions workflow runs',
  'Audit log',
  'Billing and usage',
]

const CONSUMERS = [
  'Copilot & Workforce',
  'Performance',
  'Observability',
  'Administration',
  'Token Economics',
]

const SRC_H = 34
const SRC_GAP = 10
const CON_H = 40
const CON_GAP = 12

export function TelemetryFlowDiagram() {
  const mode = useChartMode()
  const c = categorical(mode)
  const neutral = axisText(mode)

  const sourceColor = c[6]
  const pipeColor = c[0]
  const moduleColor = c[2]

  const srcTop = (H - (SOURCES.length * SRC_H + (SOURCES.length - 1) * SRC_GAP)) / 2
  const conTop = (H - (CONSUMERS.length * CON_H + (CONSUMERS.length - 1) * CON_GAP)) / 2

  return (
    <svg
      className="vcd"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Six GitHub data sources — Copilot metrics, seat assignments, repository and pull request events, Actions workflow runs, the audit log, and billing — are read on a schedule by a read-only ingestion service and fanned out to the Copilot and Workforce, Performance, Observability, Administration and Token Economics modules. Source code never crosses the boundary."
    >
      {/* Sources */}
      <text className="vcd-note" x="120" y={srcTop - 14} textAnchor="middle" fill={neutral}>GitHub · read-only</text>
      {SOURCES.map((label, i) => {
        const y = srcTop + i * (SRC_H + SRC_GAP)
        return (
          <g key={label}>
            <rect x="16" y={y} width="208" height={SRC_H} rx="8" fill="none" stroke={sourceColor} strokeWidth="1.4" />
            <text className="vcd-repo" x="120" y={y + 21} textAnchor="middle" fill={sourceColor}>{label}</text>
            <line x1="224" y1={y + SRC_H / 2} x2="330" y2={H / 2} stroke={neutral} strokeWidth="1" strokeDasharray="3 3" />
          </g>
        )
      })}

      {/* Ingestion */}
      <rect x="332" y={H / 2 - 54} width="226" height="108" rx="12" fill="none" stroke={pipeColor} strokeWidth="2" />
      <text className="vcd-stage" x="445" y={H / 2 - 28} textAnchor="middle" fill={pipeColor}>Ingestion</text>
      <text className="vcd-note" x="445" y={H / 2 - 10} textAnchor="middle" fill={neutral}>GitHub App · least privilege</text>
      <text className="vcd-note" x="445" y={H / 2 + 8} textAnchor="middle" fill={neutral}>scheduled pull + webhooks</text>
      <text className="vcd-note" x="445" y={H / 2 + 26} textAnchor="middle" fill={neutral}>normalise · attribute to initiative</text>
      <text className="vcd-note" x="445" y={H / 2 + 44} textAnchor="middle" fill={neutral}>metrics and metadata only</text>

      {/* Consumers */}
      <text className="vcd-note" x="780" y={conTop - 14} textAnchor="middle" fill={neutral}>Control Tower modules</text>
      {CONSUMERS.map((label, i) => {
        const y = conTop + i * (CON_H + CON_GAP)
        return (
          <g key={label}>
            <line x1="558" y1={H / 2} x2="672" y2={y + CON_H / 2} stroke={neutral} strokeWidth="1" />
            <rect x="674" y={y} width="212" height={CON_H} rx="8" fill="none" stroke={moduleColor} strokeWidth="1.4" />
            <text className="vcd-repo" x="780" y={y + 24} textAnchor="middle" fill={moduleColor}>{label}</text>
          </g>
        )
      })}

      <text className="vcd-note" x={W / 2} y={H - 8} textAnchor="middle" fill={neutral}>
        source code never crosses — findings link back to the commit on GitHub
      </text>
    </svg>
  )
}
