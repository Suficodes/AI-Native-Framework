// The AI Playbook assembler (requirements doc Section 10) — sections 13–15
// plus buildPlaybook(), the single entry point every playbook view goes
// through.
//
// The architectural rule here mirrors the Enterprise Map's one-graph-many-
// lenses rule (CONVENTIONS.md): ONE scope shape, ONE builder, fifteen derived
// sections. A division playbook, a job playbook, and an agent playbook all run
// this exact code path — there is no per-scope screen and no per-scope content.
import { dataset } from './mockApi'
import { resolvePlaybookScope } from './playbookScope'
import { agenticityRoadmap, operatingModel, quickWins, transformationGuidance, vision } from './playbookGuidance'
import { recommendedAgents, requiredData, sourcingCriteria } from './playbookRecommendations'
import { governance, harnessRequirements, tokenBudget, valueOpportunity } from './playbookGovernance'
import type {
  AIInitiative, ID, Playbook, PlaybookHorizon, PlaybookLesson, PlaybookRoadmapItem,
  PlaybookScope, PlaybookScopeType, ReusableSkill,
} from './types'

// ─────────────────────────── 13. Implementation roadmap ───────────────────────────

const LIVE_STAGES = new Set(['Production', 'Scaling', 'Retired'])
const IN_FLIGHT_STAGES = new Set(['Build', 'Evaluation', 'Probation', 'Estimation'])

function horizonForInitiative(initiative: AIInitiative): PlaybookHorizon {
  if (LIVE_STAGES.has(initiative.stage) || IN_FLIGHT_STAGES.has(initiative.stage)) return 'Now'
  if (initiative.stage === 'Shaping' || initiative.stage === 'D2DIntake') return 'Next'
  return 'Later'
}

function dependenciesFor(initiative: AIInitiative): string[] {
  const deps: string[] = []
  if (initiative.dataReadiness < 60) deps.push(`Data preparation — readiness at ${initiative.dataReadiness}%`)
  if (initiative.harnessReadiness < 60) deps.push(`Harness design and evaluation suite — readiness at ${initiative.harnessReadiness}%`)
  const qp = dataset.qualityProcedures.find((q) => q.id === initiative.relatedQpId)
  if (qp && qp.status !== 'Active') deps.push(`${qp.id} must reach Active status (currently ${qp.status})`)
  if (initiative.riskLevel === 'High') deps.push('Risk Review sign-off before build starts')
  if (deps.length === 0) deps.push('No blocking dependency recorded')
  return deps
}

export function implementationRoadmap(scope: PlaybookScope): PlaybookRoadmapItem[] {
  const order: Record<PlaybookHorizon, number> = { Now: 0, Next: 1, Later: 2 }
  return dataset.aiInitiatives
    .filter((i) => scope.initiativeIds.includes(i.id))
    .map((initiative) => ({
      initiativeId: initiative.id,
      title: initiative.title,
      horizon: horizonForInitiative(initiative),
      stage: initiative.stage,
      status: initiative.status,
      goLiveDate: initiative.goLiveDate,
      expectedValue: initiative.expectedValue,
      dependencies: dependenciesFor(initiative),
    }))
    .sort((a, b) => order[a.horizon] - order[b.horizon] || b.expectedValue.value - a.expectedValue.value)
}

// ─────────────────────────── 14. Lessons learned ───────────────────────────

/** Lessons that actually touch this scope — an enterprise scope sees all of them,
 *  a section scope only sees the ones tied to its processes or division. */
export function lessonsLearned(scope: PlaybookScope): PlaybookLesson[] {
  if (scope.type === 'enterprise') return dataset.playbookLessons
  const processIds = new Set(scope.processIds)
  const divisionIds = new Set(scope.divisionIds)
  // Process-level matches are the ones that genuinely belong to this scope;
  // division matches only top the list up so a narrow scope is never empty
  // (and never silently shows the whole enterprise set either).
  const onProcess = dataset.playbookLessons.filter((l) => l.appliesToProcessIds.some((p) => processIds.has(p)))
  if (onProcess.length >= 4) return onProcess
  const onDivision = dataset.playbookLessons.filter(
    (l) => !onProcess.includes(l) && l.appliesToDivisionIds.some((d) => divisionIds.has(d)),
  )
  return [...onProcess, ...onDivision].slice(0, 4)
}

// ─────────────────────────── 15. Approved reusable skills ───────────────────────────

/** Skills already used by an in-scope harness first, then the enterprise-standard
 *  ones available to reuse — the section's whole point is "check before you build". */
export function reusableSkills(scope: PlaybookScope): ReusableSkill[] {
  const harnessIds = new Set(scope.harnessIds)
  const used = dataset.reusableSkills.filter((s) => s.usedByHarnessIds.some((h) => harnessIds.has(h)))
  const available = dataset.reusableSkills.filter(
    (s) => !used.includes(s) && (s.maturity === 'Standard' || s.maturity === 'Approved'),
  )
  return [...used.sort((a, b) => b.reuseCount - a.reuseCount), ...available.sort((a, b) => b.reuseCount - a.reuseCount)]
}

// ─────────────────────────── The assembler ───────────────────────────

export function buildPlaybookFromScope(scope: PlaybookScope): Playbook {
  const recommendations = recommendedAgents(scope)
  return {
    scope,
    vision: vision(scope),
    operatingModel: operatingModel(scope),
    transformationGuidance: transformationGuidance(scope),
    quickWins: quickWins(scope),
    agenticityRoadmap: agenticityRoadmap(scope),
    recommendedAgents: recommendations,
    sourcingCriteria: sourcingCriteria(recommendations),
    requiredData: requiredData(scope),
    harnessRequirements: harnessRequirements(scope),
    governance: governance(scope),
    valueOpportunity: valueOpportunity(scope),
    tokenBudget: tokenBudget(scope),
    implementationRoadmap: implementationRoadmap(scope),
    lessonsLearned: lessonsLearned(scope),
    reusableSkills: reusableSkills(scope),
  }
}

export function buildPlaybook(scopeType: PlaybookScopeType, scopeId: ID): Playbook | null {
  const scope = resolvePlaybookScope(scopeType, scopeId)
  return scope ? buildPlaybookFromScope(scope) : null
}
