// 15 harnesses (Section 21). HAR-D2D-BRD-01 is the required worked example —
// all 10 guardrails, 9 evaluation criteria, and 7 deployment gates from the
// requirements doc's Section 9 are reproduced verbatim. IDs here
// (HAR-D2D-BRD-01, HAR-02..HAR-15) must match what agents.seed.ts already
// assigned via Agent.harnessId — see that file's comment.
import type { Agent, Employee, Harness, HarnessBlock, HarnessEvaluationResult } from '../types'
import { HARNESS_FLOW } from '../types'
import { type Rng, int, pick } from '../rng'

function findEmployeeByPosition(employees: Employee[], positionId: string): string {
  const e = employees.find((emp) => emp.positionId === positionId)
  if (!e) throw new Error(`No employee found for position ${positionId} — check positions.seed.ts ordering`)
  return e.id
}

function flowWithConfig(config: (type: string) => Record<string, string | string[]>): HarnessBlock[] {
  return HARNESS_FLOW.map((b, i) => ({ type: b.type, order: i + 1, config: config(b.type) }))
}

const D2D_GUARDRAILS = [
  'Do not fabricate information',
  'Use only approved knowledge',
  'Identify missing information',
  'Cite internal sources',
  'Do not approve a demand',
  'Do not modify official data without approval',
  'Escalate conflicting requirements',
  'Apply security and architecture checks',
  'Mask restricted information',
  'Stop after repeated failures',
]

const D2D_EVALUATIONS: HarnessEvaluationResult[] = [
  { criterion: 'Completeness', scorePct: 94 },
  { criterion: 'Accuracy', scorePct: 91 },
  { criterion: 'Traceability', scorePct: 97 },
  { criterion: 'TemplateCompliance', scorePct: 99 },
  { criterion: 'StakeholderRelevance', scorePct: 88 },
  { criterion: 'ArchitectureCompliance', scorePct: 93 },
  { criterion: 'SecurityCompliance', scorePct: 98 },
  { criterion: 'HallucinationCheck', scorePct: 96 },
  { criterion: 'HumanAcceptance', scorePct: 89 },
]

const D2D_FLOW_CONFIG: Record<string, Record<string, string | string[]>> = {
  Trigger: { source: 'New or updated D2D demand record' },
  ContextRetrieval: { sources: ['Demand record', 'Division', 'Process', 'Similar demands', 'EA standards', 'Approved templates'] },
  Validation: { checks: ['Completeness', 'Duplicate screening'] },
  Reasoning: { model: 'Claude Sonnet 4.5', mode: 'structured drafting' },
  ToolCall: { tools: ['Read D2D', 'Retrieve knowledge', 'Identify duplicates'] },
  OutputGeneration: { output: 'Draft BRD sections' },
  QualityEvaluation: { suite: 'D2D BRD evaluation suite (9 criteria)' },
  HumanApproval: { approver: 'Senior Business Analyst', required: 'true' },
  CommitToSystem: { target: 'D2D Demand Portal' },
  LogOutcome: { destination: 'Harness observability store' },
  ValueUpdate: { destination: 'VR ledger' },
}

