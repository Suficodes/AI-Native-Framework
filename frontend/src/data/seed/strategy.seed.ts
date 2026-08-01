// Strategic objectives, excellence criteria, and the 8 AI Rooms (Section 17
// of the requirements doc).
import type { AIRoom, ExcellenceCriterion, StrategicObjective, Employee, Process, AIInitiative, Agent, Harness } from '../types'
import { nextEcId, nextRoomId, nextSoId } from '../ids'
import { type Rng, int, pick } from '../rng'

const OBJECTIVES = [
  { name: 'Operational Excellence', description: 'Maximize reliability, efficiency, and safety across generation, transmission, and distribution.' },
  { name: 'Customer Centricity', description: 'Deliver fast, transparent, and personalized service to every customer.' },
  { name: 'Financial Sustainability', description: 'Protect and grow revenue while controlling cost-to-serve.' },
  { name: 'AI-Native Transformation', description: 'Become an AI-native enterprise with governed human-agent collaboration at scale.' },
  { name: 'Sustainability Leadership', description: 'Lead clean-energy transition and reduce enterprise environmental impact.' },
]

/**
 * Each criterion carries a real baseline, current and target with its own unit
 * and direction. Section 17 asks for "excellence improvement", which is
 * meaningless without something to improve against — and direction matters:
 * grid reliability improves upward, revenue leakage downward.
 */
interface CriterionSeed {
  name: string
  unit: string
  baseline: number
  current: number
  target: number
  higherIsBetter: boolean
}

const CRITERIA_BY_OBJECTIVE: Record<string, CriterionSeed[]> = {
  'Operational Excellence': [
    { name: 'Grid reliability index', unit: '%', baseline: 97.2, current: 98.4, target: 99.5, higherIsBetter: true },
    { name: 'Asset availability', unit: '%', baseline: 91.0, current: 93.8, target: 96.0, higherIsBetter: true },
    { name: 'Safety incident rate', unit: 'per 1,000 h', baseline: 2.4, current: 1.7, target: 0.8, higherIsBetter: false },
  ],
  'Customer Centricity': [
    { name: 'Customer happiness score', unit: '%', baseline: 82.0, current: 88.5, target: 94.0, higherIsBetter: true },
    { name: 'First-contact resolution', unit: '%', baseline: 68.0, current: 76.4, target: 88.0, higherIsBetter: true },
    { name: 'Service cycle time', unit: 'days', baseline: 9.5, current: 6.2, target: 3.0, higherIsBetter: false },
  ],
  'Financial Sustainability': [
    { name: 'Revenue leakage rate', unit: '%', baseline: 3.1, current: 2.2, target: 1.0, higherIsBetter: false },
    { name: 'Cost per transaction', unit: 'AED', baseline: 14.8, current: 11.3, target: 7.5, higherIsBetter: false },
    { name: 'Budget variance', unit: '%', baseline: 8.4, current: 5.1, target: 2.5, higherIsBetter: false },
  ],
  'AI-Native Transformation': [
    { name: 'Verified AI work contribution', unit: '%', baseline: 4.0, current: 18.6, target: 45.0, higherIsBetter: true },
    { name: 'Process agenticity', unit: 'level', baseline: 1.1, current: 2.3, target: 4.0, higherIsBetter: true },
    { name: 'Agent performance index', unit: 'score', baseline: 62.0, current: 79.5, target: 88.0, higherIsBetter: true },
  ],
  'Sustainability Leadership': [
    { name: 'Emissions intensity', unit: 'kg CO₂e/MWh', baseline: 412.0, current: 358.0, target: 250.0, higherIsBetter: false },
    { name: 'Renewable capacity share', unit: '%', baseline: 16.0, current: 24.5, target: 40.0, higherIsBetter: true },
  ],
}

/**
 * The eight AI Rooms Section 17 names. Goals, risks and next actions are
 * written per room: eight rooms repeating the same three generic bullets reads
 * as filler in a demo, and the whole point of a room is that it owns a
 * distinct slice of the transformation.
 */
