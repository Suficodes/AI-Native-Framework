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

const CRITERIA_BY_OBJECTIVE: Record<string, string[]> = {
  'Operational Excellence': ['Grid reliability index', 'Asset availability', 'Safety incident rate'],
  'Customer Centricity': ['Customer happiness score', 'First-contact resolution', 'Service cycle time'],
  'Financial Sustainability': ['Revenue leakage rate', 'Cost per transaction', 'Budget variance'],
  'AI-Native Transformation': ['Verified AI work contribution', 'Process agenticity', 'Agent performance index'],
  'Sustainability Leadership': ['Emissions intensity', 'Renewable capacity share'],
}

const AI_ROOM_DEFS = [
  { name: 'Customer Experience AI Room', maturity: 'Developing' },
  { name: 'Asset and Maintenance AI Room', maturity: 'Emerging' },
  { name: 'Grid and Operations AI Room', maturity: 'Mature' },
  { name: 'Corporate Services AI Room', maturity: 'Emerging' },
  { name: 'Revenue and Billing AI Room', maturity: 'Developing' },
  { name: 'Project Delivery AI Room', maturity: 'Developing' },
  { name: 'Knowledge and Productivity AI Room', maturity: 'Mature' },
  { name: 'Sustainability AI Room', maturity: 'Emerging' },
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
      excellenceCriteria.push({ id: ecId, name: c, strategicObjectiveId: soId })
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
      strategicGoals: ['Improve process agenticity', 'Deliver validated business value', 'Reduce operational risk'],
      priorityProcessIds: [...new Set(priorityProcessIds)],
      activeInitiativeIds: [...new Set(activeInitiativeIds)],
      agentIds: [...new Set(agentIds)],
      harnessIds: [...new Set(harnessIds)],
      value: { value: int(rng, 200_000, 2_000_000), tag: pick(rng, ['Estimated', 'Observed', 'Validated']) },
      risks: ['Data readiness gaps in legacy systems', 'Change management across affected teams'],
      playbookMaturity: def.maturity,
      nextActions: ['Expand pilot to two more sections', 'Complete harness risk review', 'Publish Q4 value report'],
    }
  })
}
