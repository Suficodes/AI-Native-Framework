// The AI-Native Enterprise Map's ONE shared graph (requirements doc Section 18).
//
// This module builds a single typed graph covering the doc's full primary
// hierarchy — Strategic Objectives → Excellence Criteria → Divisions → Super
// Departments → Departments → Sections → Positions → Humans and Agents →
// Activities → Quality Procedures → Processes → AI Initiatives → Agents →
// Harnesses → Systems and Data → Operational Outcomes → Value Realization →
// Token and Total Cost.
//
// CONVENTIONS.md's single most important architectural rule: the ten lenses are
// pure functions over THIS graph (see enterpriseMapLenses.ts). No lens builds
// its own dataset. Adding an eleventh lens must not require touching this file.
//
// Over the 200-line module cap by design: it has exactly one responsibility
// (turn the dataset into the map graph) and splitting it would scatter one
// coherent traversal of the enterprise across several files.
import { dataset } from './mockApi'
import { headcountRollup } from './organizationAggregates'
import { AGENTICITY_ORDER } from './types'
import type { ID } from './types'

export type MapNodeKind =
  | 'enterprise' | 'objective' | 'criterion' | 'division' | 'superDepartment'
  | 'department' | 'section' | 'position' | 'employee' | 'agent' | 'activity'
  | 'process' | 'qualityProcedure' | 'initiative' | 'harness' | 'system'
  | 'outcome' | 'value' | 'cost'

export type MapEdgeKind =
  | 'contains' | 'contributes' | 'governs' | 'executes' | 'supervises'
  | 'delivers' | 'controls' | 'value' | 'token' | 'depends' | 'staffs'

/** Metrics every lens reads from. Absent means "not applicable to this node kind". */
export interface MapMetrics {
  value?: number
  cost?: number
  tokens?: number
  riskScore?: number
  agenticityCurrent?: number
  agenticityTarget?: number
  performance?: number
  compliance?: number
  headcountHuman?: number
  headcountAgent?: number
  aiCoveragePct?: number
}

export interface MapNode {
  id: string
  kind: MapNodeKind
  label: string
  sublabel?: string
  /** Containment parent — drives progressive disclosure (expand/collapse). */
  parentId?: string
  /** Route into the real record, where the app has a page for it. */
  href?: string
  metrics: MapMetrics
  /** Filter membership, e.g. 'agent-supported', 'high-risk', 'expired-qp'. */
  tags: string[]
}

export interface MapEdge {
  id: string
  source: string
  target: string
  kind: MapEdgeKind
}

export interface EnterpriseGraph {
  nodes: MapNode[]
  edges: MapEdge[]
}

const levelIndex = (level: string) => AGENTICITY_ORDER.indexOf(level as (typeof AGENTICITY_ORDER)[number])

// Node id namespaces keep the families distinct — the same underlying record can
// legitimately appear as more than one kind of map node (an agent has an outcome
// node and a cost node of its own).
const nid = {
  enterprise: (id: ID) => `ent:${id}`,
  objective: (id: ID) => `so:${id}`,
  criterion: (id: ID) => `ec:${id}`,
  org: (id: ID) => `org:${id}`,
  position: (id: ID) => `pos:${id}`,
  employee: (id: ID) => `emp:${id}`,
  agent: (id: ID) => `agt:${id}`,
  activity: (positionId: ID, name: string) => `act:${positionId}:${name}`,
  process: (id: ID) => `proc:${id}`,
  qp: (id: ID) => `qp:${id}`,
  initiative: (id: ID) => `init:${id}`,
  harness: (id: ID) => `har:${id}`,
  system: (harnessId: ID, name: string) => `sys:${harnessId}:${name}`,
  outcome: (agentId: ID) => `out:${agentId}`,
  value: (vrId: ID) => `val:${vrId}`,
  cost: (agentId: ID) => `cost:${agentId}`,
}

let cached: EnterpriseGraph | null = null

