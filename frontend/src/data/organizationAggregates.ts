// Derived Organization-module data. The seed layer leaves OrgNode.headcountHuman/
// headcountAgent at 0, OrgNode.strategicObjectiveIds at [], and
// Position.assignedAgentIds at [] (never backfilled — see the 2026-08-01
// Organization module design spec). Per CONVENTIONS.md ("Formulas live once...
// never hand-compute/hardcode a result a formula could produce"), this module
// derives them at read time from real foreign keys instead — mirrors the
// data/executiveAggregates.ts pattern from Step 3.
import { dataset } from './mockApi'
import type {
  ID, OrgNode, Position, Employee, Agent, Process, QualityProcedure, AIInitiative,
  AgenticityLevel, AgentPerformanceResult,
} from './types'
import { AGENTICITY_ORDER } from './types'

export interface OrgIndex {
  nodesById: Record<ID, OrgNode>
  childrenByParentId: Record<ID, ID[]>
  positionsBySectionId: Record<ID, Position[]>
  employeesBySectionId: Record<ID, Employee[]>
  agentsBySectionId: Record<ID, Agent[]>
}

let cachedIndex: OrgIndex | null = null

export function buildOrgIndex(): OrgIndex {
  if (cachedIndex) return cachedIndex
  const nodesById: Record<ID, OrgNode> = {}
  const childrenByParentId: Record<ID, ID[]> = {}
  for (const node of dataset.orgNodes) {
    nodesById[node.id] = node
    if (node.parentId) (childrenByParentId[node.parentId] ??= []).push(node.id)
  }
  const positionsBySectionId: Record<ID, Position[]> = {}
  for (const p of dataset.positions) (positionsBySectionId[p.sectionId] ??= []).push(p)
  const employeesBySectionId: Record<ID, Employee[]> = {}
  for (const e of dataset.employees) (employeesBySectionId[e.sectionId] ??= []).push(e)
  const agentsBySectionId: Record<ID, Agent[]> = {}
  for (const a of dataset.agents) (agentsBySectionId[a.orgAssignment.sectionId] ??= []).push(a)
  cachedIndex = { nodesById, childrenByParentId, positionsBySectionId, employeesBySectionId, agentsBySectionId }
  return cachedIndex
}

/** Every Section under `nodeId` (or the node itself if it already is one). Exported
 *  because data/playbookScope.ts resolves an org scope the same way — grepped for
 *  before writing a second copy (CONVENTIONS.md "convention before creation"). */
export function descendantSectionIds(nodeId: ID, index: OrgIndex = buildOrgIndex()): ID[] {
  const node = index.nodesById[nodeId]
  if (!node) return []
  if (node.level === 'Section') return [nodeId]
  return (index.childrenByParentId[nodeId] ?? []).flatMap((childId) => descendantSectionIds(childId, index))
}

export function headcountRollup(nodeId: ID): { human: number; agent: number } {
  const index = buildOrgIndex()
  let human = 0
  let agent = 0
  for (const sectionId of descendantSectionIds(nodeId, index)) {
    human += (index.employeesBySectionId[sectionId] ?? []).length
    agent += (index.agentsBySectionId[sectionId] ?? []).length
  }
  return { human, agent }
}

export function processesForSection(sectionId: ID): Process[] {
  return dataset.processes.filter((p) => p.ownerSectionId === sectionId)
}

export function qualityProceduresForSection(sectionId: ID): QualityProcedure[] {
  return dataset.qualityProcedures.filter((q) => q.sectionOwnerId === sectionId)
}

export function aiInitiativesForSection(sectionId: ID): AIInitiative[] {
  return dataset.aiInitiatives.filter((i) => i.sectionId === sectionId)
}

export function strategicObjectivesForSection(sectionId: ID): ID[] {
  const processIds = new Set(processesForSection(sectionId).map((p) => p.id))
  const objectiveIds = new Set<ID>()
  for (const initiative of dataset.aiInitiatives) {
    const linkedToSection = initiative.sectionId === sectionId
      || (initiative.relatedProcessId != null && processIds.has(initiative.relatedProcessId))
    if (linkedToSection) objectiveIds.add(initiative.strategicObjectiveId)
  }
  return [...objectiveIds]
}

