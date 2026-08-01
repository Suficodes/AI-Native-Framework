// Playbook scope resolution (requirements doc Section 10: "The playbook must
// dynamically show guidance by division / department / section / job / process
// / Quality Procedure / agent / strategic objective").
//
// This is the AI Playbook's equivalent of the Enterprise Map's one-graph-many-
// lenses rule: every scope collapses to the SAME `PlaybookScope` shape — a set
// of entity IDs — and data/playbookAggregates.ts derives all 15 sections from
// that shape alone. Adding a tenth scope dimension means adding one case here,
// not a tenth screen.
//
// Over the 200-line module cap by design: this file has exactly one
// responsibility (turn a scope type + id into a PlaybookScope) and the nine
// cases share `fromSections`/`fromProcesses`/`narrow`. Splitting it would put
// those helpers behind an import boundary from their only callers.
import { dataset } from './mockApi'
import { descendantSectionIds } from './organizationAggregates'
import type { ID, PlaybookScope, PlaybookScopeType, ReusableSkill } from './types'
import { PLAYBOOK_SCOPE_LABELS } from './types'

/** True when the skill is already used by a harness inside this scope. Lives here
 *  rather than in playbookAggregates.ts so a page can ask a scope-membership
 *  question without statically importing the whole playbook builder. */
export function isSkillInScope(skill: ReusableSkill, scope: PlaybookScope): boolean {
  return skill.usedByHarnessIds.some((h) => scope.harnessIds.includes(h))
}

/** Entity picker options for a scope type, for the playbook's scope selector. */
export function playbookScopeOptions(type: PlaybookScopeType): { value: ID; label: string }[] {
  switch (type) {
    case 'enterprise':
      return dataset.orgNodes.filter((n) => n.level === 'Enterprise').map((n) => ({ value: n.id, label: n.name }))
    case 'division':
      return dataset.orgNodes.filter((n) => n.level === 'Division').map((n) => ({ value: n.id, label: n.name }))
    case 'department':
      return dataset.orgNodes.filter((n) => n.level === 'Department').map((n) => ({ value: n.id, label: n.name }))
    case 'section':
      return dataset.orgNodes.filter((n) => n.level === 'Section').map((n) => ({ value: n.id, label: n.name }))
    case 'job':
      return dataset.positions.map((p) => ({ value: p.id, label: p.title }))
    case 'process':
      return dataset.processes.map((p) => ({ value: p.id, label: p.name }))
    case 'qp':
      return dataset.qualityProcedures.map((q) => ({ value: q.id, label: `${q.id} — ${q.title}` }))
    case 'agent':
      return dataset.agents.map((a) => ({ value: a.id, label: a.name }))
    case 'objective':
      return dataset.strategicObjectives.map((o) => ({ value: o.id, label: o.name }))
  }
}

export function enterpriseScopeId(): ID {
  return dataset.orgNodes.find((n) => n.level === 'Enterprise')?.id ?? 'ENT'
}

/** The department that owns the D2D worked example — the doc's required "department playbook example". */
export function d2dExampleDepartmentId(): ID | null {
  const section = dataset.orgNodes.find((n) => n.name === 'Demand-to-Delivery Section')
  return section?.parentId ?? null
}

// ─────────────────────────── Resolution ───────────────────────────

/** Grow a section-id set into every downstream entity that hangs off those sections. */
function fromSections(sectionIds: ID[], label: string, type: PlaybookScopeType, id: ID, context: string): PlaybookScope {
  const sections = new Set(sectionIds)
  const positions = dataset.positions.filter((p) => sections.has(p.sectionId))
  const employees = dataset.employees.filter((e) => sections.has(e.sectionId))
  const agents = dataset.agents.filter((a) => sections.has(a.orgAssignment.sectionId))
  const processes = dataset.processes.filter((p) => sections.has(p.ownerSectionId))
  const processIds = new Set(processes.map((p) => p.id))
  const qps = dataset.qualityProcedures.filter((q) => sections.has(q.sectionOwnerId) || processIds.has(q.relatedProcessId))
  const initiatives = dataset.aiInitiatives.filter(
    (i) => sections.has(i.sectionId) || (i.relatedProcessId != null && processIds.has(i.relatedProcessId)),
  )
  const agentIds = new Set(agents.map((a) => a.id))
  const harnesses = dataset.harnesses.filter((h) => agentIds.has(h.assignedAgentId) || processIds.has(h.assignedProcessId))
  const demands = dataset.d2dDemands.filter((d) => processIds.has(d.processId))

  return {
    type, id, label, context,
    divisionIds: [...new Set(dataset.orgNodes.filter((n) => sections.has(n.id)).map((n) => n.divisionId).filter((d): d is ID => d != null))],
    sectionIds,
    positionIds: positions.map((p) => p.id),
    employeeIds: employees.map((e) => e.id),
    agentIds: agents.map((a) => a.id),
    processIds: processes.map((p) => p.id),
    qpIds: qps.map((q) => q.id),
    initiativeIds: initiatives.map((i) => i.id),
    harnessIds: harnesses.map((h) => h.id),
    demandIds: demands.map((d) => d.id),
    objectiveIds: [...new Set(initiatives.map((i) => i.strategicObjectiveId))],
  }
}

