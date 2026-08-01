// Derived data for the Copilot & Workforce module (requirements doc Section
// 12). Reuses lib/calc.ts's formulas (already the source of truth for the
// same figures on Executive Overview) rather than recomputing them.
import { dataset } from './mockApi'
import { aiWorkCoverage, acceptanceRate, accuracyRate, qualityAdjustedAiCoverage, verifiedCapacityReleasedHours } from '../lib/calc'

export function copilotSummary() {
  const records = dataset.copilotUsage
  const eligibleUsers = records.reduce((s, r) => s + r.eligibleUsers, 0)
  const licensedUsers = records.reduce((s, r) => s + r.licensedUsers, 0)
  const activeUsers = records.reduce((s, r) => s + r.activeUsers, 0)
  return {
    eligibleUsers,
    licensedUsers,
    activeUsers,
    adoptionPct: eligibleUsers === 0 ? 0 : Math.round((activeUsers / eligibleUsers) * 100),
    licenseUtilizationPct: licensedUsers === 0 ? 0 : Math.round((activeUsers / licensedUsers) * 100),
  }
}

export function workforceSampleResults() {
  const wc = dataset.workContribution
  const coverage = aiWorkCoverage(wc)
  const acc = acceptanceRate(wc)
  const accu = accuracyRate(wc)
  const qualityAdjusted = qualityAdjustedAiCoverage(coverage, acc, accu)
  const released = verifiedCapacityReleasedHours(wc)
  const redeployed = dataset.humanPerformance.reduce((s, r) => s + r.capacityRedeployedHours, 0)
  return {
    copilotAdoptionPct: copilotSummary().adoptionPct,
    aiWorkCoveragePct: Math.round(coverage * 10) / 10,
    qualityAdjustedCoveragePct: Math.round(qualityAdjusted * 10) / 10,
    verifiedCapacityReleasedHours: Math.round(released),
    redeployedCapacityHours: redeployed,
  }
}