export function strategicObjectivesForNode(nodeId: ID): ID[] {
  const index = buildOrgIndex()
  const objectiveIds = new Set<ID>()
  for (const sectionId of descendantSectionIds(nodeId, index)) {
    for (const id of strategicObjectivesForSection(sectionId)) objectiveIds.add(id)
  }
  return [...objectiveIds]
}

function agenticityIndex(level: AgenticityLevel): number {
  return AGENTICITY_ORDER.indexOf(level)
}

export function agenticityForSection(sectionId: ID, mode: 'current' | 'target'): AgenticityLevel | null {
  const procs = processesForSection(sectionId)
  if (procs.length === 0) return null
  const key = mode === 'current' ? 'currentAgenticity' : 'targetAgenticity'
  const avg = procs.reduce((sum, p) => sum + agenticityIndex(p[key]), 0) / procs.length
  return AGENTICITY_ORDER[Math.round(avg)]
}

export function aiCoverageForSection(sectionId: ID): number {
  const positions = buildOrgIndex().positionsBySectionId[sectionId] ?? []
  if (positions.length === 0) return 0
  return positions.reduce((sum, p) => sum + p.aiWorkCoveragePct, 0) / positions.length
}

export function realizedValueForSection(sectionId: ID): number {
  const initiativeIds = new Set(aiInitiativesForSection(sectionId).map((i) => i.id))
  return dataset.vrRecords
    .filter((v) => initiativeIds.has(v.aiInitiativeId))
    .reduce((sum, v) => sum + v.netBenefit, 0)
}

export function tokenCostForSection(sectionId: ID): number {
  const agentIds = new Set((buildOrgIndex().agentsBySectionId[sectionId] ?? []).map((a) => a.id))
  return dataset.tokenUsage
    .filter((t) => t.level === 'Agent' && agentIds.has(t.refId))
    .reduce((sum, t) => sum + t.cost, 0)
}

export function agentsForPosition(positionId: ID): Agent[] {
  return dataset.agents.filter((a) => a.orgAssignment.positionId === positionId)
}

export function performanceStatusForPosition(positionId: ID): AgentPerformanceResult | 'N/A' {
  const agents = agentsForPosition(positionId)
  if (agents.length === 0) return 'N/A'
  const record = dataset.agentPerformance.find((r) => agents.some((a) => a.id === r.agentId))
  return record?.result ?? 'N/A'
}

export function positionSummary(positionId: ID): { employeeName: string | null; agentCount: number } {
  const position = dataset.positions.find((p) => p.id === positionId)
  const employee = position?.assignedEmployeeId
    ? dataset.employees.find((e) => e.id === position.assignedEmployeeId)
    : undefined
  return { employeeName: employee?.name ?? null, agentCount: agentsForPosition(positionId).length }
}

export function relatedProcessesForPosition(positionId: ID): Process[] {
  const position = dataset.positions.find((p) => p.id === positionId)
  if (!position) return []
  const fromAgents = agentsForPosition(positionId).flatMap((a) => a.assignedProcessIds)
  const fromSection = processesForSection(position.sectionId).map((p) => p.id)
  const ids = new Set([...fromAgents, ...fromSection])
  return dataset.processes.filter((p) => ids.has(p.id))
}

export function relatedQpsForPosition(positionId: ID): QualityProcedure[] {
  const position = dataset.positions.find((p) => p.id === positionId)
  if (!position) return []
  const fromAgents = agentsForPosition(positionId).flatMap((a) => a.assignedQpIds)
  const fromSection = qualityProceduresForSection(position.sectionId).map((q) => q.id)
  const ids = new Set([...fromAgents, ...fromSection])
  return dataset.qualityProcedures.filter((q) => ids.has(q.id))
}

export function sectionManager(sectionId: ID): Employee | undefined {
  const managerPosition = (buildOrgIndex().positionsBySectionId[sectionId] ?? [])
    .find((p) => p.title.endsWith('Manager'))
  if (!managerPosition?.assignedEmployeeId) return undefined
  return dataset.employees.find((e) => e.id === managerPosition.assignedEmployeeId)
}
