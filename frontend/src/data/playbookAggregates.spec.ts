import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import { buildPlaybook } from './playbookAggregates'
import {
  d2dExampleDepartmentId, enterpriseScopeId, isSkillInScope, playbookScopeOptions,
  resolvePlaybookScope,
} from './playbookScope'
import { PLAYBOOK_SCOPE_LABELS, type PlaybookScopeType } from './types'

const SCOPE_TYPES = Object.keys(PLAYBOOK_SCOPE_LABELS) as PlaybookScopeType[]

/** First selectable scope for a type — the same value the picker defaults to. */
function firstScopeId(type: PlaybookScopeType): string {
  return type === 'enterprise' ? enterpriseScopeId() : playbookScopeOptions(type)[0].value
}

describe('playbook scope resolution', () => {
  it('resolves every scope dimension the requirements doc names', () => {
    // Section 10: division, department, section, job, process, QP, agent,
    // strategic objective — plus the enterprise root the picker defaults to.
    expect(SCOPE_TYPES).toHaveLength(9)
    for (const type of SCOPE_TYPES) {
      const scope = resolvePlaybookScope(type, firstScopeId(type))
      expect(scope, `scope type ${type} failed to resolve`).not.toBeNull()
      expect(scope!.label.length).toBeGreaterThan(0)
      expect(scope!.context.length).toBeGreaterThan(0)
    }
  })

  it('returns null for an unknown scope id rather than throwing', () => {
    expect(resolvePlaybookScope('division', 'DIV-999')).toBeNull()
    expect(buildPlaybook('agent', 'AGT-NOPE')).toBeNull()
  })

  it('resolves only real foreign keys — no dangling references in any scope', () => {
    const valid = {
      sectionIds: new Set(dataset.orgNodes.map((n) => n.id)),
      divisionIds: new Set(dataset.orgNodes.map((n) => n.id)),
      positionIds: new Set(dataset.positions.map((p) => p.id)),
      employeeIds: new Set(dataset.employees.map((e) => e.id)),
      agentIds: new Set(dataset.agents.map((a) => a.id)),
      processIds: new Set(dataset.processes.map((p) => p.id)),
      qpIds: new Set(dataset.qualityProcedures.map((q) => q.id)),
      initiativeIds: new Set(dataset.aiInitiatives.map((i) => i.id)),
      harnessIds: new Set(dataset.harnesses.map((h) => h.id)),
      demandIds: new Set(dataset.d2dDemands.map((d) => d.id)),
      objectiveIds: new Set(dataset.strategicObjectives.map((o) => o.id)),
    }
    for (const type of SCOPE_TYPES) {
      const scope = resolvePlaybookScope(type, firstScopeId(type))!
      for (const [key, ids] of Object.entries(valid)) {
        for (const id of scope[key as keyof typeof valid]) {
          expect(ids.has(id), `${type} scope has dangling ${key}: ${id}`).toBe(true)
        }
      }
    }
  })

  it('narrows: an agent scope is a strict subset of its enterprise counterpart', () => {
    const enterprise = resolvePlaybookScope('enterprise', enterpriseScopeId())!
    const agent = resolvePlaybookScope('agent', 'AGT-D2D-DOC-01')!
    expect(agent.agentIds).toEqual(['AGT-D2D-DOC-01'])
    expect(agent.processIds.length).toBeLessThan(enterprise.processIds.length)
    for (const id of agent.processIds) expect(enterprise.processIds).toContain(id)
  })
})