const AI_ROOM_DEFS = [
  {
    name: 'Customer Experience AI Room',
    maturity: 'Developing',
    goals: [
      'Cut service cycle time from nine days to three without adding headcount',
      'Raise first-contact resolution above 88% on the top ten request types',
      'Keep every customer-facing agent decision reviewable by a named human',
    ],
    risks: [
      'Customer-facing output carries reputational exposure if a guardrail is missed',
      'Contact-centre knowledge base is inconsistent across channels',
      'Peak-season volume may outrun the current approval capacity',
    ],
    nextActions: [
      'Extend the complaint-triage agent to the two remaining channels',
      'Re-baseline first-contact resolution before the Q4 value review',
      'Add a customer-tone evaluation criterion to the harness suite',
    ],
  },
  {
    name: 'Asset and Maintenance AI Room',
    maturity: 'Emerging',
    goals: [
      'Move preventive maintenance planning from L1 to L4 agenticity',
      'Lift asset availability to 96% across generation and transmission',
      'Shift from schedule-driven to condition-driven intervention',
    ],
    risks: [
      'Sensor and asset master data quality varies widely by plant',
      'Safety-critical work cannot move above L3 without Risk Review sign-off',
      'Field-team adoption depends on mobile access that is not yet in place',
    ],
    nextActions: [
      'Complete the asset data-readiness assessment for the two lowest-scoring plants',
      'Pilot the maintenance-planning agent on a single non-critical asset class',
      'Define the human control points for safety-classified work orders',
    ],
  },
  {
    name: 'Grid and Operations AI Room',
    maturity: 'Mature',
    goals: [
      'Sustain the grid reliability index above 99% while load grows',
      'Bring anomaly detection to real time across the transmission network',
      'Keep dispatch decisions human-owned with agent-prepared options',
    ],
    risks: [
      'Autonomy above L3 in real-time dispatch is not acceptable to Risk',
      'Model latency during grid events must stay inside operational limits',
      'Dependence on a single anomaly-detection harness is a concentration risk',
    ],
    nextActions: [
      'Run a failover test on the anomaly-detection harness',
      'Publish the dispatch human-control boundary as a Quality Procedure',
      'Scale the grid-event summarization skill to the control room',
    ],
  },
  {
    name: 'Corporate Services AI Room',
    maturity: 'Emerging',
    goals: [
      'Release 20% of transactional HR and procurement effort for redeployment',
      'Standardize policy answers across every corporate function',
      'Reach L3 agenticity on the highest-volume back-office procedures',
    ],
    risks: [
      'Released capacity has no redeployment plan attached in most sections',
      'Policy content is scattered across systems with no approved source of truth',
      'Personal data handling requires stricter masking than currently configured',
    ],
    nextActions: [
      'Agree redeployment commitments with each receiving line manager',
      'Consolidate the approved policy corpus before expanding the copilot',
      'Extend restricted-data masking to the HR knowledge sources',
    ],
  },
  {
    name: 'Revenue and Billing AI Room',
    maturity: 'Developing',
    goals: [
      'Reduce revenue leakage from 2.2% to below 1%',
      'Detect billing anomalies before invoice issue rather than after dispute',
      'Bring cost per transaction under AED 7.50',
    ],
    risks: [
      'False positives on leakage detection create customer friction',
      'Meter-to-bill data lineage is incomplete for legacy accounts',
      'Finance will not validate benefit without a pre-implementation baseline',
    ],
    nextActions: [
      'Register the leakage baseline with Finance before the next build starts',
      'Tune the detection threshold against the last four quarters of disputes',
      'Add a dispute-rate guardrail to the billing agent harness',
    ],
  },
  {
    name: 'Project Delivery AI Room',
    maturity: 'Developing',
    goals: [
      'Halve BRD preparation time across the D2D intake pipeline',
      'Make every demand traceable from business need to validated value',
      'Raise D2D process agenticity from L2 to L4',
    ],
    risks: [
      'BRD quality depends on knowledge sources that change without notice',
      'Stakeholder identification errors propagate through the whole delivery chain',
      'Delivery capacity is the constraint, not intake throughput',
    ],
    nextActions: [
      'Version the BRD evaluation suite alongside the governing Quality Procedure',
      'Extend the documentation agent to architecture and security screening',
      'Measure end-to-end demand cycle time, not just intake time',
    ],
  },
  {
    name: 'Knowledge and Productivity AI Room',
    maturity: 'Mature',
    goals: [
      'Raise verified AI work contribution from 18.6% to 45%',
      'Make the approved reusable skill registry the default starting point',
      'Convert measured productivity gains into recorded redeployment',
    ],
    risks: [
      'Copilot adoption is being read as productivity without work-item evidence',
      'Skill reuse depends on ownership that is thinly staffed',
      'Knowledge contribution is not yet part of any performance conversation',
    ],
    nextActions: [
      'Report adoption, contribution and value as three separate measures',
      'Promote the three highest-reuse pilot skills to Standard',
      'Add knowledge contribution to the AI-native performance review',
    ],
  },
  {
    name: 'Sustainability AI Room',
    maturity: 'Emerging',
    goals: [
      'Cut emissions intensity from 358 to 250 kg CO₂e/MWh',
      'Automate sustainability reporting evidence collection end to end',
      'Raise renewable capacity share to 40%',
    ],
    risks: [
      'Emissions data arrives late and from inconsistent sources',
      'Reported figures are externally audited, so agent output needs full traceability',
      'Token spend on reporting agents is not yet justified against a benefit case',
    ],
    nextActions: [
      'Automate evidence-pack assembly for the annual sustainability report',
      'Establish a data contract with the three main emissions data sources',
      'Build the benefit case before scaling the reporting agent',
    ],
  },
] as const

