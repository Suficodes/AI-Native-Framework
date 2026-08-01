// Playbook sections 1–5 — the "what to do" half of the AI Playbook
// (requirements doc Section 10): AI-native vision, human–agent operating
// model, department transformation guidance, quick wins, and the
// process-agenticity roadmap.
//
// Every function takes the resolved PlaybookScope and reads only the dataset —
// no section is hand-authored per scope, which is what makes the playbook
// "living" rather than a static document.
//
// Marginally over the 200-line module cap: the five exported functions share
// the same tiny numeric helpers and the same "one section of the doc, one
// function" shape. Any split point here would be arbitrary.
import { dataset } from './mockApi'
import {
  AGENT_ACCOUNTABILITIES, HUMAN_ACCOUNTABILITIES, OPERATING_MODEL_PRINCIPLES,
  VISION_PILLARS, VISION_STATEMENT,
} from './seed/playbook.seed'
import type {
  AgenticityLevel, ID, PlaybookAgenticityStep, PlaybookHorizon, PlaybookOperatingModel,
  PlaybookQuickWin, PlaybookScope, PlaybookTransformationGuidance, PlaybookVision,
} from './types'
import { AGENTICITY_ORDER, WORKFORCE_TYPE_LABELS } from './types'

const MAX_LEVEL = AGENTICITY_ORDER.length - 1
const levelIndex = (l: AgenticityLevel) => AGENTICITY_ORDER.indexOf(l)
const levelPct = (l: AgenticityLevel) => (levelIndex(l) / MAX_LEVEL) * 100
const avg = (nums: number[]) => (nums.length === 0 ? 0 : nums.reduce((s, n) => s + n, 0) / nums.length)
const round = (n: number) => Math.round(n)

// ─────────────────────────── 1. AI-native vision ───────────────────────────

export function vision(scope: PlaybookScope): PlaybookVision {
  const processes = dataset.processes.filter((p) => scope.processIds.includes(p.id))
  const positions = dataset.positions.filter((p) => scope.positionIds.includes(p.id))
  const agents = dataset.agents.filter((a) => scope.agentIds.includes(a.id))
  const qps = dataset.qualityProcedures.filter((q) => scope.qpIds.includes(q.id))
  const vrRecords = dataset.vrRecords.filter((v) => scope.initiativeIds.includes(v.aiInitiativeId))

  const measured: [number, number][] = [
    [avg(processes.map((p) => levelPct(p.currentAgenticity))), avg(processes.map((p) => levelPct(p.targetAgenticity)))],
    [agents.length === 0 ? 0 : (agents.filter((a) => a.status === 'Active').length / agents.length) * 100, 100],
    [avg(positions.map((p) => p.aiWorkCoveragePct)), avg(qps.map((q) => q.targetAiCoveragePct))],
    [
      avg(vrRecords.map((v) => v.benefitRealizationPct)),
      100,
    ],
  ]

  return {
    statement: VISION_STATEMENT,
    pillars: VISION_PILLARS.map((pillar, i) => ({
      ...pillar,
      currentPct: round(measured[i][0]),
      targetPct: round(Math.max(measured[i][1], measured[i][0])),
    })),
  }
}

// ─────────────────────────── 2. Human–agent operating model ───────────────────────────

export function operatingModel(scope: PlaybookScope): PlaybookOperatingModel {
  const positions = dataset.positions.filter((p) => scope.positionIds.includes(p.id))
  const workforceMix = (Object.keys(WORKFORCE_TYPE_LABELS) as (keyof typeof WORKFORCE_TYPE_LABELS)[])
    .map((type) => {
      const count = positions.filter((p) => p.workforceType === type).length
      return {
        type,
        label: WORKFORCE_TYPE_LABELS[type],
        positions: count,
        sharePct: positions.length === 0 ? 0 : round((count / positions.length) * 100),
      }
    })
    .filter((row) => row.positions > 0)

  const controlPoints = dataset.qualityProcedures
    .filter((q) => scope.qpIds.includes(q.id) && (q.indicator === 'C' || q.indicator === 'E'))
    .slice(0, 8)
    .map((q) => ({ qpId: q.id, title: q.title, indicator: q.indicator }))

  return {
    principles: OPERATING_MODEL_PRINCIPLES,
    workforceMix,
    controlPoints,
    humanAccountabilities: HUMAN_ACCOUNTABILITIES,
    agentAccountabilities: AGENT_ACCOUNTABILITIES,
  }
}

