// Story Mode (requirements doc Section 18) — the fourteen steps that walk an
// executive from "here is the organization" to "here is the target AI-native
// organization", in the doc's own order.
//
// Each step is just a configuration of the map: a lens, some filters, a depth,
// and the narration. It drives the same applyLens/discloseGraph path as manual
// exploration, so Story Mode can never show something the map itself cannot.
import type { FilterId, LensId } from './enterpriseMapLenses'
import type { MapEdgeKind } from './enterpriseMapGraph'

export interface StoryStep {
  number: number
  title: string
  /** What the executive should take away — read aloud in presentation mode. */
  narration: string
  lens: LensId
  filters?: FilterId[]
  extraEdgeKinds?: MapEdgeKind[]
  /** Override the lens's default disclosure depth for this beat. */
  depth?: number
  /**
   * Narrow the beat to one division. The deep steps do this deliberately: at
   * leaf depth the whole enterprise is ~100 unreadable cards, and a
   * walkthrough is more persuasive drilling into one concrete division than
   * gesturing at everything at once. The enterprise-wide beats bracket it.
   */
  divisionNodeId?: string
  /** Show the target state rather than the current state. */
  targetState?: boolean
}

/** Customer & Digital Services — the division that owns the D2D worked example. */
const FOCUS_DIVISION = 'org:DIV-03'

export const STORY_STEPS: StoryStep[] = [
  {
    number: 1,
    title: 'Organization structure',
    narration: 'DEWA as it is organized today: four divisions, eight super departments, sixteen departments, twenty-five sections. Every AI decision that follows attaches to a real place in this structure.',
    lens: 'organization',
    depth: 3,
  },
  {
    number: 2,
    title: 'Current human workforce',
    narration: 'Sixty positions and forty employees. This is the baseline — the work as it is staffed before any agent is introduced.',
    lens: 'workforce',
    depth: 4,
  },
  {
    number: 3,
    title: 'Human + Agent roles',
    narration: 'Where humans now work alongside a copilot or a managed agent. Note that the human is still accountable for every outcome — the agent carries repeatable, evidence-bound work inside an approved boundary.',
    lens: 'workforce',
    divisionNodeId: FOCUS_DIVISION,
    filters: ['agent-supported'],
    depth: 5,
  },
  {
    number: 4,
    title: 'Agent-only digital employees',
    narration: 'Fifteen agents run as digital employees: each has a digital job description, four named owners, a performance review and a probation gate. They are managed, not deployed.',
    lens: 'agentHarness',
    divisionNodeId: FOCUS_DIVISION,
    depth: 5,
  },
  {
    number: 5,
    title: 'Manual and partly agentic processes',
    narration: 'The processes still sitting at L0 or L1. These are where the transformation has the most room left — and where the constraint is process redesign, not tooling.',
    lens: 'process',
    divisionNodeId: FOCUS_DIVISION,
    filters: ['low-agenticity'],
    depth: 5,
  },
  {
    number: 6,
    title: 'Quality Procedure controls',
    narration: 'Every agent operates inside a boundary a Quality Procedure defines. Mandatory human control points stay human and cannot be automated away.',
    lens: 'qualityProcedure',
    divisionNodeId: FOCUS_DIVISION,
    depth: 5,
  },
  {
    number: 7,
    title: 'AI initiatives in D2D',
    narration: 'Twenty AI initiatives, each raised as demand and delivered through the D2D pipeline. Every one traces back to a business need and forward to a measurable outcome.',
    lens: 'initiative',
    divisionNodeId: FOCUS_DIVISION,
    extraEdgeKinds: ['depends'],
    depth: 5,
  },
  {
    number: 8,
    title: 'Harness Engineering',
    narration: 'An agent is not a prompt. Each is a harness: model, instructions, context, knowledge, tools, workflow, guardrails, evaluations, human checkpoints, observability and cost controls.',
    lens: 'agentHarness',
    divisionNodeId: FOCUS_DIVISION,
    depth: 6,
  },
  {
    number: 9,
    title: 'Agent execution',
    narration: 'Which agent executes which process, and under whose supervision. Every step, tool call and approval is logged and traceable end to end.',
    lens: 'process',
    divisionNodeId: FOCUS_DIVISION,
    extraEdgeKinds: ['supervises', 'controls'],
    depth: 5,
  },
  {
    number: 10,
    title: 'Performance',
    narration: 'Agents are reviewed on a seven-dimension weighted index, and people on AI-enabled output, supervision effectiveness and business outcomes — never on prompt count.',
    lens: 'value',
    divisionNodeId: FOCUS_DIVISION,
    depth: 6,
  },
  {
    number: 11,
    title: 'Value Realization',
    narration: 'Benefit is validated through five gates before it counts. Estimated, observed, verified and validated are kept apart — the only figure that reaches the board is the validated one.',
    lens: 'value',
    divisionNodeId: FOCUS_DIVISION,
    extraEdgeKinds: ['value'],
    depth: 6,
  },
  {
    number: 12,
    title: 'Token economics',
    narration: 'What the digital workforce consumes, from enterprise down to a single call. The control metric is cost per successful business outcome, not cost per prompt.',
    lens: 'token',
    divisionNodeId: FOCUS_DIVISION,
    extraEdgeKinds: ['token'],
    depth: 6,
  },
  {
    number: 13,
    title: 'Strategic contribution',
    narration: 'Every initiative traces back to a strategic objective and the excellence criterion it moves. Work that cannot be traced here does not get funded.',
    lens: 'strategic',
    extraEdgeKinds: ['contributes'],
    depth: 3,
  },
  {
    number: 14,
    title: 'The target AI-native organization',
    narration: 'The same enterprise at its agenticity target: governed human-agent collaboration on every process, controls explicit, value validated, and spend justified against outcomes. This is where the investment goes next.',
    lens: 'process',
    divisionNodeId: FOCUS_DIVISION,
    targetState: true,
    depth: 5,
  },
]

/** The eleven questions Section 18 says the finished map must answer. */
export const MAP_QUESTIONS = [
  'Where are humans and agents working?',
  'What work is performed by each?',
  'Which Quality Procedures govern the work?',
  'How agentic is each process?',
  'Which AI initiatives created the agents?',
  'Which harness controls each agent?',
  'How are the agents performing?',
  'How much value has been validated?',
  'What is the total AI and token cost?',
  'Which strategic objectives are supported?',
  'Where should the organization invest next?',
]