export interface BuiltStrategy {
  strategicObjectives: StrategicObjective[]
  excellenceCriteria: ExcellenceCriterion[]
}

export function buildStrategy(): BuiltStrategy {
  const strategicObjectives: StrategicObjective[] = []
  const excellenceCriteria: ExcellenceCriterion[] = []

  for (const o of OBJECTIVES) {
    const soId = nextSoId()
    const ecIds: string[] = []
    for (const c of CRITERIA_BY_OBJECTIVE[o.name]) {
      const ecId = nextEcId()
      excellenceCriteria.push({
        id: ecId, name: c.name, strategicObjectiveId: soId, unit: c.unit,
        baselineScore: c.baseline, currentScore: c.current, targetScore: c.target,
        higherIsBetter: c.higherIsBetter,
      })
      ecIds.push(ecId)
    }
    strategicObjectives.push({ id: soId, name: o.name, description: o.description, excellenceCriterionIds: ecIds })
  }

  return { strategicObjectives, excellenceCriteria }
}

export function buildAIRooms(
  rng: Rng, employees: Employee[], processes: Process[], initiatives: AIInitiative[], agents: Agent[], harnesses: Harness[],
): AIRoom[] {
  return AI_ROOM_DEFS.map((def) => {
    const priorityProcessIds = Array.from({ length: int(rng, 2, 4) }, () => pick(rng, processes).id)
    const activeInitiativeIds = Array.from({ length: int(rng, 2, 5) }, () => pick(rng, initiatives).id)
    const agentIds = Array.from({ length: int(rng, 1, 3) }, () => pick(rng, agents).id)
    const harnessIds = agentIds
      .map((aid) => harnesses.find((h) => h.assignedAgentId === aid)?.id)
      .filter((id): id is string => Boolean(id))
    return {
      id: nextRoomId(), name: def.name, sponsorId: pick(rng, employees).id,
      strategicGoals: [...def.goals],
      priorityProcessIds: [...new Set(priorityProcessIds)],
      activeInitiativeIds: [...new Set(activeInitiativeIds)],
      agentIds: [...new Set(agentIds)],
      harnessIds: [...new Set(harnessIds)],
      value: { value: int(rng, 200_000, 2_000_000), tag: pick(rng, ['Estimated', 'Observed', 'Validated']) },
      risks: [...def.risks],
      playbookMaturity: def.maturity,
      nextActions: [...def.nextActions],
    }
  })
}
