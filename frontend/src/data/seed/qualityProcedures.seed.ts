// 15 Quality Procedures (Section 21). QP-01 is the D2D Demand Intake & BRD
// Preparation procedure — the one AGT-D2D-DOC-01 and HAR-D2D-BRD-01 convert
// into an agent workflow (Section 6.2/6.4 of the requirements doc).
import type { QpIndicator, QpStatus, QualityProcedure } from '../types'
import { nextQpId } from '../ids'
import { type Rng, int, isoDate, pick } from '../rng'
import type { BuiltOrg } from './organization.seed'
import type { Process } from '../types'

const QP_TITLES = [
  'D2D Demand Intake & BRD Preparation',
  'Billing Exception Handling',
  'Revenue Leakage Investigation',
  'New Connection Provisioning',
  'Outage Restoration Response',
  'Preventive Maintenance Scheduling',
  'Vendor Onboarding & Due Diligence',
  'Procurement Purchase-to-Pay Controls',
  'Employee Onboarding & Access Provisioning',
  'Capital Project Approval Gate',
  'Regulatory Filing & Submission',
  'Safety Incident Reporting',
  'Internal Audit Evidence Collection',
  'Contract Renewal Review',
  'AI Agent Change & Release Control',
]

const STATUSES: QpStatus[] = ['Active', 'Active', 'Active', 'UnderReview', 'Draft', 'Expired']

export function buildQualityProcedures(rng: Rng, org: BuiltOrg, processes: Process[]): QualityProcedure[] {
  const qps: QualityProcedure[] = []
  const d2dSection = org.sectionIdByName['Demand-to-Delivery Section']

  qps.push({
    id: 'QP-01', title: QP_TITLES[0], sectionOwnerId: d2dSection, version: '3.2',
    effectiveDate: '2026-01-15', reviewDate: '2027-01-15', status: 'Active',
    relatedProcessId: 'PROC-D2D',
    activities: ['Intake validation', 'Duplicate screening', 'Stakeholder identification', 'BRD drafting', 'Human review and approval'],
    responsibleRoles: ['Senior Business Analyst', 'IT Lead', 'D2D Governance Lead'],
    inputs: ['Demand submission form', 'Prior approved demands', 'EA standards'],
    outputs: ['Approved BRD', 'Stakeholder register', 'Duplicate assessment'],
    businessRules: ['No demand proceeds to shaping without a completeness check', 'Duplicate demands must be flagged before estimation'],
    controls: ['Human confirmation required before BRD submission', 'Architecture and security review mandatory for all builds'],
    evidence: ['BRD document', 'Agent trace log', 'Approval record'],
    approvals: ['IT Lead', 'DBE Manager'],
    exceptionRules: ['Conflicting requirements escalate to D2D Governance Lead'],
    slaHours: 72, kpi: 'BRD cycle time (target: <72h from intake)',
    assignedAgentIds: ['AGT-D2D-DOC-01'], harnessId: 'HAR-D2D-BRD-01',
    currentAiCoveragePct: 62, targetAiCoveragePct: 80, indicator: 'A+H',
    agentConversion: {
      agentInstructions: ['Follow approved D2D rules and role boundaries', 'Use only the approved output format', 'Never approve a demand autonomously'],
      workflowSteps: ['Retrieve demand + context', 'Check completeness', 'Screen duplicates', 'Draft BRD', 'Route for human confirmation'],
      guardrails: ['Do not fabricate information', 'Use only approved knowledge', 'Escalate conflicting requirements'],
      evaluationCriteria: ['Completeness', 'Accuracy', 'Traceability', 'Template compliance', 'Human acceptance'],
      auditEvidence: ['Full agent trace', 'Source citations', 'Human edit diff'],
    },
  })
  nextQpId() // burn the QP-01 slot the hand-authored record above already used,
  // so the loop below (which calls nextQpId() for every other title) doesn't
  // collide with it.

  for (let i = 1; i < QP_TITLES.length; i++) {
    const process = pick(rng, processes)
    const indicator = pick(rng, ['H', 'H+A', 'A+H', 'A', 'C', 'E'] as QpIndicator[])
    const current = int(rng, 10, 70)
    qps.push({
      id: nextQpId(), title: QP_TITLES[i], sectionOwnerId: process.ownerSectionId, version: `${int(rng, 1, 4)}.${int(rng, 0, 9)}`,
      effectiveDate: isoDate(rng, 2024, 1, 700), reviewDate: isoDate(rng, 2026, 8, 400),
      status: pick(rng, STATUSES), relatedProcessId: process.id,
      activities: ['Intake', 'Processing', 'Review', 'Closure'],
      responsibleRoles: ['Section Manager', 'Process Owner'],
      inputs: ['Request form', 'Supporting documents'],
      outputs: ['Processed record', 'Audit trail'],
      businessRules: ['All exceptions require documented justification'],
      controls: ['Segregation of duties enforced', 'Mandatory evidence attachment'],
      evidence: ['System record', 'Approval log'],
      approvals: ['Section Manager'],
      exceptionRules: ['Escalate to department manager after 2 exceptions'],
      slaHours: int(rng, 8, 168),
      kpi: 'SLA compliance rate',
      assignedAgentIds: [],
      currentAiCoveragePct: current, targetAiCoveragePct: Math.min(95, current + int(rng, 10, 40)),
      indicator,
      agentConversion: {
        agentInstructions: ['Follow the approved procedure steps exactly'],
        workflowSteps: ['Validate input', 'Apply business rules', 'Produce output', 'Log evidence'],
        guardrails: ['Do not bypass mandatory controls'],
        evaluationCriteria: ['Accuracy', 'Completeness', 'Compliance'],
        auditEvidence: ['Process log'],
      },
    })
  }

  return qps
}