/** Grow a process-id set the other way: processes → their QPs, agents, harnesses, sections. */
function fromProcesses(processIds: ID[], label: string, type: PlaybookScopeType, id: ID, context: string): PlaybookScope {
  const procs = new Set(processIds)
  const processes = dataset.processes.filter((p) => procs.has(p.id))
  const qps = dataset.qualityProcedures.filter((q) => procs.has(q.relatedProcessId))
  const qpIds = new Set(qps.map((q) => q.id))
  const steps = dataset.processSteps.filter((s) => procs.has(s.processId))
  const agents = dataset.agents.filter(
    (a) => a.assignedProcessIds.some((p) => procs.has(p))
      || a.assignedQpIds.some((q) => qpIds.has(q))
      || steps.some((s) => s.assignedAgentId === a.id),
  )
  const agentIds = new Set(agents.map((a) => a.id))
  const harnesses = dataset.harnesses.filter((h) => procs.has(h.assignedProcessId) || agentIds.has(h.assignedAgentId))
  const initiatives = dataset.aiInitiatives.filter(
    (i) => (i.relatedProcessId != null && procs.has(i.relatedProcessId)) || (i.relatedQpId != null && qpIds.has(i.relatedQpId)),
  )
  const sectionIds = [...new Set([
    ...processes.map((p) => p.ownerSectionId),
    ...agents.map((a) => a.orgAssignment.sectionId),
  ])]
  const sections = new Set(sectionIds)

  // Positions linked to the processes come first; if none declare the link,
  // fall back to everyone in the owning sections so the operating-model and
  // coverage sections still have a population to describe.
  const positionsInSections = dataset.positions.filter((p) => sections.has(p.sectionId))
  const linkedPositions = positionsInSections.filter(
    (p) => p.relatedProcessIds.some((rp) => procs.has(rp)) || agents.some((a) => a.orgAssignment.positionId === p.id),
  )

  return {
    type, id, label, context,
    divisionIds: [...new Set(processes.map((p) => p.divisionId))],
    sectionIds,
    positionIds: (linkedPositions.length > 0 ? linkedPositions : positionsInSections).map((p) => p.id),
    employeeIds: dataset.employees.filter((e) => sections.has(e.sectionId)).map((e) => e.id),
    agentIds: agents.map((a) => a.id),
    processIds,
    qpIds: qps.map((q) => q.id),
    initiativeIds: initiatives.map((i) => i.id),
    harnessIds: harnesses.map((h) => h.id),
    demandIds: dataset.d2dDemands.filter((d) => procs.has(d.processId)).map((d) => d.id),
    objectiveIds: [...new Set(initiatives.map((i) => i.strategicObjectiveId))],
  }
}

/** Narrow an already-resolved scope down to one position / QP / agent, keeping the surrounding context. */
function narrow(base: PlaybookScope, overrides: Partial<PlaybookScope>): PlaybookScope {
  return { ...base, ...overrides }
}

