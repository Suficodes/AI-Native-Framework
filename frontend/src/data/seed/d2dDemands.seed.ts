// D2D demand register — the 12-stage journey (Section 11 of the requirements
// doc) with a contribution timeline per demand.
import type { D2DDemand, D2DStage, Employee, Process, StrategicObjective } from '../types'
import { D2D_STAGE_ORDER } from '../types'
import { nextDemandId } from '../ids'
import { type Rng, bool, int, isoDate, pick } from '../rng'
import type { BuiltOrg } from './organization.seed'

const DEMAND_TITLES = [
  'Automate BRD drafting for standard demands', 'Duplicate demand detection for D2D intake',
  'Stakeholder auto-suggestion for new demands', 'AI-assisted architecture review triage',
  'Self-service demand status tracking', 'Smart SLA breach prediction for D2D',
  'Automated demand classification by division', 'AI summary of prior similar demands',
  'BRD template compliance checker', 'Demand backlog prioritization assistant',
  'D2D onboarding copilot for new requesters', 'Cross-division duplicate demand reconciliation',
]

function buildTimeline(rng: Rng, stage: D2DStage): D2DDemand['contributionTimeline'] {
  const stageIndex = D2D_STAGE_ORDER.findIndex((s) => s.stage === stage)
  const events: D2DDemand['contributionTimeline'] = []
  const actors: Array<D2DDemand['contributionTimeline'][number]['actor']> = ['Human', 'Copilot', 'Agent', 'HumanApproval']
  for (let i = 0; i <= stageIndex; i++) {
    events.push({
      timestamp: isoDate(rng, 2026, 1, 200),
      actor: pick(rng, actors),
      activity: `${D2D_STAGE_ORDER[i].label} completed`,
    })
  }
  return events
}

export function buildD2DDemands(rng: Rng, org: BuiltOrg, processes: Process[], strategicObjectives: StrategicObjective[], employees: Employee[]): D2DDemand[] {
  const demands: D2DDemand[] = []
  const d2dProcess = processes.find((p) => p.id === 'PROC-D2D')!

  for (const title of DEMAND_TITLES) {
    const stage = pick(rng, D2D_STAGE_ORDER.map((s) => s.stage))
    const divisionId = pick(rng, org.orgNodes.filter((n) => n.level === 'Division')).id
    const isLive = stage === 'GoLive' || stage === 'PerformanceMonitoring' || stage === 'VRValidation' || stage === 'PlaybookUpdate'
    // The demand targets the business process it will change, in its own
    // division. D2D is the pipeline the demand flows THROUGH, not the process
    // it changes — pointing every demand at PROC-D2D collapsed that
    // distinction and lost the demand→process relationship entirely.
    const divisionProcesses = processes.filter((p) => p.divisionId === divisionId && p.id !== d2dProcess.id)
    const targetProcess = divisionProcesses.length > 0 ? pick(rng, divisionProcesses) : d2dProcess
    demands.push({
      id: nextDemandId(), title, divisionId, submitterEmployeeId: pick(rng, employees).id,
      processId: targetProcess.id, strategicObjectiveId: pick(rng, strategicObjectives).id,
      aiOpportunity: 'AI/agent support for demand intake, classification, or documentation.',
      agentProposedId: bool(rng, 0.6) ? 'AGT-D2D-DOC-01' : undefined,
      harnessProposedId: bool(rng, 0.6) ? 'HAR-D2D-BRD-01' : undefined,
      stage, slaDays: int(rng, 5, 30),
      brdStatus: pick(rng, ['NotStarted', 'Drafted', 'UnderReview', 'Approved']),
      duplicateFindings: bool(rng, 0.25) ? ['Potential overlap with DEM-2025-0142'] : [],
      stakeholders: ['Business Owner', 'IT Lead', 'Enterprise Architect'],
      architectureAssessment: bool(rng, 0.7) ? 'Compliant with EA standards' : 'Pending review',
      securityAssessment: bool(rng, 0.7) ? 'No material risk identified' : 'Pending review',
      estimatedValue: { value: int(rng, 30_000, 400_000), tag: 'Estimated' },
      tokenBudget: int(rng, 100_000, 5_000_000),
      milestones: [
        { name: 'Intake complete', date: isoDate(rng, 2026, 1, 60), done: true },
        { name: 'Shaping complete', date: isoDate(rng, 2026, 2, 60), done: isLive || bool(rng, 0.6) },
        { name: 'Go-live', date: isoDate(rng, 2026, 4, 120), done: isLive },
      ],
      goLiveStatus: isLive ? 'Live' : 'NotLive',
      vrStatus: isLive ? pick(rng, ['Baseline captured', 'Under validation', 'Realized']) : 'Not started',
      contributionTimeline: buildTimeline(rng, stage),
    })
  }

  return demands
}