export function buildHarnesses(rng: Rng, agents: Agent[], employees: Employee[]): Harness[] {
  const harnesses: Harness[] = []

  harnesses.push({
    id: 'HAR-D2D-BRD-01',
    name: 'D2D BRD Harness',
    assignedAgentId: 'AGT-D2D-DOC-01',
    assignedProcessId: 'PROC-D2D',
    version: '2.3',
    status: 'Production',
    businessOwnerId: findEmployeeByPosition(employees, 'POS-DBE-MGR-01'),
    technicalOwnerId: findEmployeeByPosition(employees, 'POS-AI-PLATFORM-01'),
    systemInstructions: 'You are the D2D Documentation Agent. Draft complete, traceable Business Requirement Documents from approved demand data. Never invent facts. Never approve or modify official records. Always request human confirmation before submission.',
    businessInstructions: 'Follow the D2D Demand Intake & BRD Preparation Quality Procedure (QP-01) exactly. Flag duplicates and missing stakeholders before drafting.',
    approvedKnowledgeSources: ['D2D policy', 'BRD templates', 'EA standards', 'Prior approved demand examples'],
    toolsAndApis: ['D2D APIs (read demand, save draft, route for approval)', 'Enterprise knowledge search', 'Duplicate-detection service', 'Document generation service'],
    workflowStages: flowWithConfig((type) => D2D_FLOW_CONFIG[type] ?? {}),
    humanApprovalPoints: ['Business confirmation', 'IT Lead review', 'Management approval'],
    guardrails: D2D_GUARDRAILS,
    validationRules: ['Completeness check before drafting', 'Duplicate check before estimation', 'No submission without human confirmation'],
    evaluationSuite: D2D_EVALUATIONS,
    confidenceThreshold: 0.85,
    retryLimits: 2,
    escalationRules: ['Conflicting requirements escalate to D2D Governance Lead', 'Repeated evaluation failure escalates to AI Platform Team Lead'],
    tokenLimit: 120_000,
    modelRoutingPolicy: 'Primary: Claude Sonnet 4.5. Fallback: GPT-4.1 on outage.',
    loggingPolicy: 'Full trace retained 12 months; PII masked in logs.',
    killSwitchEnabled: true,
    releaseHistory: [
      { version: '1.0', date: '2026-02-10', notes: 'Initial production release.' },
      { version: '2.0', date: '2026-04-18', notes: 'Added duplicate-detection tool call.' },
      { version: '2.3', date: '2026-06-30', notes: 'Tightened hallucination-check threshold.' },
    ],
  })

  const otherAgents = agents.filter((a) => a.id !== 'AGT-D2D-DOC-01')
  otherAgents.forEach((agent, idx) => {
    const id = `HAR-${String(idx + 2).padStart(2, '0')}`
    harnesses.push({
      id,
      name: `${agent.name} Harness`,
      assignedAgentId: agent.id,
      assignedProcessId: pick(rng, ['PROC-D2D', 'PROC-02', 'PROC-03', 'PROC-04', 'PROC-05']),
      version: `${int(rng, 1, 3)}.${int(rng, 0, 9)}`,
      status: pick(rng, ['Development', 'TechnicalTesting', 'BusinessEvaluation', 'RiskReview', 'Probation', 'Production', 'Production'] as Harness['status'][]),
      businessOwnerId: agent.businessOwnerEmployeeId,
      technicalOwnerId: agent.technicalOwnerEmployeeId,
      systemInstructions: `You are the ${agent.name}. Operate strictly within your assigned process and never take action outside your approved scope.`,
      businessInstructions: 'Follow the assigned Quality Procedure and escalate exceptions to the agent manager.',
      approvedKnowledgeSources: ['Relevant Quality Procedure', 'Section knowledge base'],
      toolsAndApis: ['Enterprise data APIs', 'Notification service'],
      workflowStages: flowWithConfig(() => ({})),
      humanApprovalPoints: agent.autonomyLevel === 'L5' ? [] : ['Human review before commit'],
      guardrails: ['Do not fabricate information', 'Do not act outside approved scope', 'Escalate low-confidence outputs'],
      validationRules: ['Input schema validation', 'Output schema validation'],
      evaluationSuite: D2D_EVALUATIONS.map((e) => ({ criterion: e.criterion, scorePct: int(rng, 70, 99) })),
      confidenceThreshold: int(rng, 70, 92) / 100,
      retryLimits: int(rng, 1, 3),
      escalationRules: ['Escalate to agent manager after repeated failure'],
      tokenLimit: int(rng, 20_000, 150_000),
      modelRoutingPolicy: `Primary: ${agent.model}.`,
      loggingPolicy: 'Full trace retained 12 months.',
      killSwitchEnabled: true,
      releaseHistory: [{ version: '1.0', date: agent.dateOnboarded, notes: 'Initial release.' }],
    })
  })

  return harnesses
}