// ─────────────────────────── 3. Department transformation guidance ───────────────────────────

/** The org units this scope's guidance is written for: departments when the scope
 *  spans several, the sections themselves when it is narrower. */
function guidanceUnits(scope: PlaybookScope): { id: ID; name: string; sectionIds: ID[] }[] {
  const sections = dataset.orgNodes.filter((n) => scope.sectionIds.includes(n.id))
  if (sections.length <= 1) {
    return sections.map((s) => ({ id: s.id, name: s.name, sectionIds: [s.id] }))
  }
  const byParent = new Map<ID, ID[]>()
  for (const section of sections) {
    const parentId = section.parentId ?? section.id
    byParent.set(parentId, [...(byParent.get(parentId) ?? []), section.id])
  }
  return [...byParent.entries()]
    .map(([parentId, sectionIds]) => ({
      id: parentId,
      name: dataset.orgNodes.find((n) => n.id === parentId)?.name ?? 'Unassigned',
      sectionIds,
    }))
    .slice(0, 8)
}

function agenticityAcross(sectionIds: ID[], key: 'currentAgenticity' | 'targetAgenticity'): AgenticityLevel | null {
  const procs = dataset.processes.filter((p) => sectionIds.includes(p.ownerSectionId))
  if (procs.length === 0) return null
  return AGENTICITY_ORDER[Math.round(avg(procs.map((p) => levelIndex(p[key]))))]
}

export function transformationGuidance(scope: PlaybookScope): PlaybookTransformationGuidance[] {
  return guidanceUnits(scope).map((unit) => {
    const current = agenticityAcross(unit.sectionIds, 'currentAgenticity')
    const target = agenticityAcross(unit.sectionIds, 'targetAgenticity')
    const positions = dataset.positions.filter((p) => unit.sectionIds.includes(p.sectionId))
    const agents = dataset.agents.filter((a) => unit.sectionIds.includes(a.orgAssignment.sectionId))
    const coverage = round(avg(positions.map((p) => p.aiWorkCoveragePct)))
    const gap = current != null && target != null ? levelIndex(target) - levelIndex(current) : 0

    const moves: string[] = []
    if (gap >= 3) moves.push(`Close a ${gap}-level agenticity gap in stages — do not attempt ${current} to ${target} in one release.`)
    if (agents.length === 0) moves.push('No agent is assigned to this unit yet: start with one assistive agent on the highest-volume Quality Procedure.')
    else moves.push(`Bring the ${agents.length} assigned agent${agents.length === 1 ? '' : 's'} to Production before adding new ones.`)
    if (coverage < 30) moves.push(`AI work coverage is ${coverage}% — the constraint is process redesign, not tooling.`)
    else moves.push(`Convert the remaining ${100 - coverage}% of measured effort by re-scoping steps for agent execution.`)
    moves.push(`Re-baseline every Quality Procedure this unit owns so control points are explicit before autonomy increases.`)

    return {
      unitId: unit.id,
      unitName: unit.name,
      fromState: current
        ? `${current} today across ${dataset.processes.filter((p) => unit.sectionIds.includes(p.ownerSectionId)).length} registered process(es), ${positions.length} position(s), ${agents.length} agent(s).`
        : `No registered processes yet — ${positions.length} position(s), ${agents.length} agent(s).`,
      toState: target
        ? `${target} with governed human control points and ${agents.length > 0 ? 'supervised' : 'newly onboarded'} agents carrying the repeatable work.`
        : 'Register the unit\'s core processes before setting an agenticity target.',
      currentAgenticity: current,
      targetAgenticity: target,
      aiCoveragePct: coverage,
      moves,
    }
  })
}