export function buildEnterpriseGraph(): EnterpriseGraph {
  if (cached) return cached

  const nodes: MapNode[] = []
  const edges: MapEdge[] = []
  const nodeIds = new Set<string>()

  const add = (node: MapNode) => {
    if (nodeIds.has(node.id)) return
    nodeIds.add(node.id)
    nodes.push(node)
  }
  const link = (source: string, target: string, kind: MapEdgeKind) => {
    const id = `${kind}:${source}->${target}`
    if (source === target) return
    edges.push({ id, source, target, kind })
  }

  // ── Enterprise root ───────────────────────────────────────────────
  const enterprise = dataset.orgNodes.find((n) => n.level === 'Enterprise')
  const rootId = nid.enterprise(enterprise?.id ?? 'ENT')
  add({
    id: rootId, kind: 'enterprise', label: enterprise?.name ?? 'DEWA',
    sublabel: 'Enterprise', metrics: {}, tags: [],
  })

  // ── Strategy: objectives and their criteria ───────────────────────
  for (const objective of dataset.strategicObjectives) {
    const objectiveId = nid.objective(objective.id)
    add({
      id: objectiveId, kind: 'objective', label: objective.name, sublabel: 'Strategic objective',
      parentId: rootId, href: '/strategic-alignment', metrics: {}, tags: ['strategy'],
    })
    for (const criterion of dataset.excellenceCriteria.filter((c) => c.strategicObjectiveId === objective.id)) {
      add({
        id: nid.criterion(criterion.id), kind: 'criterion', label: criterion.name,
        sublabel: `${criterion.currentScore} → ${criterion.targetScore} ${criterion.unit}`,
        parentId: objectiveId, href: '/strategic-alignment', metrics: {}, tags: ['strategy'],
      })
    }
  }

  // ── Org tree: division → super department → department → section ──
  const orgKind: Record<string, MapNodeKind> = {
    Division: 'division', SuperDepartment: 'superDepartment', Department: 'department', Section: 'section',
  }
  for (const node of dataset.orgNodes.filter((n) => n.level !== 'Enterprise')) {
    // Roll headcount UP the tree. Employees and agents are assigned to sections,
    // so counting only direct members leaves every division and department
    // reporting zero people — reuses the Organization module's own rollup
    // rather than re-deriving it here.
    const { human: humans, agent: agents } = headcountRollup(node.id)
    // A division's parent is the Enterprise node, which lives in its own id
    // namespace — mapping it through nid.org() would produce an id nothing
    // matches, silently orphaning all four divisions from the root.
    const parentId = node.parentId === enterprise?.id || !node.parentId ? rootId : nid.org(node.parentId)
    add({
      id: nid.org(node.id), kind: orgKind[node.level] ?? 'section', label: node.name,
      // The node card already shows the kind as its eyebrow, so repeating the
      // level here would waste the only informative line the card has.
      sublabel: `${humans} people · ${agents} agent${agents === 1 ? '' : 's'}`,
      parentId,
      href: '/organization',
      metrics: { headcountHuman: humans, headcountAgent: agents },
      tags: agents > 0 ? ['agent-supported'] : [],
    })
  }

  // ── Positions, employees, activities ──────────────────────────────
  for (const position of dataset.positions) {
    const positionId = nid.position(position.id)
    add({
      id: positionId, kind: 'position', label: position.title, sublabel: position.workforceType,
      parentId: nid.org(position.sectionId), href: '/organization',
      metrics: { aiCoveragePct: position.aiWorkCoveragePct },
      tags: position.workforceType === 'Human' ? [] : ['agent-supported'],
    })

    const employee = dataset.employees.find((e) => e.id === position.assignedEmployeeId)
    if (employee) {
      add({
        id: nid.employee(employee.id), kind: 'employee', label: employee.name, sublabel: 'Human employee',
        parentId: positionId, metrics: {}, tags: employee.copilotLicensed ? ['copilot-licensed'] : [],
      })
      link(positionId, nid.employee(employee.id), 'staffs')
    }

    const jobDescription = dataset.jobDescriptions.find((j) => j.id === position.jobDescriptionId)
    for (const activity of jobDescription?.activities ?? []) {
      add({
        id: nid.activity(position.id, activity.name), kind: 'activity', label: activity.name,
        sublabel: `${activity.aiContributionPct}% AI contribution`, parentId: positionId,
        metrics: { aiCoveragePct: activity.aiContributionPct },
        tags: activity.aiContributionPct > 0 ? ['agent-supported'] : [],
      })
    }
  }

  // ── Processes (under their owning section — this is the doc's own
  //    progressive-disclosure chain: Section → Process → Agent → Value) ──
  for (const process of dataset.processes) {
    const current = levelIndex(process.currentAgenticity)
    add({
      id: nid.process(process.id), kind: 'process', label: process.name,
      sublabel: `${process.currentAgenticity} → ${process.targetAgenticity}`,
      parentId: nid.org(process.ownerSectionId), href: `/processes/agenticity/${process.id}`,
      metrics: {
        agenticityCurrent: current,
        agenticityTarget: levelIndex(process.targetAgenticity),
        riskScore: process.riskScore,
        value: process.estimatedBenefit.value,
      },
      tags: current <= 1 ? ['low-agenticity'] : [],
    })
  }

  // Process dependencies: every process a D2D demand routes into depends on the
  // D2D pipeline. This is a real link in the data, not a decorative edge.
  for (const demand of dataset.d2dDemands) {
    if (demand.processId !== 'PROC-D2D') link(nid.process('PROC-D2D'), nid.process(demand.processId), 'depends')
  }

  // ── Quality Procedures (govern a process) ─────────────────────────
  const now = new Date()
  for (const qp of dataset.qualityProcedures) {
    const expired = qp.status === 'Expired' || (new Date(qp.reviewDate) < now && qp.status !== 'Retired')
    add({
      id: nid.qp(qp.id), kind: 'qualityProcedure', label: qp.title, sublabel: `${qp.id} · ${qp.status}`,
      parentId: nid.process(qp.relatedProcessId), href: `/processes/quality-procedures/${qp.id}`,
      metrics: { aiCoveragePct: qp.currentAiCoveragePct },
      tags: expired ? ['expired-qp'] : [],
    })
    link(nid.qp(qp.id), nid.process(qp.relatedProcessId), 'governs')
    for (const agentId of qp.assignedAgentIds) link(nid.qp(qp.id), nid.agent(agentId), 'governs')
  }

  // ── AI initiatives ────────────────────────────────────────────────
  const validatedInitiatives = new Set(
    dataset.vrRecords
      .filter((v) => ['Approved', 'PostGoLiveTracking', 'Realized', 'Closed'].includes(v.validationStatus))
      .map((v) => v.aiInitiativeId),
  )
  const highValueCut = [...dataset.aiInitiatives]
    .map((i) => i.expectedValue.value)
    .sort((a, b) => b - a)[Math.floor(dataset.aiInitiatives.length / 3)] ?? 0

  for (const initiative of dataset.aiInitiatives) {
    const parent = initiative.relatedProcessId
      ? nid.process(initiative.relatedProcessId)
      : nid.org(initiative.sectionId)
    const tags = ['initiative']
    if (initiative.expectedValue.value >= highValueCut) tags.push('high-value')
    if (!validatedInitiatives.has(initiative.id)) tags.push('unvalidated-value')
    add({
      id: nid.initiative(initiative.id), kind: 'initiative', label: initiative.title,
      sublabel: `${initiative.stage} · ${initiative.status}`, parentId: parent,
      href: `/ai-initiatives/${initiative.id}`,
      metrics: { value: initiative.expectedValue.value, cost: initiative.totalCost, tokens: initiative.tokenBudget },
      tags,
    })
    link(nid.initiative(initiative.id), nid.objective(initiative.strategicObjectiveId), 'contributes')
    link(nid.initiative(initiative.id), nid.criterion(initiative.excellenceCriterionId), 'contributes')
  }

  // ── Agents (parented by their primary process where one exists, so the
  //    expansion path reads exactly as the doc's chain) ───────────────
  for (const agent of dataset.agents) {
    const primaryProcess = agent.assignedProcessIds[0]
    const performance = dataset.agentPerformance.find((p) => p.agentId === agent.id)
    const tokenRows = dataset.tokenUsage.filter((t) => t.level === 'Agent' && t.refId === agent.id)
    const tokenCost = tokenRows.reduce((s, t) => s + t.cost, 0)
    const tokens = tokenRows.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
    const highRisk = agent.status === 'Restricted' || agent.status === 'Suspended'
      || agent.humanOverrideRatePct > 25 || agent.complianceScore < 80
    const agentNodeId = nid.agent(agent.id)

    add({
      id: agentNodeId, kind: 'agent', label: agent.name, sublabel: agent.digitalJobTitle,
      parentId: primaryProcess ? nid.process(primaryProcess) : nid.org(agent.orgAssignment.sectionId),
      href: `/agents/${agent.id}`,
      metrics: {
        value: agent.valueGenerated.value, cost: tokenCost, tokens,
        performance: performance?.index.weightedScore ?? agent.performanceScore,
        compliance: agent.complianceScore,
        riskScore: agent.humanOverrideRatePct,
      },
      tags: ['agent-supported', ...(highRisk ? ['high-risk-agent'] : [])],
    })

    for (const processId of agent.assignedProcessIds) link(agentNodeId, nid.process(processId), 'executes')
    link(nid.employee(agent.managerEmployeeId), agentNodeId, 'supervises')

    // The initiative that created the agent.
    const creator = dataset.aiInitiatives.find(
      (i) => i.agentOwnerId === agent.id
        || (i.relatedProcessId != null && agent.assignedProcessIds.includes(i.relatedProcessId)),
    )
    if (creator) link(nid.initiative(creator.id), agentNodeId, 'delivers')

    // Operational outcome and token cost as their own nodes — the doc lists
    // both as levels of the hierarchy, not as attributes.
    if (performance) {
      add({
        id: nid.outcome(agent.id), kind: 'outcome', label: `${performance.result}`,
        sublabel: `Index ${performance.index.weightedScore} · ${performance.successfulCompletionRatePct}% completion`,
        parentId: agentNodeId, href: '/performance/agents',
        metrics: { performance: performance.index.weightedScore, value: performance.valueGenerated.value },
        tags: ['outcome'],
      })
    }
    if (tokenCost > 0) {
      add({
        id: nid.cost(agent.id), kind: 'cost', label: 'Token and total cost',
        sublabel: `${(tokens / 1_000_000).toFixed(1)}M tokens`, parentId: agentNodeId,
        href: '/token-economics', metrics: { cost: tokenCost, tokens }, tags: ['cost'],
      })
      link(agentNodeId, nid.cost(agent.id), 'token')
    }
  }

  // ── Harnesses and the systems/data they reach ─────────────────────
  for (const harness of dataset.harnesses) {
    const harnessNodeId = nid.harness(harness.id)
    add({
      id: harnessNodeId, kind: 'harness', label: harness.name,
      sublabel: `v${harness.version} · ${harness.status}`, parentId: nid.agent(harness.assignedAgentId),
      href: `/harness-engineering/${harness.id}`,
      metrics: {
        compliance: harness.evaluationSuite.length === 0
          ? 0
          : Math.round(harness.evaluationSuite.reduce((s, e) => s + e.scorePct, 0) / harness.evaluationSuite.length),
      },
      tags: ['harness'],
    })
    link(harnessNodeId, nid.agent(harness.assignedAgentId), 'controls')

    for (const system of [...harness.toolsAndApis, ...harness.approvedKnowledgeSources].slice(0, 6)) {
      add({
        id: nid.system(harness.id, system), kind: 'system', label: system, sublabel: 'System or data source',
        parentId: harnessNodeId, metrics: {}, tags: ['system'],
      })
    }
  }

  // ── Value Realization records ─────────────────────────────────────
  for (const vr of dataset.vrRecords) {
    const parent = dataset.aiInitiatives.some((i) => i.id === vr.aiInitiativeId)
      ? nid.initiative(vr.aiInitiativeId)
      : vr.agentId ? nid.agent(vr.agentId) : rootId
    add({
      id: nid.value(vr.id), kind: 'value', label: `${vr.id} — net benefit`,
      sublabel: `${vr.validationStatus} · ${vr.benefitRealizationPct}% realized`,
      parentId: parent, href: `/value-realization/${vr.id}`,
      metrics: { value: vr.netBenefit, cost: vr.aiCost.reduce((s, c) => s + c.amount, 0) },
      tags: ['value'],
    })
    link(nid.initiative(vr.aiInitiativeId), nid.value(vr.id), 'value')
    if (vr.agentId) link(nid.agent(vr.agentId), nid.value(vr.id), 'value')
  }

  // Every containment relationship is also an edge, so a lens that wants the
  // hierarchy drawn does not have to reconstruct it from parentId.
  for (const node of nodes) {
    if (node.parentId && nodeIds.has(node.parentId)) link(node.parentId, node.id, 'contains')
  }

  // Drop edges whose endpoints were never created (an agent with no manager
  // employee, an initiative pointing at a criterion outside the seeded set).
  const resolved = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
  const deduped = [...new Map(resolved.map((e) => [e.id, e])).values()]

  cached = { nodes, edges: deduped }
  return cached
}

/** Node lookup by id, for hover cards and the detail panel. */
export function mapNodeById(id: string): MapNode | undefined {
  return buildEnterpriseGraph().nodes.find((n) => n.id === id)
}