export function resolvePlaybookScope(type: PlaybookScopeType, id: ID): PlaybookScope | null {
  const scopeLabel = PLAYBOOK_SCOPE_LABELS[type]

  if (type === 'enterprise' || type === 'division' || type === 'department' || type === 'section') {
    const node = dataset.orgNodes.find((n) => n.id === id)
    if (!node) return null
    return fromSections(descendantSectionIds(node.id), node.name, type, node.id,
      `${scopeLabel} playbook — guidance filtered to everything owned by ${node.name}.`)
  }

  if (type === 'job') {
    const position = dataset.positions.find((p) => p.id === id)
    if (!position) return null
    const base = fromSections([position.sectionId], position.title, type, position.id,
      `Job playbook — guidance for the ${position.title} role and the work it is accountable for.`)
    const agentIds = dataset.agents.filter((a) => a.orgAssignment.positionId === position.id).map((a) => a.id)
    const processIds = position.relatedProcessIds.length > 0 ? position.relatedProcessIds : base.processIds
    // Harnesses and initiatives follow the job's own agents and processes, not
    // the whole section's — a job playbook that listed every harness in the
    // section would not be a job playbook.
    const narrowedProcesses = new Set(processIds)
    const narrowedAgents = new Set(agentIds.length > 0 ? agentIds : base.agentIds)
    const harnessIds = base.harnessIds.filter((h) => {
      const harness = dataset.harnesses.find((x) => x.id === h)
      return harness != null && (narrowedAgents.has(harness.assignedAgentId) || narrowedProcesses.has(harness.assignedProcessId))
    })
    const initiativeIds = base.initiativeIds.filter((i) => {
      const initiative = dataset.aiInitiatives.find((x) => x.id === i)
      return initiative?.relatedProcessId != null && narrowedProcesses.has(initiative.relatedProcessId)
    })
    return narrow(base, {
      positionIds: [position.id],
      employeeIds: position.assignedEmployeeId ? [position.assignedEmployeeId] : [],
      agentIds: [...narrowedAgents],
      processIds,
      qpIds: position.relatedQpIds.length > 0 ? position.relatedQpIds : base.qpIds,
      harnessIds: harnessIds.length > 0 ? harnessIds : base.harnessIds,
      initiativeIds: initiativeIds.length > 0 ? initiativeIds : base.initiativeIds,
    })
  }

  if (type === 'process') {
    const process = dataset.processes.find((p) => p.id === id)
    if (!process) return null
    return fromProcesses([process.id], process.name, type, process.id,
      `Process playbook — guidance for making ${process.name} agentic, end to end.`)
  }

  if (type === 'qp') {
    const qp = dataset.qualityProcedures.find((q) => q.id === id)
    if (!qp) return null
    const base = fromProcesses([qp.relatedProcessId], qp.title, type, qp.id,
      `Quality Procedure playbook — guidance for converting ${qp.id} into governed agent execution.`)
    return narrow(base, {
      qpIds: [qp.id],
      agentIds: qp.assignedAgentIds.length > 0 ? qp.assignedAgentIds : base.agentIds,
      harnessIds: qp.harnessId ? [qp.harnessId] : base.harnessIds,
    })
  }

  if (type === 'agent') {
    const agent = dataset.agents.find((a) => a.id === id)
    if (!agent) return null
    const processIds = agent.assignedProcessIds.length > 0
      ? agent.assignedProcessIds
      : dataset.processSteps.filter((s) => s.assignedAgentId === agent.id).map((s) => s.processId)
    const base = fromProcesses([...new Set(processIds)], agent.name, type, agent.id,
      `Agent playbook — the operating, governance, and value guidance that applies to ${agent.name}.`)
    return narrow(base, {
      agentIds: [agent.id],
      harnessIds: agent.harnessId ? [agent.harnessId] : base.harnessIds,
      qpIds: agent.assignedQpIds.length > 0 ? agent.assignedQpIds : base.qpIds,
      sectionIds: [agent.orgAssignment.sectionId],
    })
  }

  // Strategic objective — resolved through the initiatives that carry it.
  const objective = dataset.strategicObjectives.find((o) => o.id === id)
  if (!objective) return null
  const initiatives = dataset.aiInitiatives.filter((i) => i.strategicObjectiveId === objective.id)
  const processIds = [...new Set(initiatives.map((i) => i.relatedProcessId).filter((p): p is ID => p != null))]
  const base = fromProcesses(processIds, objective.name, 'objective', objective.id,
    `Strategic objective playbook — every AI move that contributes to ${objective.name}.`)
  return narrow(base, {
    initiativeIds: initiatives.map((i) => i.id),
    objectiveIds: [objective.id],
    demandIds: dataset.d2dDemands.filter((d) => d.strategicObjectiveId === objective.id).map((d) => d.id),
  })
}