describe('buildPlaybook', () => {
  it('produces all 15 sections, populated, for the enterprise scope', () => {
    const playbook = buildPlaybook('enterprise', enterpriseScopeId())!
    expect(playbook.vision.pillars).toHaveLength(4)
    expect(playbook.operatingModel.principles.length).toBeGreaterThan(0)
    expect(playbook.operatingModel.workforceMix.length).toBeGreaterThan(0)
    expect(playbook.transformationGuidance.length).toBeGreaterThan(0)
    expect(playbook.quickWins.length).toBeGreaterThan(0)
    expect(playbook.agenticityRoadmap).toHaveLength(dataset.processes.length)
    expect(playbook.recommendedAgents).toHaveLength(dataset.aiInitiatives.length)
    expect(playbook.sourcingCriteria).toHaveLength(3)
    expect(playbook.requiredData.length).toBeGreaterThan(0)
    expect(playbook.harnessRequirements).toHaveLength(6)
    expect(playbook.governance.rules.length).toBeGreaterThan(0)
    expect(playbook.valueOpportunity.realizedNetBenefit.tag).toBe('Validated')
    expect(playbook.tokenBudget.periodCost).toBeGreaterThan(0)
    expect(playbook.implementationRoadmap).toHaveLength(dataset.aiInitiatives.length)
    expect(playbook.lessonsLearned).toHaveLength(dataset.playbookLessons.length)
    expect(playbook.reusableSkills).toHaveLength(dataset.reusableSkills.length)
  })

  it('renders every scope dimension through the same builder without throwing or emptying out', () => {
    for (const type of SCOPE_TYPES) {
      const playbook = buildPlaybook(type, firstScopeId(type))!
      expect(playbook.vision.pillars, type).toHaveLength(4)
      expect(playbook.harnessRequirements, type).toHaveLength(6)
      expect(playbook.sourcingCriteria, type).toHaveLength(3)
      // Guidance must never render blank, whatever the scope resolves to.
      expect(playbook.lessonsLearned.length, `${type} lost its lessons`).toBeGreaterThan(0)
      expect(playbook.reusableSkills.length, `${type} lost its skills`).toBeGreaterThan(0)
      // openRisks is allowed to be empty — a clean scope renders a positive
      // state — but it must never contain a duplicate line (React key collision).
      expect(new Set(playbook.governance.openRisks).size).toBe(playbook.governance.openRisks.length)
    }
  })

  it('edge case — a single Quality Procedure scope narrows the content instead of showing the enterprise set', () => {
    const enterprise = buildPlaybook('enterprise', enterpriseScopeId())!
    const qp = buildPlaybook('qp', 'QP-01')!
    expect(qp.scope.qpIds).toEqual(['QP-01'])
    expect(qp.recommendedAgents.length).toBeLessThan(enterprise.recommendedAgents.length)
    expect(qp.agenticityRoadmap.length).toBeLessThan(enterprise.agenticityRoadmap.length)
    expect(qp.lessonsLearned.length).toBeLessThan(enterprise.lessonsLearned.length)
  })

  it('gives every recommendation the ten fields the requirements doc lists', () => {
    const playbook = buildPlaybook('enterprise', enterpriseScopeId())!
    for (const rec of playbook.recommendedAgents) {
      expect(rec.problemAddressed.length).toBeGreaterThan(0)
      expect(rec.processSupported.length).toBeGreaterThan(0)
      expect(rec.humanRoleAffected.length).toBeGreaterThan(0)
      expect(rec.expectedAiContribution.length).toBeGreaterThan(0)
      expect(rec.requiredHumanControls.length).toBeGreaterThan(0)
      expect(rec.recommendedPlatform.length).toBeGreaterThan(0)
      expect(rec.expectedValue.value).toBeGreaterThan(0)
      expect(['Low', 'Medium', 'High']).toContain(rec.complexity)
      expect(['Low', 'Medium', 'High']).toContain(rec.risk)
      expect(['P1', 'P2', 'P3']).toContain(rec.deliveryPriority)
    }
    // Every recommendation is counted exactly once by the sourcing decision section.
    const counted = playbook.sourcingCriteria.reduce((s, c) => s + c.recommendedCount, 0)
    expect(counted).toBe(playbook.recommendedAgents.length)
  })

  it('renders the required D2D department worked example through the generic builder', () => {
    const departmentId = d2dExampleDepartmentId()
    expect(departmentId).not.toBeNull()
    const playbook = buildPlaybook('department', departmentId!)!
    expect(playbook.scope.label).toBe('Innovation & Technology Function Department')
    // The department owns the D2D worked example, so its playbook must reach it.
    expect(playbook.scope.processIds).toContain('PROC-D2D')
    expect(playbook.scope.agentIds).toContain('AGT-D2D-DOC-01')
    expect(playbook.scope.harnessIds).toContain('HAR-D2D-BRD-01')
    expect(playbook.scope.qpIds).toContain('QP-01')
  })

  it('marks in-scope skills as in use and leaves the rest as available inventory', () => {
    const playbook = buildPlaybook('agent', 'AGT-D2D-DOC-01')!
    const inUse = playbook.reusableSkills.filter((s) => isSkillInScope(s, playbook.scope))
    expect(inUse.length).toBeGreaterThan(0)
    // In-use skills sort ahead of the available inventory.
    expect(isSkillInScope(playbook.reusableSkills[0], playbook.scope)).toBe(true)
  })
})
