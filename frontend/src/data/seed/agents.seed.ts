// 15 agents (Section 21), including the required worked example
// AGT-D2D-DOC-01 "D2D Documentation Agent" with its exact named owners
// (Manager: IT Lead, Business Owner: DBE Manager, Technical Owner: AI
// Platform Team, Risk Owner: Information Security — from the requirements
// doc's Section 8 example).
import type { Agent, AgentStatus, AgentType, Employee } from '../types'
import { nextAgentId } from '../ids'
import { type Rng, bool, float, int, isoDate, pick } from '../rng'
import type { BuiltOrg } from './organization.seed'

const MODELS = ['GPT-4.1', 'Claude Sonnet 4.5', 'Gemini 2.5 Pro', 'SAP Joule', 'Azure OpenAI GPT-4o', 'Local Llama 3.1 70B']
const STATUSES: AgentStatus[] = ['Active', 'Active', 'Active', 'Probation', 'Evaluation', 'Development', 'Restricted']

function findEmployeeByPosition(employees: Employee[], positionId: string): string {
  const e = employees.find((emp) => emp.positionId === positionId)
  if (!e) throw new Error(`No employee found for position ${positionId} — check positions.seed.ts ordering`)
  return e.id
}

export function buildAgents(rng: Rng, org: BuiltOrg, employees: Employee[]): Agent[] {
  const agents: Agent[] = []
  const digitalInnovationDivisionId = org.divisionIdByName['Customer & Digital Services Division']

  // ── The required worked example ────────────────────────────────────────
  agents.push({
    id: 'AGT-D2D-DOC-01',
    name: 'D2D Documentation Agent',
    digitalJobTitle: 'D2D Intake and BRD Agent',
    orgAssignment: { divisionId: digitalInnovationDivisionId, sectionId: org.sectionIdByName['Demand-to-Delivery Section'], positionId: 'POS-BA-D2D-01' },
    managerEmployeeId: findEmployeeByPosition(employees, 'POS-IT-LEAD-01'),
    businessOwnerEmployeeId: findEmployeeByPosition(employees, 'POS-DBE-MGR-01'),
    technicalOwnerEmployeeId: findEmployeeByPosition(employees, 'POS-AI-PLATFORM-01'),
    riskOwnerEmployeeId: findEmployeeByPosition(employees, 'POS-INFOSEC-01'),
    productOwnerEmployeeId: findEmployeeByPosition(employees, 'POS-DBE-MGR-01'),
    assignedProcessIds: ['PROC-D2D'],
    assignedQpIds: ['QP-01'],
    agentType: 'TaskAgent',
    model: 'Claude Sonnet 4.5',
    modelVersion: '4.5.2',
    autonomyLevel: 'L3',
    dataAccess: ['D2D demand records', 'EA standards repository', 'Approved BRD templates', 'Prior approved demands (read-only)'],
    systemAccess: ['D2D Demand Portal (read/draft-write)', 'Knowledge search API', 'Document generation service'],
    workingHours: '24/7 (unattended draft generation, human review during business hours)',
    status: 'Active',
    dateOnboarded: '2026-02-10',
    performanceScore: 88,
    qualityScore: 91,
    complianceScore: 96,
    humanOverrideRatePct: 12,
    tokenConsumption: 18_400_000,
    cost: { value: 42_600, tag: 'Observed' },
    valueGenerated: { value: 186_000, tag: 'Validated' },
    nextPerformanceReview: '2026-10-01',
    harnessId: 'HAR-D2D-BRD-01',
  })

  // ── 14 more agents spread across divisions/sections/processes ──────────
  const AGENT_DEFS: Array<{ name: string; title: string; sectionName: string; agentType: AgentType; autonomy: Agent['autonomyLevel'] }> = [
    { name: 'Demand Classification Agent', title: 'D2D Classification Agent', sectionName: 'Demand-to-Delivery Section', agentType: 'TaskAgent', autonomy: 'L3' },
    { name: 'Duplicate Demand Detection Agent', title: 'D2D Duplicate Screening Agent', sectionName: 'Demand-to-Delivery Section', agentType: 'TaskAgent', autonomy: 'L4' },
    { name: 'Stakeholder Identification Agent', title: 'D2D Stakeholder Agent', sectionName: 'Demand-to-Delivery Section', agentType: 'TaskAgent', autonomy: 'L2' },
    { name: 'Invoice Validation Agent', title: 'Billing Invoice Validation Agent', sectionName: 'Billing Operations Section', agentType: 'TaskAgent', autonomy: 'L4' },
    { name: 'Management Reporting Copilot', title: 'Executive Reporting Copilot', sectionName: 'Financial Planning Section', agentType: 'Copilot', autonomy: 'L2' },
    { name: 'Quality Procedure Compliance Agent', title: 'QP Compliance Agent', sectionName: 'Regulatory Compliance Section', agentType: 'TaskAgent', autonomy: 'L3' },
    { name: 'Value Realization Validation Agent', title: 'VR Validation Agent', sectionName: 'Financial Planning Section', agentType: 'TaskAgent', autonomy: 'L2' },
    { name: 'Revenue Leakage Detection Agent', title: 'Revenue Assurance Agent', sectionName: 'Revenue Assurance Section', agentType: 'TaskAgent', autonomy: 'L4' },
    { name: 'Customer Complaint Triage Agent', title: 'Contact Center Triage Agent', sectionName: 'Contact Center Section', agentType: 'TaskAgent', autonomy: 'L3' },
    { name: 'Grid Anomaly Detection Agent', title: 'Grid Anomaly Monitoring Agent', sectionName: 'Grid Control Section', agentType: 'AutonomousAgent', autonomy: 'L5' },
    { name: 'Asset Maintenance Scheduling Agent', title: 'Predictive Maintenance Agent', sectionName: 'Asset Reliability Section', agentType: 'TaskAgent', autonomy: 'L3' },
    { name: 'Vendor Onboarding Agent', title: 'Procurement Onboarding Agent', sectionName: 'Vendor Management Section', agentType: 'TaskAgent', autonomy: 'L2' },
    { name: 'HR Policy Copilot', title: 'HR Policy Assistant Copilot', sectionName: 'Talent & Workforce Section', agentType: 'Copilot', autonomy: 'L1' },
    { name: 'Enterprise Risk Scoring Agent', title: 'Risk Scoring Agent', sectionName: 'Enterprise Risk Section', agentType: 'TaskAgent', autonomy: 'L3' },
  ]

  for (const def of AGENT_DEFS) {
    const sectionId = org.sectionIdByName[def.sectionName]
    const divisionId = org.orgNodes.find((n) => n.id === sectionId)!.divisionId!
    const sectionEmployees = employees.filter((e) => e.sectionId === sectionId)
    const anyEmployee = () => pick(rng, sectionEmployees.length ? sectionEmployees : employees).id
    const id = nextAgentId()
    agents.push({
      id,
      name: def.name,
      digitalJobTitle: def.title,
      orgAssignment: { divisionId, sectionId },
      managerEmployeeId: anyEmployee(),
      businessOwnerEmployeeId: anyEmployee(),
      technicalOwnerEmployeeId: findEmployeeByPosition(employees, 'POS-AI-PLATFORM-01'),
      riskOwnerEmployeeId: findEmployeeByPosition(employees, 'POS-INFOSEC-01'),
      assignedProcessIds: [],
      assignedQpIds: [],
      agentType: def.agentType,
      model: pick(rng, MODELS),
      modelVersion: `${int(rng, 1, 4)}.${int(rng, 0, 9)}`,
      autonomyLevel: def.autonomy,
      dataAccess: ['Relevant section records (read)', 'Approved knowledge base'],
      systemAccess: ['D2D APIs', 'Enterprise data platform'],
      workingHours: bool(rng, 0.6) ? '24/7 unattended' : 'Business hours, human-supervised',
      status: pick(rng, STATUSES),
      dateOnboarded: isoDate(rng, 2025, 6, 380),
      performanceScore: int(rng, 62, 96),
      qualityScore: int(rng, 65, 97),
      complianceScore: int(rng, 80, 100),
      humanOverrideRatePct: int(rng, 2, 35),
      tokenConsumption: int(rng, 400_000, 22_000_000),
      cost: { value: int(rng, 4_000, 60_000), tag: pick(rng, ['Observed', 'Estimated']) },
      valueGenerated: { value: int(rng, 10_000, 260_000), tag: pick(rng, ['Estimated', 'Observed', 'Validated']) },
      nextPerformanceReview: isoDate(rng, 2026, 8, 180),
      harnessId: `HAR-${String(agents.length + 1).padStart(2, '0')}`,
    })
  }

  return agents
}
