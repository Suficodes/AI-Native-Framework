// Where GitHub Copilot sits: between the engineer's IDE and the repository,
// with the repo's own instructions file shaping every request and exclusion
// rules deciding what is never sent.
import { categorical, status, axisText } from '../../../lib/chartColors.js'
import { useChartMode } from '../../../lib/useChartMode.js'

const W = 900
const H = 320

export function CopilotContextDiagram() {
  const mode = useChartMode()
  const c = categorical(mode)
  const s = status(mode)
  const neutral = axisText(mode)

  const ideColor = c[0]
  const copilotColor = c[6]
  const repoColor = c[2]

  const box = (x, y, w, h, color, strokeWidth = 1.6) => (
    <rect x={x} y={y} width={w} height={h} rx="10" fill="none" stroke={color} strokeWidth={strokeWidth} />
  )

  return (
    <svg
      className="vcd"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="GitHub Copilot sits between the engineer's IDE and the repository. The IDE sends open files, neighbouring tabs, the repository index and the repo's copilot-instructions file as context. Content exclusion rules block restricted paths and secrets from ever being sent. Accepted suggestions become commits, which go through the same pull request gate as any other change."
    >
      {/* IDE */}
      {box(20, 96, 210, 110, ideColor)}
      <text className="vcd-stage" x="125" y="124" textAnchor="middle" fill={ideColor}>Engineer&rsquo;s IDE</text>
      <text className="vcd-note" x="125" y="144" textAnchor="middle" fill={neutral}>VS Code · JetBrains</text>
      <text className="vcd-note" x="125" y="164" textAnchor="middle" fill={neutral}>open file · selection · open tabs</text>
      <text className="vcd-note" x="125" y="182" textAnchor="middle" fill={neutral}>GitHub Copilot extension</text>

      {/* Copilot service */}
      {box(345, 86, 210, 130, copilotColor, 2)}
      <text className="vcd-stage" x="450" y="114" textAnchor="middle" fill={copilotColor}>GitHub Copilot</text>
      <text className="vcd-note" x="450" y="134" textAnchor="middle" fill={neutral}>completions · chat · code review</text>
      <line x1="365" y1="148" x2="535" y2="148" stroke={neutral} strokeWidth="1" strokeDasharray="2 3" />
      <text className="vcd-note" x="450" y="166" textAnchor="middle" fill={neutral}>request shaped by</text>
      <text className="vcd-repo" x="450" y="184" textAnchor="middle" fill={copilotColor}>copilot-instructions.md</text>
      <text className="vcd-note" x="450" y="202" textAnchor="middle" fill={neutral}>DEWA standards · owning QP</text>

      {/* Repository */}
      {box(670, 96, 210, 110, repoColor)}
      <text className="vcd-stage" x="775" y="124" textAnchor="middle" fill={repoColor}>Repository</text>
      <text className="vcd-note" x="775" y="144" textAnchor="middle" fill={neutral}>indexed for semantic search</text>
      <text className="vcd-note" x="775" y="164" textAnchor="middle" fill={neutral}>instructions · standards · tests</text>
      <text className="vcd-note" x="775" y="182" textAnchor="middle" fill={neutral}>github.com/dewa-ai</text>

      {/* IDE -> Copilot (context out) */}
      <g>
        <line x1="230" y1="132" x2="337" y2="132" stroke={neutral} strokeWidth="1.4" />
        <path d="M 337 132 l -6 -4 v 8 z" fill={neutral} />
        <text className="vcd-note" x="283" y="124" textAnchor="middle" fill={neutral}>context</text>
      </g>
      {/* Copilot -> IDE (suggestion back) */}
      <g>
        <line x1="345" y1="170" x2="238" y2="170" stroke={neutral} strokeWidth="1.4" />
        <path d="M 238 170 l 6 -4 v 8 z" fill={neutral} />
        <text className="vcd-note" x="291" y="188" textAnchor="middle" fill={neutral}>suggestion</text>
      </g>

      {/* Repo <-> Copilot */}
      <g>
        <line x1="555" y1="132" x2="662" y2="132" stroke={neutral} strokeWidth="1.4" />
        <path d="M 555 132 l 6 -4 v 8 z" fill={neutral} />
        <text className="vcd-note" x="608" y="124" textAnchor="middle" fill={neutral}>repo index</text>
      </g>

      {/* Exclusion gate — the thing that makes this governable */}
      <g>
        <rect x="300" y="248" width="300" height="46" rx="10" fill="none" stroke={s.critical} strokeWidth="1.6" strokeDasharray="5 3" />
        <text className="vcd-stage" x="450" y="268" textAnchor="middle" fill={s.critical}>Content exclusion</text>
        <text className="vcd-note" x="450" y="285" textAnchor="middle" fill={neutral}>restricted paths and secrets are never sent</text>
        <line x1="450" y1="216" x2="450" y2="246" stroke={s.critical} strokeWidth="1.4" strokeDasharray="3 3" />
      </g>

      {/* Accepted suggestion re-enters the normal gate */}
      <g>
        <line x1="775" y1="206" x2="775" y2="266" stroke={neutral} strokeWidth="1.4" />
        <path d="M 775 266 l -4 -6 h 8 z" fill={neutral} />
        <text className="vcd-note" x="775" y="284" textAnchor="middle" fill={neutral}>accepted code → PR → same gate</text>
      </g>

      <text className="vcd-note" x="125" y="238" textAnchor="middle" fill={neutral}>nothing leaves the IDE unfiltered</text>
    </svg>
  )
}
