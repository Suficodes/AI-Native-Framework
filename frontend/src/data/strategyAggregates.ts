// Strategic Alignment aggregates (requirements doc Section 17) — the strategy
// map, the seven required breakdowns, and the eight AI Rooms.
//
// The strategy map is built as ONE graph of typed nodes and edges following the
// doc's chain (Strategic Objective → Excellence Criterion → Division → Process
// → AI Initiative → Agent → Outcome → Value); the page lays it out and the
// filters narrow it, but no view constructs its own separate dataset.
import { dataset } from './mockApi'
import { AGENTICITY_ORDER } from './types'
import type { AIRoom, ExcellenceCriterion, ID, StrategicObjective } from './types'

const round1 = (n: number) => Math.round(n * 10) / 10
const agenticityIndex = (level: string) => AGENTICITY_ORDER.indexOf(level as (typeof AGENTICITY_ORDER)[number])

// ─────────────────────────── The strategy map graph ───────────────────────────

export type StrategyNodeKind =
  | 'objective' | 'criterion' | 'division' | 'process' | 'initiative' | 'agent' | 'outcome'

export interface StrategyNode {
  id: string
  kind: StrategyNodeKind
  label: string
  sublabel?: string
  /** Route to drill into the real record behind the node, where one exists. */
  href?: string
  value?: number
}

export interface StrategyEdge {
  id: string
  source: string
  target: string
}

export interface StrategyGraph {
  nodes: StrategyNode[]
  edges: StrategyEdge[]
}

/**
 * Build the strategy map, optionally narrowed to one strategic objective.
 * Every edge is a real foreign key — nothing is drawn that the data does not
 * already assert.
 */
export function strategyGraph(objectiveId?: ID): StrategyGraph {
  const nodes: StrategyNode[] = []
  const edges: StrategyEdge[] = []
  const seen = new Set<string>()

  const addNode = (node: StrategyNode) => {
    if (seen.has(node.id)) return
    seen.add(node.id)
    nodes.push(node)
  }
  const addEdge = (source: string, target: string) => {
    const id = `${source}->${target}`
    if (edges.some((e) => e.id === id)) return
    edges.push({ id, source, target })
  }

  const objectives = dataset.strategicObjectives.filter((o) => !objectiveId || o.id === objectiveId)

  for (const objective of objectives) {
    const objectiveNodeId = `so:${objective.id}`
    addNode({ id: objectiveNodeId, kind: 'objective', label: objective.name, sublabel: 'Strategic objective' })

    const criteria = dataset.excellenceCriteria.filter((c) => c.strategicObjectiveId === objective.id)
    const initiatives = dataset.aiInitiatives.filter((i) => i.strategicObjectiveId === objective.id)

    for (const criterion of criteria) {
      const criterionNodeId = `ec:${criterion.id}`
      addNode({
        id: criterionNodeId, kind: 'criterion', label: criterion.name,
        sublabel: `${criterion.currentScore}${criterion.unit === '%' ? '%' : ` ${criterion.unit}`} → ${criterion.targetScore}`,
      })
      addEdge(objectiveNodeId, criterionNodeId)
    }

    // Divisions reached through the objective's initiatives; each criterion
    // feeds the divisions that carry work for it.
    const divisionIds = [...new Set(initiatives.map((i) => i.divisionId))]
    for (const divisionId of divisionIds) {
      const division = dataset.orgNodes.find((n) => n.id === divisionId)
      if (!division) continue
      const divisionNodeId = `div:${division.id}`
      addNode({ id: divisionNodeId, kind: 'division', label: division.name.replace(' Division', ''), sublabel: 'Division' })
      for (const criterion of criteria) addEdge(`ec:${criterion.id}`, divisionNodeId)
    }

    for (const initiative of initiatives) {
      const process = dataset.processes.find((p) => p.id === initiative.relatedProcessId)
      const initiativeNodeId = `init:${initiative.id}`
      let upstream = `div:${initiative.divisionId}`

      if (process) {
        const processNodeId = `proc:${process.id}`
        addNode({
          id: processNodeId, kind: 'process', label: process.name,
          sublabel: `${process.currentAgenticity} → ${process.targetAgenticity}`,
          href: `/processes/agenticity/${process.id}`,
        })
        if (seen.has(upstream)) addEdge(upstream, processNodeId)
        upstream = processNodeId
      }

      addNode({
        id: initiativeNodeId, kind: 'initiative', label: initiative.title,
        sublabel: `${initiative.stage} · ${initiative.status}`,
        href: `/ai-initiatives/${initiative.id}`,
      })
      if (seen.has(upstream)) addEdge(upstream, initiativeNodeId)

      // Agent, where one actually serves the initiative's process. Only 4 of 15
      // agents populate `assignedProcessIds`, so this unions that field with
      // real ProcessStep assignments — the same join agentsAggregates.ts uses.
      // Matching on the field alone left the whole agent layer of the map empty.
      const agent = process
        ? dataset.agents.find(
            (a) => a.assignedProcessIds.includes(process.id)
              || dataset.processSteps.some((s) => s.processId === process.id && s.assignedAgentId === a.id),
          )
        : dataset.agents.find((a) => a.id === initiative.agentOwnerId)
      let valueUpstream = initiativeNodeId
      if (agent) {
        const agentNodeId = `agent:${agent.id}`
        addNode({
          id: agentNodeId, kind: 'agent', label: agent.name, sublabel: agent.digitalJobTitle,
          href: `/agents/${agent.id}`,
        })
        addEdge(initiativeNodeId, agentNodeId)
        valueUpstream = agentNodeId
      }

      // Outcome node carries the validated value, closing the doc's chain.
      const vr = dataset.vrRecords.find((v) => v.aiInitiativeId === initiative.id)
      if (vr) {
        const outcomeNodeId = `vr:${vr.id}`
        addNode({
          id: outcomeNodeId, kind: 'outcome', label: `${vr.id} — net benefit`,
          sublabel: vr.validationStatus, value: vr.netBenefit,
          href: `/value-realization/${vr.id}`,
        })
        addEdge(valueUpstream, outcomeNodeId)
      }
    }
  }

  return { nodes, edges }
}

