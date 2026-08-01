// 20 processes (Section 21). PROC-D2D is the primary worked example — its 14
// steps are reproduced verbatim from the requirements doc's Section 6.
import type { AgenticityLevel, Process, ProcessStep, QpIndicator } from '../types'
import { nextProcessId, nextProcessStepId } from '../ids'
import { type Rng, int, pick } from '../rng'
import type { BuiltOrg } from './organization.seed'
import type { Agent } from '../types'

const D2D_STEPS: Array<{ name: string; currentOwner: ProcessStep['currentOwner']; futureOwner: ProcessStep['futureOwner']; automation: AgenticityLevel; control: QpIndicator }> = [
  { name: 'Demand submission', currentOwner: 'Human', futureOwner: 'Human', automation: 'L1', control: 'H' },
  { name: 'Demand classification', currentOwner: 'Human', futureOwner: 'Agent', automation: 'L3', control: 'A+H' },
  { name: 'Completeness validation', currentOwner: 'Human', futureOwner: 'Agent', automation: 'L3', control: 'A+H' },
  { name: 'Duplicate identification', currentOwner: 'Human', futureOwner: 'Agent', automation: 'L4', control: 'A' },
  { name: 'Stakeholder identification', currentOwner: 'Human', futureOwner: 'Human+Agent', automation: 'L2', control: 'H+A' },
  { name: 'Shaping', currentOwner: 'Human', futureOwner: 'Human+Agent', automation: 'L2', control: 'H+A' },
  { name: 'Estimation', currentOwner: 'Human', futureOwner: 'Human+Agent', automation: 'L2', control: 'H+A' },
  { name: 'BRD preparation', currentOwner: 'Human', futureOwner: 'Agent', automation: 'L3', control: 'A+H' },
  { name: 'Architecture and security review', currentOwner: 'Human', futureOwner: 'Human', automation: 'L1', control: 'C' },
  { name: 'Approval', currentOwner: 'Human', futureOwner: 'Human', automation: 'L1', control: 'C' },
  { name: 'Build', currentOwner: 'Human', futureOwner: 'Human+Agent', automation: 'L2', control: 'H+A' },
  { name: 'Testing', currentOwner: 'Human', futureOwner: 'Human+Agent', automation: 'L2', control: 'H+A' },
  { name: 'Deployment', currentOwner: 'Human', futureOwner: 'Human', automation: 'L1', control: 'C' },
  { name: 'Value Realization review', currentOwner: 'Human', futureOwner: 'Human+Agent', automation: 'L2', control: 'H+A' },
]

const OTHER_PROCESS_NAMES = [
  'Meter-to-Bill Processing', 'Customer Complaint Resolution', 'New Connection Provisioning',
  'Outage Restoration', 'Preventive Maintenance Planning', 'Vendor Onboarding',
  'Procurement Purchase-to-Pay', 'Employee Onboarding', 'Asset Disposal',
  'Regulatory Filing', 'Revenue Leakage Investigation', 'Capital Project Approval',
  'Fuel Supply Planning', 'Solar Park Commissioning', 'Grid Incident Response',
  'Contract Renewal', 'Budget Consolidation', 'Internal Audit Cycle', 'Safety Incident Reporting',
]

export interface BuiltProcesses {
  processes: Process[]
  processSteps: ProcessStep[]
}

