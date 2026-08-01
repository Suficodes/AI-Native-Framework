import { describe, it, expect } from 'vitest'
import { dataset } from './mockApi'
import {
  headcountRollup, strategicObjectivesForSection, agentsForPosition,
  performanceStatusForPosition, agenticityForSection, tokenCostForSection,
  realizedValueForSection,
} from './organizationAggregates'

describe('organizationAggregates', () => {
  it('rolls up headcount at the enterprise root to the full dataset totals', () => {
    const root = dataset.orgNodes.find((n) => n.level === 'Enterprise')!
    const counts = headcountRollup(root.id)
    expect(counts.human).toBe(dataset.employees.length)
    expect(counts.agent).toBe(dataset.agents.length)
  })

  it('returns no dangling strategic objective references', () => {
    const validIds = new Set(dataset.strategicObjectives.map((o) => o.id))
    for (const section of dataset.orgNodes.filter((n) => n.level === 'Section')) {
      for (const objId of strategicObjectivesForSection(section.id)) {
        expect(validIds.has(objId)).toBe(true)
      }
    }
  })

  it('finds the D2D Documentation Agent for the Senior Business Analyst worked example', () => {
    const agents = agentsForPosition('POS-BA-D2D-01')
    expect(agents.map((a) => a.id)).toEqual(['AGT-D2D-DOC-01'])
  })

  it('derives a performance status for a position with an assigned agent, and N/A without one', () => {
    expect(performanceStatusForPosition('POS-BA-D2D-01')).not.toBe('N/A')
    const humanOnly = dataset.positions.find(
      (p) => p.workforceType === 'Human' && agentsForPosition(p.id).length === 0,
    )!
    expect(performanceStatusForPosition(humanOnly.id)).toBe('N/A')
  })

  it('agenticityForSection returns a valid AgenticityLevel for a section that owns processes', () => {
    const d2dSection = dataset.orgNodes.find((n) => n.name === 'Demand-to-Delivery Section')!
    const level = agenticityForSection(d2dSection.id, 'current')
    expect(level).not.toBeNull()
    expect(['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']).toContain(level)
  })

  it('token cost and realized value roll up to non-negative numbers for the D2D section', () => {
    const d2dSection = dataset.orgNodes.find((n) => n.name === 'Demand-to-Delivery Section')!
    expect(tokenCostForSection(d2dSection.id)).toBeGreaterThanOrEqual(0)
    expect(realizedValueForSection(d2dSection.id)).not.toBeNaN()
  })
})