// ─────────────────────────── 4. Quick wins ───────────────────────────

export function quickWins(scope: PlaybookScope): PlaybookQuickWin[] {
  const procs = dataset.processes.filter((p) => scope.processIds.includes(p.id))
  const byId = new Map(procs.map((p) => [p.id, p]))

  const candidates = dataset.processSteps
    .filter((s) => byId.has(s.processId) && s.currentOwner === 'Human' && s.futureOwner !== 'Human')
    .map((step) => {
      const process = byId.get(step.processId)!
      // Rank on value, weighted by how ready the process is and discounted by risk.
      const score = step.valueOpportunity.value * (process.readinessScore / 100) / (1 + process.riskScore / 100)
      return { step, process, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  return candidates.map(({ step, process }) => {
    const effortScore = levelIndex(step.automationLevel) + (100 - process.readinessScore) / 25
    const effort: PlaybookQuickWin['effort'] = effortScore >= 7 ? 'High' : effortScore >= 4 ? 'Medium' : 'Low'
    return {
      id: step.id,
      title: step.name,
      processId: process.id,
      processName: process.name,
      currentOwner: step.currentOwner,
      effort,
      timeToValueWeeks: effort === 'Low' ? 4 : effort === 'Medium' ? 8 : 14,
      valueOpportunity: step.valueOpportunity,
      rationale: `Fully human today at ${step.avgProcessingTimeMins} min per item with a ${step.exceptionRatePct}% exception rate; `
        + `target owner is ${step.futureOwner} at ${step.automationLevel}, and the process is ${process.readinessScore}% ready.`,
    }
  })
}

// ─────────────────────────── 5. Process-agenticity roadmap ───────────────────────────

function horizonFor(gap: number, readiness: number, risk: number): PlaybookHorizon {
  if (readiness >= 70 && gap <= 2 && risk < 60) return 'Now'
  if (readiness < 45 || gap >= 4 || risk >= 75) return 'Later'
  return 'Next'
}

export function agenticityRoadmap(scope: PlaybookScope): PlaybookAgenticityStep[] {
  const order: Record<PlaybookHorizon, number> = { Now: 0, Next: 1, Later: 2 }
  return dataset.processes
    .filter((p) => scope.processIds.includes(p.id))
    .map((process) => {
      const gap = levelIndex(process.targetAgenticity) - levelIndex(process.currentAgenticity)
      const blockers: string[] = []
      if (process.readinessScore < 60) blockers.push(`Readiness at ${process.readinessScore}% — data, knowledge, or process definition incomplete`)
      if (process.riskScore >= 65) blockers.push(`Risk score ${process.riskScore} — needs Risk Review before autonomy increases`)
      if (!dataset.harnesses.some((h) => h.assignedProcessId === process.id)) blockers.push('No harness designed for this process yet')
      const qps = dataset.qualityProcedures.filter((q) => q.relatedProcessId === process.id)
      if (qps.length === 0) blockers.push('No Quality Procedure defines the control boundary')
      else if (qps.every((q) => q.status !== 'Active')) blockers.push('Governing Quality Procedure is not in an Active state')

      return {
        processId: process.id,
        processName: process.name,
        currentAgenticity: process.currentAgenticity,
        targetAgenticity: process.targetAgenticity,
        levelGap: gap,
        readinessScore: process.readinessScore,
        riskScore: process.riskScore,
        horizon: horizonFor(gap, process.readinessScore, process.riskScore),
        blockers,
      }
    })
    .sort((a, b) => order[a.horizon] - order[b.horizon] || b.levelGap - a.levelGap)
}
