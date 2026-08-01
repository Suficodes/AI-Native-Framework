// Core entity model for the AI-Native Enterprise Control Tower prototype.
// Every module's mock data conforms to these shapes. See CONVENTIONS.md for
// ID-prefix conventions and data/mockApi.ts for how these are served.

export type ID = string

export type ValueTagKind = 'Estimated' | 'Observed' | 'Verified' | 'Validated'
export interface Tagged<T> {
  value: T
  tag: ValueTagKind
}

export type AgenticityLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'
export const AGENTICITY_LABELS: Record<AgenticityLevel, string> = {
  L0: 'Manual',
  L1: 'Digitized',
  L2: 'AI-assisted',
  L3: 'Partly agentic',
  L4: 'Agent-led',
  L5: 'Autonomous within approved boundaries',
  L6: 'Controlled self-optimizing',
}
export const AGENTICITY_ORDER: AgenticityLevel[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']

export type QpIndicator = 'H' | 'H+A' | 'A+H' | 'A' | 'C' | 'E'
export const QP_INDICATOR_LABELS: Record<QpIndicator, string> = {
  H: 'Human',
  'H+A': 'Human supported by agent',
  'A+H': 'Agent executes, human reviews',
  A: 'Agent executes autonomously',
  C: 'Mandatory human control',
  E: 'Exception requiring escalation',
}

export type WorkforceType = 'Human' | 'HumanPlusCopilot' | 'HumanPlusAgent' | 'AgentOnly'
export const WORKFORCE_TYPE_LABELS: Record<WorkforceType, string> = {
  Human: 'Human-only',
  HumanPlusCopilot: 'Human + Copilot',
  HumanPlusAgent: 'Human + Managed Agent',
  AgentOnly: 'Agent-only within boundary',
}

// ─────────────────────────── Organization ───────────────────────────

export type OrgLevel = 'Enterprise' | 'Division' | 'SuperDepartment' | 'Department' | 'Section'

export interface OrgNode {
  id: ID
  level: OrgLevel
  name: string
  parentId: ID | null
  divisionId: ID | null
  mandate?: string
  managerEmployeeId?: ID | null
  headcountHuman: number
  headcountAgent: number
  strategicObjectiveIds: ID[]
}

export interface AreaOfActivity {
  id: ID
  name: string
  aiContributionPct: number
  contributionType: 'AgentSupported' | 'AgentExecuted' | 'HumanOnly'
}

export interface JobDescription {
  id: ID
  positionId: ID
  summary: string
  keyResponsibilities: string[]
  competencies: string[]
  activities: AreaOfActivity[]
}

export interface Position {
  id: ID
  title: string
  sectionId: ID
  divisionId: ID
  workforceType: WorkforceType
  jobDescriptionId: ID
  assignedEmployeeId?: ID | null
  assignedAgentIds: ID[]
  aiWorkCoveragePct: number
  humanContributionPct: number
  agentContributionPct: number
  qualityAdjustedAiCoveragePct: number
  verifiedCapacityReleasedHours: Tagged<number>
  performanceKpiIds: ID[]
  relatedProcessIds: ID[]
  relatedQpIds: ID[]
}

export interface Employee {
  id: ID
  name: string
  positionId: ID
  sectionId: ID
  divisionId: ID
  managerId?: ID | null
  copilotLicensed: boolean
  hireDate: string
}

// ─────────────────────────── Agents ───────────────────────────

export type AgentStatus = 'Proposed' | 'Development' | 'Evaluation' | 'Probation' | 'Active' | 'Restricted' | 'Suspended' | 'Retired'
export type AgentType = 'Copilot' | 'TaskAgent' | 'AutonomousAgent' | 'OrchestratorAgent'

export interface Agent {
  id: ID
  name: string
  digitalJobTitle: string
  orgAssignment: { divisionId: ID; sectionId: ID; positionId?: ID }
  managerEmployeeId: ID
  businessOwnerEmployeeId: ID
  technicalOwnerEmployeeId: ID
  riskOwnerEmployeeId: ID
  productOwnerEmployeeId?: ID
  assignedProcessIds: ID[]
  assignedQpIds: ID[]
  agentType: AgentType
  model: string
  modelVersion: string
  autonomyLevel: AgenticityLevel
  dataAccess: string[]
  systemAccess: string[]
  workingHours: string
  status: AgentStatus
  dateOnboarded: string
  performanceScore: number
  qualityScore: number
  complianceScore: number
  humanOverrideRatePct: number
  tokenConsumption: number
  cost: Tagged<number>
  valueGenerated: Tagged<number>
  nextPerformanceReview: string
  harnessId?: ID
}

// ─────────────────────────── Processes & Quality Procedures ───────────────────────────

export interface Process {
  id: ID
  name: string
  divisionId: ID
  ownerSectionId: ID
  currentAgenticity: AgenticityLevel
  targetAgenticity: AgenticityLevel
  readinessScore: number
  riskScore: number
  estimatedBenefit: Tagged<number>
}

export interface ProcessStep {
  id: ID
  processId: ID
  order: number
  name: string
  currentOwner: 'Human' | 'Agent' | 'Human+Agent'
  futureOwner: 'Human' | 'Agent' | 'Human+Agent'
  humanContributionPct: number
  agentContributionPct: number
  automationLevel: AgenticityLevel
  controlRequirement: QpIndicator
  avgProcessingTimeMins: number
  slaMins: number
  qualityScore: number
  exceptionRatePct: number
  assignedAgentId?: ID
  assignedHarnessId?: ID
  valueOpportunity: Tagged<number>
}

export type QpStatus = 'Draft' | 'Active' | 'UnderReview' | 'Expired' | 'Retired'

export interface QualityProcedure {
  id: ID
  title: string
  sectionOwnerId: ID
  version: string
  effectiveDate: string
  reviewDate: string
  status: QpStatus
  relatedProcessId: ID
  activities: string[]
  responsibleRoles: string[]
  inputs: string[]
  outputs: string[]
  businessRules: string[]
  controls: string[]
  evidence: string[]
  approvals: string[]
  exceptionRules: string[]
  slaHours: number
  kpi: string
  assignedAgentIds: ID[]
  harnessId?: ID
  currentAiCoveragePct: number
  targetAiCoveragePct: number
  indicator: QpIndicator
  agentConversion: {
    agentInstructions: string[]
    workflowSteps: string[]
    guardrails: string[]
    evaluationCriteria: string[]
    auditEvidence: string[]
  }
}

// ─────────────────────────── AI Initiatives ───────────────────────────

export type InitiativeStage = 'Idea' | 'Assessment' | 'D2DIntake' | 'Shaping' | 'Estimation' | 'Build' | 'Evaluation' | 'Probation' | 'Production' | 'Scaling' | 'Retired'
export const INITIATIVE_STAGE_ORDER: InitiativeStage[] = ['Idea', 'Assessment', 'D2DIntake', 'Shaping', 'Estimation', 'Build', 'Evaluation', 'Probation', 'Production', 'Scaling', 'Retired']

export interface AIInitiative {
  id: ID
  title: string
  divisionId: ID
  sectionId: ID
  strategicObjectiveId: ID
  excellenceCriterionId: ID
  relatedProcessId?: ID
  relatedQpId?: ID
  d2dDemandId?: ID
  businessOwnerId: ID
  itOwnerId: ID
  agentOwnerId?: ID
  status: 'OnTrack' | 'AtRisk' | 'Delayed' | 'Blocked' | 'Complete'
  stage: InitiativeStage
  aiType: 'Copilot' | 'TaskAgent' | 'AutonomousAgent'
  agenticityTarget: AgenticityLevel
  expectedValue: Tagged<number>
  realizedValue: Tagged<number>
  totalCost: number
  tokenBudget: number
  riskLevel: 'Low' | 'Medium' | 'High'
  dataReadiness: number
  harnessReadiness: number
  goLiveDate?: string
}

// ─────────────────────────── Harness Engineering ───────────────────────────

export type HarnessBlockType =
  | 'Trigger' | 'ContextRetrieval' | 'Validation' | 'Reasoning' | 'ToolCall'
  | 'OutputGeneration' | 'QualityEvaluation' | 'HumanApproval' | 'CommitToSystem'
  | 'LogOutcome' | 'ValueUpdate'
export const HARNESS_FLOW: { type: HarnessBlockType; label: string }[] = [
  { type: 'Trigger', label: 'Trigger' },
  { type: 'ContextRetrieval', label: 'Context retrieval' },
  { type: 'Validation', label: 'Validation' },
  { type: 'Reasoning', label: 'Reasoning' },
  { type: 'ToolCall', label: 'Tool call' },
  { type: 'OutputGeneration', label: 'Output generation' },
  { type: 'QualityEvaluation', label: 'Quality evaluation' },
  { type: 'HumanApproval', label: 'Human approval' },
  { type: 'CommitToSystem', label: 'Commit to system' },
  { type: 'LogOutcome', label: 'Log outcome' },
  { type: 'ValueUpdate', label: 'Value update' },
]

export interface HarnessBlock {
  type: HarnessBlockType
  order: number
  config: Record<string, string | string[]>
}

export type HarnessEvalCriterion =
  | 'Completeness' | 'Accuracy' | 'Traceability' | 'TemplateCompliance'
  | 'StakeholderRelevance' | 'ArchitectureCompliance' | 'SecurityCompliance'
  | 'HallucinationCheck' | 'HumanAcceptance'
export interface HarnessEvaluationResult {
  criterion: HarnessEvalCriterion
  scorePct: number
}

export type HarnessStatus = 'Development' | 'TechnicalTesting' | 'BusinessEvaluation' | 'RiskReview' | 'Probation' | 'Production' | 'ScaleApproved'
export const HARNESS_DEPLOYMENT_GATES: HarnessStatus[] = ['Development', 'TechnicalTesting', 'BusinessEvaluation', 'RiskReview', 'Probation', 'Production', 'ScaleApproved']

export interface Harness {
  id: ID
  name: string
  assignedAgentId: ID
  assignedProcessId: ID
  version: string
  status: HarnessStatus
  businessOwnerId: ID
  technicalOwnerId: ID
  systemInstructions: string
  businessInstructions: string
  approvedKnowledgeSources: string[]
  toolsAndApis: string[]
  workflowStages: HarnessBlock[]
  humanApprovalPoints: string[]
  guardrails: string[]
  validationRules: string[]
  evaluationSuite: HarnessEvaluationResult[]
  confidenceThreshold: number
  retryLimits: number
  escalationRules: string[]
  tokenLimit: number
  modelRoutingPolicy: string
  loggingPolicy: string
  killSwitchEnabled: boolean
  releaseHistory: { version: string; date: string; notes: string }[]
}

// ─────────────────────────── D2D ───────────────────────────

export type D2DStage =
  | 'BusinessNeed' | 'AIOpportunityIdentified' | 'DemandCreated' | 'AIAssistedShaping'
  | 'SolutionRecommendation' | 'HarnessDesign' | 'Build' | 'Evaluation' | 'GoLive'
  | 'PerformanceMonitoring' | 'VRValidation' | 'PlaybookUpdate'
export const D2D_STAGE_ORDER: { stage: D2DStage; label: string }[] = [
  { stage: 'BusinessNeed', label: 'Business need' },
  { stage: 'AIOpportunityIdentified', label: 'AI opportunity identified' },
  { stage: 'DemandCreated', label: 'D2D demand created' },
  { stage: 'AIAssistedShaping', label: 'AI-assisted shaping' },
  { stage: 'SolutionRecommendation', label: 'Solution recommendation' },
  { stage: 'HarnessDesign', label: 'Harness design' },
  { stage: 'Build', label: 'Build' },
  { stage: 'Evaluation', label: 'Evaluation' },
  { stage: 'GoLive', label: 'Go-live' },
  { stage: 'PerformanceMonitoring', label: 'Performance monitoring' },
  { stage: 'VRValidation', label: 'VR validation' },
  { stage: 'PlaybookUpdate', label: 'Playbook update' },
]

export interface D2DContributionEvent {
  timestamp: string
  actor: 'Human' | 'Copilot' | 'Agent' | 'HumanApproval'
  activity: string
}

export interface D2DDemand {
  id: ID
  title: string
  divisionId: ID
  submitterEmployeeId: ID
  processId: ID
  qpId?: ID
  strategicObjectiveId: ID
  aiOpportunity: string
  agentProposedId?: ID
  harnessProposedId?: ID
  stage: D2DStage
  slaDays: number
  brdStatus: 'NotStarted' | 'Drafted' | 'UnderReview' | 'Approved'
  duplicateFindings: string[]
  stakeholders: string[]
  architectureAssessment: string
  securityAssessment: string
  estimatedValue: Tagged<number>
  tokenBudget: number
  milestones: { name: string; date: string; done: boolean }[]
  goLiveStatus: 'NotLive' | 'Live'
  vrStatus: string
  contributionTimeline: D2DContributionEvent[]
}

// ─────────────────────────── Copilot & Work Contribution ───────────────────────────

export interface CopilotUsageRecord {
  id: ID
  divisionId: ID
  period: string
  eligibleUsers: number
  licensedUsers: number
  activeUsers: number
  activeDays: number
  applicationUsage: Record<string, number>
  copilotSupportedActivities: string[]
  agentUsageCount: number
  adoptionByDivisionPct: number
  adoptionByRolePct: Record<string, number>
  licenseUtilizationPct: number
}

export interface WorkContributionRecord {
  id: ID
  employeeId: ID
  positionId: ID
  sectionId: ID
  processId: ID
  activity: string
  workItem: string
  toolOrAgent: string
  baselineHours: number
  actualHumanHours: number
  aiContributionPct: number
  humanContributionPct: number
  outputAccepted: number
  outputEdited: number
  outputRejected: number
  qualityResult: 'Pass' | 'Fail' | 'PartialPass'
  verifiedTimeReleasedHours: Tagged<number>
  businessOutcome: string
  tokenCost: number
}

// ─────────────────────────── Performance ───────────────────────────

export interface AgentPerformanceIndex {
  businessOutcome: number
  quality: number
  productivity: number
  reliability: number
  humanCollaboration: number
  costEfficiency: number
  complianceAndSafety: number
  weightedScore: number
}

export type AgentPerformanceResult = 'ExceedsExpectations' | 'MeetsExpectations' | 'NeedsOptimization' | 'Restricted' | 'Suspended' | 'Retired'

export interface AgentPerformanceRecord {
  id: ID
  agentId: ID
  period: string
  successfulCompletionRatePct: number
  accuracyPct: number
  firstTimeRightPct: number
  qualityScore: number
  slaCompliancePct: number
  reliabilityPct: number
  humanOverrideRatePct: number
  exceptionRatePct: number
  escalationRatePct: number
  costPerSuccessfulOutcome: number
  tokenEfficiency: number
  complianceScore: number
  valueGenerated: Tagged<number>
  index: AgentPerformanceIndex
  result: AgentPerformanceResult
}

export interface HumanAiPerformanceRecord {
  id: ID
  employeeId: ID
  period: string
  aiEnabledOutputQuality: number
  effectiveCopilotAgentUse: number
  capacityReleasedHours: number
  capacityRedeployedHours: number
  agentSupervisionEffectiveness: number
  exceptionHandlingScore: number
  processImprovementContributions: number
  knowledgeContributionScore: number
  businessOutcomesScore: number
  responsibleAiCompliance: 'Compliant' | 'NonCompliant' | 'UnderReview'
}

// ─────────────────────────── Value Realization ───────────────────────────

export type VrStage = 'Draft' | 'BusinessValidation' | 'FinanceValidation' | 'BPIValidation' | 'PMOValidation' | 'Approved' | 'PostGoLiveTracking' | 'Realized' | 'Closed'
export const VR_STAGE_ORDER: VrStage[] = ['Draft', 'BusinessValidation', 'FinanceValidation', 'BPIValidation', 'PMOValidation', 'Approved', 'PostGoLiveTracking', 'Realized', 'Closed']

export type BenefitCategory = 'CostAvoidance' | 'Productivity' | 'RevenueProtection' | 'RevenueGeneration' | 'CycleTimeReduction' | 'Quality' | 'Compliance' | 'RiskReduction' | 'CustomerExperience' | 'EmployeeExperience' | 'Sustainability' | 'StrategicCapability'
export type CostCategory = 'ModelAndTokenCost' | 'SoftwareLicenses' | 'Infrastructure' | 'Integration' | 'Development' | 'DataPreparation' | 'Testing' | 'Security' | 'ChangeManagement' | 'HumanSupervision' | 'SupportAndMaintenance'

export interface VRRecord {
  id: ID
  aiInitiativeId: ID
  d2dDemandId?: ID
  agentId?: ID
  harnessId?: ID
  businessOwnerId: ID
  benefitOwnerId: ID
  financeValidatorId: ID
  bpiValidatorId: ID
  pmoValidatorId: ID
  baselinePeriod: string
  baselineValue: number
  target: number
  actualResult: number
  benefitType: BenefitCategory
  measurementMethod: string
  evidence: string[]
  grossBenefit: number
  aiCost: { category: CostCategory; amount: number }[]
  netBenefit: number
  benefitRealizationPct: number
  validationStatus: VrStage
  reviewPeriod: string
}

// ─────────────────────────── Token Economics & Observability ───────────────────────────

export type TokenLevel = 'Enterprise' | 'Division' | 'Department' | 'Process' | 'Agent' | 'Harness' | 'Skill' | 'Model' | 'Transaction'

export interface TokenUsageRecord {
  id: ID
  level: TokenLevel
  parentId?: ID
  refId: ID
  refLabel: string
  period: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningUnits: number
  retrievalCalls: number
  toolCalls: number
  retries: number
  latencyMs: number
  model: string
  outcome: 'Success' | 'Failure' | 'Partial'
  humanIntervention: boolean
  cost: number
  value: Tagged<number>
}

export interface BudgetControl {
  agentId: ID
  annualBudget: number
  monthlyBudget: number
  perTransactionLimit: number
  retryLimit: number
  approvedModels: string[]
  alertLevelPct: number
  suspensionThresholdPct: number
}

export interface AgentRunEvent {
  id: ID
  agentId: ID
  harnessId: ID
  traceId: ID
  timestamp: string
  step: HarnessBlockType
  status: 'Success' | 'Failure' | 'Retry' | 'Escalated'
  latencyMs: number
  details: string
}

export interface Trace {
  id: ID
  demandId?: ID
  agentId: ID
  steps: AgentRunEvent[]
  outcome: 'Success' | 'Failure' | 'HumanOverride'
}

export interface Incident {
  id: ID
  title: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  agentId?: ID
  openedAt: string
  status: 'Open' | 'Investigating' | 'Resolved'
}

export interface AlertRule {
  id: ID
  name: string
  metric: string
  threshold: number
  comparator: '>' | '<' | '>=' | '<='
  severity: 'Warning' | 'Critical'
}

// ─────────────────────────── Strategy ───────────────────────────

export interface StrategicObjective {
  id: ID
  name: string
  description: string
  excellenceCriterionIds: ID[]
}

export interface ExcellenceCriterion {
  id: ID
  name: string
  strategicObjectiveId: ID
}

export interface AIRoom {
  id: ID
  name: string
  sponsorId: ID
  strategicGoals: string[]
  priorityProcessIds: ID[]
  activeInitiativeIds: ID[]
  agentIds: ID[]
  harnessIds: ID[]
  value: Tagged<number>
  risks: string[]
  playbookMaturity: 'Emerging' | 'Developing' | 'Mature' | 'Optimizing'
  nextActions: string[]
}

// ─────────────────────────── The full dataset shape ───────────────────────────

export interface Dataset {
  orgNodes: OrgNode[]
  jobDescriptions: JobDescription[]
  positions: Position[]
  employees: Employee[]
  agents: Agent[]
  processes: Process[]
  processSteps: ProcessStep[]
  qualityProcedures: QualityProcedure[]
  aiInitiatives: AIInitiative[]
  harnesses: Harness[]
  d2dDemands: D2DDemand[]
  copilotUsage: CopilotUsageRecord[]
  workContribution: WorkContributionRecord[]
  agentPerformance: AgentPerformanceRecord[]
  humanPerformance: HumanAiPerformanceRecord[]
  vrRecords: VRRecord[]
  tokenUsage: TokenUsageRecord[]
  budgetControls: BudgetControl[]
  agentRuns: AgentRunEvent[]
  traces: Trace[]
  incidents: Incident[]
  alertRules: AlertRule[]
  strategicObjectives: StrategicObjective[]
  excellenceCriteria: ExcellenceCriterion[]
  aiRooms: AIRoom[]
}