export function buildProcesses(rng: Rng, org: BuiltOrg, agents: Agent[]): BuiltProcesses {
  const processes: Process[] = []
  const processSteps: ProcessStep[] = []
  const d2dSection = org.sectionIdByName['Demand-to-Delivery Section']
  const d2dDivision = org.orgNodes.find((n) => n.id === d2dSection)!.divisionId!

  processes.push({
    id: 'PROC-D2D', name: 'Demand-to-Delivery (D2D)', divisionId: d2dDivision, ownerSectionId: d2dSection,
    currentAgenticity: 'L2', targetAgenticity: 'L4', readinessScore: 82, riskScore: 28,
    estimatedBenefit: { value: 1_450_000, tag: 'Validated' },
  })
  D2D_STEPS.forEach((s, idx) => {
    const stepId = nextProcessStepId()
    processSteps.push({
      id: stepId, processId: 'PROC-D2D', order: idx + 1, name: s.name,
      currentOwner: s.currentOwner, futureOwner: s.futureOwner,
      humanContributionPct: s.futureOwner === 'Human' ? 100 : s.futureOwner === 'Agent' ? 15 : 55,
      agentContributionPct: s.futureOwner === 'Human' ? 0 : s.futureOwner === 'Agent' ? 85 : 45,
      automationLevel: s.automation, controlRequirement: s.control,
      avgProcessingTimeMins: int(rng, 15, 240), slaMins: int(rng, 60, 480),
      qualityScore: int(rng, 78, 98), exceptionRatePct: int(rng, 1, 12),
      assignedAgentId: s.name === 'Demand classification' ? agents[1]?.id
        : s.name === 'Duplicate identification' ? agents[2]?.id
        : s.name === 'Stakeholder identification' ? agents[3]?.id
        : s.name === 'BRD preparation' ? 'AGT-D2D-DOC-01'
        : undefined,
      assignedHarnessId: s.name === 'BRD preparation' ? 'HAR-D2D-BRD-01' : undefined,
      valueOpportunity: { value: int(rng, 20_000, 220_000), tag: pick(rng, ['Estimated', 'Observed']) },
    })
  })

  const sectionNames = Object.keys(org.sectionIdByName)
  for (const name of OTHER_PROCESS_NAMES) {
    const sectionName = pick(rng, sectionNames)
    const sectionId = org.sectionIdByName[sectionName]
    const divisionId = org.orgNodes.find((n) => n.id === sectionId)!.divisionId!
    const current = pick(rng, ['L0', 'L1', 'L2', 'L3'] as AgenticityLevel[])
    const target = pick(rng, ['L2', 'L3', 'L4', 'L5'] as AgenticityLevel[])
    const processId = nextProcessId()
    processes.push({
      id: processId, name, divisionId, ownerSectionId: sectionId,
      currentAgenticity: current, targetAgenticity: target,
      readinessScore: int(rng, 35, 92), riskScore: int(rng, 10, 70),
      estimatedBenefit: { value: int(rng, 40_000, 900_000), tag: pick(rng, ['Estimated', 'Observed', 'Validated']) },
    })
    // Agents that sit in the section owning this process are the ones that
    // would actually run its steps. Without this, only the four hand-authored
    // D2D steps named an agent, leaving 14 of 15 agents with no process link
    // at all — which emptied the agent layer of the strategy map, the Agents
    // module's Process Assignments tab, and the playbook's agent resolution.
    const sectionAgents = agents.filter((a) => a.orgAssignment.sectionId === sectionId)
    const stepCount = int(rng, 4, 8)
    for (let i = 0; i < stepCount; i++) {
      const stepId = nextProcessStepId()
      const futureOwner = pick(rng, ['Human', 'Agent', 'Human+Agent'] as ProcessStep['futureOwner'][])
      // A step only gets an agent if an agent will actually own part of it.
      const assignedAgentId = futureOwner !== 'Human' && sectionAgents.length > 0
        ? pick(rng, sectionAgents).id
        : undefined
      processSteps.push({
        id: stepId, processId, order: i + 1, name: `${name} — step ${i + 1}`,
        currentOwner: pick(rng, ['Human', 'Human+Agent'] as ProcessStep['currentOwner'][]),
        futureOwner,
        humanContributionPct: futureOwner === 'Human' ? 100 : futureOwner === 'Agent' ? int(rng, 5, 20) : int(rng, 40, 65),
        agentContributionPct: futureOwner === 'Human' ? 0 : futureOwner === 'Agent' ? int(rng, 80, 95) : int(rng, 35, 60),
        automationLevel: pick(rng, ['L0', 'L1', 'L2', 'L3', 'L4'] as AgenticityLevel[]),
        controlRequirement: pick(rng, ['H', 'H+A', 'A+H', 'A', 'C', 'E'] as QpIndicator[]),
        avgProcessingTimeMins: int(rng, 10, 300), slaMins: int(rng, 60, 600),
        qualityScore: int(rng, 70, 99), exceptionRatePct: int(rng, 0, 18),
        assignedAgentId,
        assignedHarnessId: assignedAgentId
          ? agents.find((a) => a.id === assignedAgentId)?.harnessId
          : undefined,
        valueOpportunity: { value: int(rng, 5_000, 150_000), tag: pick(rng, ['Estimated', 'Observed']) },
      })
    }
  }

  return { processes, processSteps }
}
