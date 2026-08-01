// Agent performance (7-dimension Agent Performance Index, Section 13 weights)
// and Human AI-Native Performance records.
import type { Agent, AgentPerformanceRecord, AgentPerformanceResult, Employee, HumanAiPerformanceRecord } from '../types'
import { nextPerfId } from '../ids'
import { type Rng, int, pick } from '../rng'

const WEIGHTS = { businessOutcome: 0.25, quality: 0.20, productivity: 0.15, reliability: 0.10, humanCollaboration: 0.10, costEfficiency: 0.10, complianceAndSafety: 0.10 }

function resultFor(weightedScore: number, complianceAndSafety: number): AgentPerformanceResult {
  if (complianceAndSafety < 60) return 'Restricted'
  if (weightedScore >= 85) return 'ExceedsExpectations'
  if (weightedScore >= 65) return 'MeetsExpectations'
  return 'NeedsOptimization'
}

export function buildAgentPerformance(rng: Rng, agents: Agent[]): AgentPerformanceRecord[] {
  return agents.map((agent) => {
    const dims = {
      businessOutcome: int(rng, 55, 98), quality: int(rng, 60, 99), productivity: int(rng, 50, 97),
      reliability: int(rng, 65, 99), humanCollaboration: int(rng, 55, 95), costEfficiency: int(rng, 50, 96),
      complianceAndSafety: agent.status === 'Restricted' ? int(rng, 30, 58) : int(rng, 75, 100),
    }
    const weightedScore = Math.round(
      dims.businessOutcome * WEIGHTS.businessOutcome + dims.quality * WEIGHTS.quality
      + dims.productivity * WEIGHTS.productivity + dims.reliability * WEIGHTS.reliability
      + dims.humanCollaboration * WEIGHTS.humanCollaboration + dims.costEfficiency * WEIGHTS.costEfficiency
      + dims.complianceAndSafety * WEIGHTS.complianceAndSafety,
    )
    return {
      id: nextPerfId(), agentId: agent.id, period: 'Q3-2026',
      successfulCompletionRatePct: int(rng, 80, 99), accuracyPct: agent.qualityScore,
      firstTimeRightPct: int(rng, 60, 95), qualityScore: agent.qualityScore,
      slaCompliancePct: int(rng, 75, 99), reliabilityPct: dims.reliability,
      humanOverrideRatePct: agent.humanOverrideRatePct, exceptionRatePct: int(rng, 1, 15),
      escalationRatePct: int(rng, 0, 10), costPerSuccessfulOutcome: int(rng, 5, 220),
      tokenEfficiency: int(rng, 60, 98), complianceScore: dims.complianceAndSafety,
      valueGenerated: agent.valueGenerated,
      index: { ...dims, weightedScore },
      result: agent.status === 'Suspended' ? 'Suspended' : agent.status === 'Retired' ? 'Retired' : resultFor(weightedScore, dims.complianceAndSafety),
    }
  })
}

export function buildHumanPerformance(rng: Rng, employees: Employee[]): HumanAiPerformanceRecord[] {
  const sample = employees.slice(0, 25)
  return sample.map((emp) => ({
    id: `HPERF-${emp.id}`, employeeId: emp.id, period: 'Q3-2026',
    aiEnabledOutputQuality: int(rng, 60, 97), effectiveCopilotAgentUse: int(rng, 40, 95),
    capacityReleasedHours: int(rng, 10, 180), capacityRedeployedHours: int(rng, 5, 150),
    agentSupervisionEffectiveness: int(rng, 55, 96), exceptionHandlingScore: int(rng, 60, 98),
    processImprovementContributions: int(rng, 0, 8), knowledgeContributionScore: int(rng, 40, 95),
    businessOutcomesScore: int(rng, 55, 97), responsibleAiCompliance: pick(rng, ['Compliant', 'Compliant', 'Compliant', 'UnderReview']),
  }))
}
