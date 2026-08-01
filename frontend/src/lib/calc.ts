// The requirements doc's formulas, implemented once and imported everywhere
// a number is displayed — never hand-compute or hardcode a result a formula
// could produce (CONVENTIONS.md "Data layer").
import type { WorkContributionRecord } from '../data/types'

/** AI Work Coverage % = Σ(baseline hours × AI contribution %) / Σ(baseline hours) (Section 12.4) */
export function aiWorkCoverage(records: WorkContributionRecord[]): number {
  const totalBaseline = records.reduce((s, r) => s + r.baselineHours, 0)
  if (totalBaseline === 0) return 0
  const weighted = records.reduce((s, r) => s + r.baselineHours * (r.aiContributionPct / 100), 0)
  return (weighted / totalBaseline) * 100
}

/** Quality-Adjusted AI Coverage = AI Work Coverage × Acceptance Rate × Accuracy Rate (Section 12.4) */
export function qualityAdjustedAiCoverage(coverage: number, acceptanceRate: number, accuracyRate: number): number {
  return coverage * acceptanceRate * accuracyRate
}

/** Acceptance rate derived from a Work Contribution Ledger: accepted / (accepted+edited+rejected). */
export function acceptanceRate(records: WorkContributionRecord[]): number {
  const accepted = records.reduce((s, r) => s + r.outputAccepted, 0)
  const total = records.reduce((s, r) => s + r.outputAccepted + r.outputEdited + r.outputRejected, 0)
  return total === 0 ? 0 : accepted / total
}

/** Accuracy rate derived from a Work Contribution Ledger: non-rejected / total. */
export function accuracyRate(records: WorkContributionRecord[]): number {
  const rejected = records.reduce((s, r) => s + r.outputRejected, 0)
  const total = records.reduce((s, r) => s + r.outputAccepted + r.outputEdited + r.outputRejected, 0)
  return total === 0 ? 0 : 1 - rejected / total
}

/** Total verified capacity released across a Work Contribution Ledger, in hours. */
export function verifiedCapacityReleasedHours(records: WorkContributionRecord[]): number {
  return records.reduce((s, r) => s + r.verifiedTimeReleasedHours.value, 0)
}

/** Net Value = Validated Benefit − Total AI Cost (Section 14.2) */
export function netValue(validatedBenefit: number, totalAiCost: number): number {
  return validatedBenefit - totalAiCost
}

/** AI Value Realization % = Validated Realized Benefit / Approved Target Benefit (Section 14.2) */
export function aiValueRealizationPct(validatedRealizedBenefit: number, approvedTargetBenefit: number): number {
  return approvedTargetBenefit === 0 ? 0 : (validatedRealizedBenefit / approvedTargetBenefit) * 100
}

/** Cost per Verified Hour Released = Total AI Cost / Verified Human Hours Released (Section 14.2) */
export function costPerVerifiedHourReleased(totalAiCost: number, verifiedHumanHoursReleased: number): number {
  return verifiedHumanHoursReleased === 0 ? 0 : totalAiCost / verifiedHumanHoursReleased
}

/** Useful Intelligence per AED = Successful Business Outcomes / Total AI Cost (Section 14.2 / 9.2) */
export function usefulIntelligencePerAed(successfulBusinessOutcomes: number, totalAiCost: number): number {
  return totalAiCost === 0 ? 0 : successfulBusinessOutcomes / totalAiCost
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}