// ─────────────────────────── The seven Section 17 breakdowns ───────────────────────────

export interface ObjectiveRollup {
  objectiveId: ID
  objective: string
  description: string
  initiatives: number
  activeInitiatives: number
  atRiskInitiatives: number
  expectedValue: number
  realizedValue: number
  agenticityContribution: number
  excellenceImprovementPct: number
  highRiskInitiatives: number
}

/** One row per strategic objective, carrying every measure the section needs. */
export function objectiveRollups(): ObjectiveRollup[] {
  return dataset.strategicObjectives.map((objective) => {
    const initiatives = dataset.aiInitiatives.filter((i) => i.strategicObjectiveId === objective.id)
    const initiativeIds = new Set(initiatives.map((i) => i.id))
    const vrRecords = dataset.vrRecords.filter((v) => initiativeIds.has(v.aiInitiativeId))
    const processes = dataset.processes.filter(
      (p) => initiatives.some((i) => i.relatedProcessId === p.id),
    )
    const criteria = dataset.excellenceCriteria.filter((c) => c.strategicObjectiveId === objective.id)

    return {
      objectiveId: objective.id,
      objective: objective.name,
      description: objective.description,
      initiatives: initiatives.length,
      activeInitiatives: initiatives.filter((i) => ['Build', 'Evaluation', 'Probation', 'Production', 'Scaling'].includes(i.stage)).length,
      atRiskInitiatives: initiatives.filter((i) => i.status === 'AtRisk' || i.status === 'Delayed' || i.status === 'Blocked').length,
      expectedValue: initiatives.reduce((s, i) => s + i.expectedValue.value, 0),
      realizedValue: vrRecords.reduce((s, v) => s + v.netBenefit, 0),
      // How much agenticity the objective's processes have gained so far,
      // as a share of the total climb they committed to.
      agenticityContribution: agenticityProgressPct(processes),
      excellenceImprovementPct: round1(
        criteria.length === 0 ? 0 : criteria.reduce((s, c) => s + criterionProgressPct(c), 0) / criteria.length,
      ),
      highRiskInitiatives: initiatives.filter((i) => i.riskLevel === 'High').length,
    }
  })
}

/** Progress from current agenticity toward target, averaged over a process set. */
function agenticityProgressPct(processes: { currentAgenticity: string; targetAgenticity: string }[]): number {
  if (processes.length === 0) return 0
  const progress = processes.map((p) => {
    const current = agenticityIndex(p.currentAgenticity)
    const target = agenticityIndex(p.targetAgenticity)
    if (target <= 0) return 100
    return Math.min(100, (current / target) * 100)
  })
  return round1(progress.reduce((s, n) => s + n, 0) / progress.length)
}

