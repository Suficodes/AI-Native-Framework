// Mock API — the requirements doc's Section 22 names these exact functions
// (getOrganization, getEmployees, getAgents, getProcesses,
// getQualityProcedures, getD2DDemands, getCopilotUsage, getAgentRuns,
// getTokenUsage, getValueRealization, getStrategicObjectives) plus the rest
// of the entity surface. Every call goes through mockDelay() so components
// genuinely exercise loading states, not just static renders (UX section).
//
// This is the ONLY module that should be imported by pages/components for
// data access — never import data/seed/* or data/dataset.ts directly.
import { buildDataset } from './dataset'
import { ROLES, type Role } from './roles'
import type {
  OrgNode, Position, JobDescription, Employee, Agent, Process, ProcessStep,
  QualityProcedure, AIInitiative, Harness, D2DDemand, CopilotUsageRecord,
  WorkContributionRecord, AgentPerformanceRecord, HumanAiPerformanceRecord,
  VRRecord, TokenUsageRecord, BudgetControl, AgentRunEvent, Trace, Incident,
  AlertRule, StrategicObjective, ExcellenceCriterion, AIRoom,
} from './types'

const DATASET = buildDataset()

function mockDelay<T>(value: T, ms = 150 + Math.random() * 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export const getOrganization = () => mockDelay(DATASET.orgNodes)
export const getPositions = () => mockDelay(DATASET.positions)
export const getJobDescriptions = () => mockDelay(DATASET.jobDescriptions)
export const getEmployees = () => mockDelay(DATASET.employees)
export const getAgents = () => mockDelay(DATASET.agents)
export const getProcesses = () => mockDelay(DATASET.processes)
export const getProcessSteps = () => mockDelay(DATASET.processSteps)
export const getQualityProcedures = () => mockDelay(DATASET.qualityProcedures)
export const getAIInitiatives = () => mockDelay(DATASET.aiInitiatives)
export const getHarnesses = () => mockDelay(DATASET.harnesses)
export const getD2DDemands = () => mockDelay(DATASET.d2dDemands)
export const getCopilotUsage = () => mockDelay(DATASET.copilotUsage)
export const getWorkContribution = () => mockDelay(DATASET.workContribution)
export const getAgentPerformance = () => mockDelay(DATASET.agentPerformance)
export const getHumanPerformance = () => mockDelay(DATASET.humanPerformance)
export const getValueRealization = () => mockDelay(DATASET.vrRecords)
export const getTokenUsage = () => mockDelay(DATASET.tokenUsage)
export const getBudgetControls = () => mockDelay(DATASET.budgetControls)
export const getAgentRuns = () => mockDelay(DATASET.agentRuns)
export const getTraces = () => mockDelay(DATASET.traces)
export const getIncidents = () => mockDelay(DATASET.incidents)
export const getAlertRules = () => mockDelay(DATASET.alertRules)
export const getStrategicObjectives = () => mockDelay(DATASET.strategicObjectives)
export const getExcellenceCriteria = () => mockDelay(DATASET.excellenceCriteria)
export const getAIRooms = () => mockDelay(DATASET.aiRooms)
export const getRoles = () => mockDelay(ROLES)

// Synchronous accessor — for code that already has data loaded (e.g. cross-
// referencing within a page that awaited the async getters above) and needs
// a synchronous lookup without another render-triggering fetch.
export const dataset = DATASET

export type {
  OrgNode, Position, JobDescription, Employee, Agent, Process, ProcessStep,
  QualityProcedure, AIInitiative, Harness, D2DDemand, CopilotUsageRecord,
  WorkContributionRecord, AgentPerformanceRecord, HumanAiPerformanceRecord,
  VRRecord, TokenUsageRecord, BudgetControl, AgentRunEvent, Trace, Incident,
  AlertRule, StrategicObjective, ExcellenceCriterion, AIRoom, Role,
}
