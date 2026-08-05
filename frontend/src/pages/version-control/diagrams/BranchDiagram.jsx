// The branching model, drawn rather than described.
//
// Hand-authored SVG, not mermaid: the artifact build stubs mermaid out (it
// pulls ~3.4MB of lazy chunks a single-file page would have to inline), so a
// mermaid gitGraph would render as a source block in the published prototype.
import { categorical, status, axisText } from '../../../lib/chartColors.js'
import { useChartMode } from '../../../lib/useChartMode.js'

const W = 860
const H = 260
const MAIN_Y = 150
const FEATURE_Y = 62
const HOTFIX_Y = 232

/** Commit dots along main — the trunk everything returns to. */
const MAIN_COMMITS = [70, 190, 330, 470, 610, 730, 800]

export function BranchDiagram() {
  const mode = useChartMode()
  const c = categorical(mode)
  const s = status(mode)
  const neutral = axisText(mode)

  const mainColor = c[0]
  const featureColor = c[2]
  const hotfixColor = s.critical

  // A branch: out of main at `from`, back into main at `to`. The label is
  // centred on the branch span so a long name cannot run off the canvas, and
  // sits on the far side of the line from main.
  const branch = (from, to, y, color, label, commits) => (
    <g>
      <path
        d={`M ${from} ${MAIN_Y} C ${from + 34} ${MAIN_Y}, ${from + 34} ${y}, ${from + 68} ${y}
            L ${to - 68} ${y}
            C ${to - 34} ${y}, ${to - 34} ${MAIN_Y}, ${to} ${MAIN_Y}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      {commits.map((x) => (
        <circle key={x} cx={x} cy={y} r="6" fill={color} stroke="var(--color-background-surface)" strokeWidth="2" />
      ))}
      <text
        className="vcd-branch-label"
        x={(from + to) / 2}
        y={y < MAIN_Y ? y - 16 : y + 22}
        textAnchor="middle"
        fill={color}
      >
        {label}
      </text>
    </g>
  )

  return (
    <svg
      className="vcd"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Branching model: short-lived feature branches leave main and merge back through a reviewed pull request; main is tagged for release; a hotfix branch cuts from a tag and merges back to main."
    >
      {/* main trunk */}
      <line x1="40" y1={MAIN_Y} x2={W - 24} y2={MAIN_Y} stroke={mainColor} strokeWidth="3" />
      <text className="vcd-trunk-label" x="40" y={MAIN_Y + 30} fill={mainColor}>main · protected · always deployable</text>

      {branch(190, 470, FEATURE_Y, featureColor, 'feature/demand-classifier-eval', [290, 360, 420])}
      {branch(610, 800, HOTFIX_Y, hotfixColor, 'hotfix/guardrail-regression', [700])}

      {MAIN_COMMITS.map((x) => (
        <circle key={x} cx={x} cy={MAIN_Y} r="7" fill={mainColor} stroke="var(--color-background-surface)" strokeWidth="2" />
      ))}

      {/* Merge points are where review happened — worth calling out explicitly. */}
      <g>
        <line x1="470" y1={MAIN_Y - 34} x2="470" y2={MAIN_Y - 12} stroke={neutral} strokeWidth="1" strokeDasharray="2 3" />
        <text className="vcd-note" x="470" y={MAIN_Y - 40} textAnchor="middle" fill={neutral}>squash merge after review + checks</text>
      </g>

      {/* Release tag */}
      <g>
        <rect x="584" y={MAIN_Y - 46} width="72" height="22" rx="11" fill="none" stroke={neutral} />
        <text className="vcd-tag" x="620" y={MAIN_Y - 31} textAnchor="middle" fill={neutral}>v1.4.0</text>
        <line x1="620" y1={MAIN_Y - 24} x2="620" y2={MAIN_Y - 10} stroke={neutral} strokeWidth="1" />
      </g>
      <g>
        <rect x="764" y={MAIN_Y - 46} width="72" height="22" rx="11" fill="none" stroke={neutral} />
        <text className="vcd-tag" x="800" y={MAIN_Y - 31} textAnchor="middle" fill={neutral}>v1.4.1</text>
        <line x1="800" y1={MAIN_Y - 24} x2="800" y2={MAIN_Y - 10} stroke={neutral} strokeWidth="1" />
      </g>
    </svg>
  )
}