/**
 * How far a criterion has moved from its baseline toward its target, as a
 * percentage. Direction-aware: revenue leakage improving means going *down*.
 */
export function criterionProgressPct(criterion: ExcellenceCriterion): number {
  const span = criterion.targetScore - criterion.baselineScore
  if (span === 0) return 100
  const moved = criterion.currentScore - criterion.baselineScore
  return round1(Math.max(0, Math.min(100, (moved / span) * 100)))
}

export interface CriterionRow extends ExcellenceCriterion {
  objectiveName: string
  progressPct: number
  direction: 'improving' | 'flat' | 'worsening'
}

export function criterionRows(): CriterionRow[] {
  return dataset.excellenceCriteria.map((criterion) => {
    const moved = criterion.currentScore - criterion.baselineScore
    const improving = criterion.higherIsBetter ? moved > 0 : moved < 0
    return {
      ...criterion,
      objectiveName: dataset.strategicObjectives.find((o) => o.id === criterion.strategicObjectiveId)?.name ?? '—',
      progressPct: criterionProgressPct(criterion),
      direction: moved === 0 ? 'flat' : improving ? 'improving' : 'worsening',
    }
  })
}

/** Delivery status across every initiative that carries a strategic objective. */
export function deliveryStatusByObjective() {
  return dataset.strategicObjectives.map((objective) => {
    const initiatives = dataset.aiInitiatives.filter((i) => i.strategicObjectiveId === objective.id)
    const count = (status: string) => initiatives.filter((i) => i.status === status).length
    return {
      objective: objective.name,
      OnTrack: count('OnTrack'),
      AtRisk: count('AtRisk'),
      Delayed: count('Delayed'),
      Blocked: count('Blocked'),
      Complete: count('Complete'),
    }
  })
}

/** Initiative risk profile per objective. */
export function riskByObjective() {
  return dataset.strategicObjectives.map((objective) => {
    const initiatives = dataset.aiInitiatives.filter((i) => i.strategicObjectiveId === objective.id)
    const count = (level: string) => initiatives.filter((i) => i.riskLevel === level).length
    return { objective: objective.name, Low: count('Low'), Medium: count('Medium'), High: count('High') }
  })
}

// ─────────────────────────── AI Rooms ───────────────────────────

export interface AIRoomRow extends AIRoom {
  sponsorName: string
  processNames: string[]
  initiativeTitles: { id: ID; title: string }[]
  agentNames: { id: ID; name: string }[]
  harnessNames: { id: ID; name: string }[]
  realizedValue: number
  openIncidents: number
}

export function aiRoomRows(): AIRoomRow[] {
  return dataset.aiRooms.map((room) => {
    const initiativeIds = new Set(room.activeInitiativeIds)
    return {
      ...room,
      sponsorName: dataset.employees.find((e) => e.id === room.sponsorId)?.name ?? room.sponsorId,
      processNames: room.priorityProcessIds.map(
        (id) => dataset.processes.find((p) => p.id === id)?.name ?? id,
      ),
      initiativeTitles: room.activeInitiativeIds.map((id) => ({
        id, title: dataset.aiInitiatives.find((i) => i.id === id)?.title ?? id,
      })),
      agentNames: room.agentIds.map((id) => ({
        id, name: dataset.agents.find((a) => a.id === id)?.name ?? id,
      })),
      harnessNames: room.harnessIds.map((id) => ({
        id, name: dataset.harnesses.find((h) => h.id === id)?.name ?? id,
      })),
      // Realized value is derived from the room's initiatives rather than read
      // from the room's own headline figure, so the two cannot drift apart.
      realizedValue: dataset.vrRecords
        .filter((v) => initiativeIds.has(v.aiInitiativeId))
        .reduce((s, v) => s + v.netBenefit, 0),
      openIncidents: dataset.incidents.filter(
        (i) => i.agentId != null && room.agentIds.includes(i.agentId) && i.status !== 'Resolved',
      ).length,
    }
  })
}

export function aiRoomById(roomId: ID): AIRoomRow | undefined {
  return aiRoomRows().find((r) => r.id === roomId)
}

export function objectiveById(objectiveId: ID): StrategicObjective | undefined {
  return dataset.strategicObjectives.find((o) => o.id === objectiveId)
}
