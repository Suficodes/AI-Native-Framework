// Builds the full mock Dataset in strict FK-dependency order (CONVENTIONS.md
// "Data layer"): org -> positions -> employees -> agents -> processes -> QPs
// -> initiatives -> harnesses -> D2D -> copilot/work-contribution ->
// performance -> VR -> token/observability -> strategic. Every downstream
// seed file receives only already-built upstream data, so every foreign key
// resolves to a real record — no dangling references.
import { makeRng } from './rng'
import { resetIdCounters } from './ids'
import type { Dataset } from './types'

import { buildOrganization } from './seed/organization.seed'
import { buildPositions } from './seed/positions.seed'
import { buildAgents } from './seed/agents.seed'
import { buildProcesses } from './seed/processes.seed'
import { buildQualityProcedures } from './seed/qualityProcedures.seed'
import { buildStrategy, buildAIRooms } from './seed/strategy.seed'
import { buildAIInitiatives } from './seed/aiInitiatives.seed'
import { buildHarnesses } from './seed/harnesses.seed'
import { buildD2DDemands } from './seed/d2dDemands.seed'
import { buildCopilotUsage, buildWorkContribution } from './seed/workContribution.seed'
import { buildAgentPerformance, buildHumanPerformance } from './seed/performance.seed'
import { buildValueRealization } from './seed/valueRealization.seed'
import { buildTokenUsage, buildBudgetControls, buildObservability } from './seed/tokenUsage.seed'
import { buildReusableSkills, buildPlaybookLessons } from './seed/playbook.seed'

const SEED = 42

export function buildDataset(): Dataset {
  resetIdCounters()
  const rng = makeRng(SEED)

  const org = buildOrganization()
  const { positions, jobDescriptions, employees } = buildPositions(rng, org)
  const agents = buildAgents(rng, org, employees)
  const { processes, processSteps } = buildProcesses(rng, org, agents)
  const qualityProcedures = buildQualityProcedures(rng, org, processes)
  const { strategicObjectives, excellenceCriteria } = buildStrategy()
  const aiInitiatives = buildAIInitiatives(rng, org, processes, qualityProcedures, strategicObjectives, excellenceCriteria, employees)
  const harnesses = buildHarnesses(rng, agents, employees)
  const d2dDemands = buildD2DDemands(rng, org, processes, strategicObjectives, employees)
  const copilotUsage = buildCopilotUsage(rng, org)
  const workContribution = buildWorkContribution(rng, employees, processes)
  const agentPerformance = buildAgentPerformance(rng, agents)
  const humanPerformance = buildHumanPerformance(rng, employees)
  const vrRecords = buildValueRealization(rng, aiInitiatives, employees, agents, harnesses, processes)
  // Reusable skills are built before the token ledger: the ledger's "Skill"
  // level (Section 15's hierarchy) references the real skill registry rather
  // than inventing parallel skill labels.
  const reusableSkills = buildReusableSkills(rng, org.orgNodes, harnesses)
  const tokenUsage = buildTokenUsage(rng, org.orgNodes, processes, agents, harnesses, reusableSkills)
  const budgetControls = buildBudgetControls(rng, agents, tokenUsage)
  const { agentRuns, traces, incidents, alertRules } = buildObservability(rng, agents, harnesses)
  const aiRooms = buildAIRooms(rng, employees, processes, aiInitiatives, agents, harnesses)
  const playbookLessons = buildPlaybookLessons(rng, processes, org.orgNodes)

  return {
    orgNodes: org.orgNodes, jobDescriptions, positions, employees, agents,
    processes, processSteps, qualityProcedures, aiInitiatives, harnesses, d2dDemands,
    copilotUsage, workContribution, agentPerformance, humanPerformance, vrRecords,
    tokenUsage, budgetControls, agentRuns, traces, incidents, alertRules,
    strategicObjectives, excellenceCriteria, aiRooms, reusableSkills, playbookLessons,
  }
}
