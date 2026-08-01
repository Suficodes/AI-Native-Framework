// 20 AI initiatives (Section 21), including the 8 named examples from
// Section 7 of the requirements doc.
import type { AIInitiative, InitiativeStage, Process, QualityProcedure, StrategicObjective, ExcellenceCriterion, Employee } from '../types'
import { nextInitiativeId } from '../ids'
import { type Rng, int, isoDate, pick } from '../rng'
import type { BuiltOrg } from './organization.seed'

const NAMED_INITIATIVES = [
  { title: 'AI BRD Generator', processId: 'PROC-D2D', agentId: 'AGT-D2D-DOC-01' },
  { title: 'Demand Classification Agent', processId: 'PROC-D2D', agentId: undefined as string | undefined },
  { title: 'Duplicate Demand Detection Agent', processId: 'PROC-D2D', agentId: undefined as string | undefined },
  { title: 'Stakeholder Identification Agent', processId: 'PROC-D2D', agentId: undefined as string | undefined },
  { title: 'Invoice Validation Agent', processId: undefined as string | undefined, agentId: undefined as string | undefined },
  { title: 'Management Reporting Copilot', processId: undefined as string | undefined, agentId: undefined as string | undefined },
  { title: 'Quality Procedure Compliance Agent', processId: undefined as string | undefined, agentId: undefined as string | undefined },
  { title: 'Value Realization Validation Agent', processId: undefined as string | undefined, agentId: undefined as string | undefined },
]

const EXTRA_TITLES = [
  'Predictive Maintenance Copilot for Distribution', 'Grid Load Forecasting Agent', 'Solar Yield Optimization Agent',
  'Contact Center Sentiment Analysis Agent', 'Vendor Risk Scoring Agent', 'Employee Onboarding Copilot',
  'Regulatory Filing Assistant', 'Capital Project Risk Agent', 'Safety Incident Classification Agent',
  'Contract Clause Extraction Agent', 'Budget Variance Explainer Copilot', 'Asset Disposal Recommendation Agent',
]

const STAGES: InitiativeStage[] = ['Idea', 'Assessment', 'D2DIntake', 'Shaping', 'Estimation', 'Build', 'Evaluation', 'Probation', 'Production', 'Scaling', 'Retired']

export function buildAIInitiatives(
  rng: Rng, org: BuiltOrg, processes: Process[], qps: QualityProcedure[],
  strategicObjectives: StrategicObjective[], excellenceCriteria: ExcellenceCriterion[], employees: Employee[],
): AIInitiative[] {
  const initiatives: AIInitiative[] = []
  const d2dSection = org.sectionIdByName['Demand-to-Delivery Section']
  const d2dDivision = org.orgNodes.find((n) => n.id === d2dSection)!.divisionId!

  function randomOwner(): string { return pick(rng, employees).id }
  function randomSO(): StrategicObjective { return pick(rng, strategicObjectives) }

  for (const def of NAMED_INITIATIVES) {
    const so = randomSO()
    const ec = excellenceCriteria.find((e) => e.strategicObjectiveId === so.id) ?? pick(rng, excellenceCriteria)
    const process = def.processId ? processes.find((p) => p.id === def.processId) : pick(rng, processes)
    const qp = qps.find((q) => q.relatedProcessId === process?.id)
    const stage = pick(rng, ['Production', 'Scaling', 'Probation', 'Evaluation'] as InitiativeStage[])
    initiatives.push({
      id: nextInitiativeId(), title: def.title, divisionId: d2dDivision, sectionId: d2dSection,
      strategicObjectiveId: so.id, excellenceCriterionId: ec.id,
      relatedProcessId: process?.id, relatedQpId: qp?.id,
      businessOwnerId: randomOwner(), itOwnerId: randomOwner(), agentOwnerId: def.agentId,
      status: pick(rng, ['OnTrack', 'OnTrack', 'AtRisk']), stage,
      aiType: def.agentId ? 'TaskAgent' : 'Copilot',
      agenticityTarget: pick(rng, ['L3', 'L4', 'L5']),
      expectedValue: { value: int(rng, 80_000, 900_000), tag: 'Estimated' },
      realizedValue: { value: int(rng, 20_000, 700_000), tag: stage === 'Production' || stage === 'Scaling' ? 'Validated' : 'Estimated' },
      totalCost: int(rng, 40_000, 300_000), tokenBudget: int(rng, 500_000, 20_000_000),
      riskLevel: pick(rng, ['Low', 'Medium']), dataReadiness: int(rng, 60, 98), harnessReadiness: int(rng, 55, 99),
      goLiveDate: isoDate(rng, 2026, 1, 240),
    })
  }

  for (const title of EXTRA_TITLES) {
    const so = randomSO()
    const ec = excellenceCriteria.find((e) => e.strategicObjectiveId === so.id) ?? pick(rng, excellenceCriteria)
    const process = pick(rng, processes)
    const sectionId = process.ownerSectionId
    const divisionId = org.orgNodes.find((n) => n.id === sectionId)!.divisionId!
    const stage = pick(rng, STAGES)
    initiatives.push({
      id: nextInitiativeId(), title, divisionId, sectionId,
      strategicObjectiveId: so.id, excellenceCriterionId: ec.id, relatedProcessId: process.id,
      businessOwnerId: randomOwner(), itOwnerId: randomOwner(),
      status: pick(rng, ['OnTrack', 'AtRisk', 'Delayed', 'OnTrack', 'Complete']),
      stage, aiType: pick(rng, ['Copilot', 'TaskAgent', 'AutonomousAgent']),
      agenticityTarget: pick(rng, ['L2', 'L3', 'L4', 'L5']),
      expectedValue: { value: int(rng, 30_000, 600_000), tag: 'Estimated' },
      realizedValue: { value: int(rng, 0, 400_000), tag: pick(rng, ['Estimated', 'Observed']) },
      totalCost: int(rng, 20_000, 250_000), tokenBudget: int(rng, 100_000, 12_000_000),
      riskLevel: pick(rng, ['Low', 'Medium', 'High']), dataReadiness: int(rng, 30, 95), harnessReadiness: int(rng, 20, 90),
      goLiveDate: stage === 'Production' || stage === 'Scaling' ? isoDate(rng, 2025, 10, 280) : undefined,
    })
  }

  return initiatives
}
