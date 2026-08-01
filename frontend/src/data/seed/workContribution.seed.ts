// Copilot usage aggregates + the Work Contribution Ledger. Ranges are tuned
// so the real, formula-computed KPIs (via lib/calc.ts) land close to the
// requirements doc's illustrative sample results (Section 12: ~85% adoption,
// ~38% AI-assisted coverage, ~32% quality-adjusted coverage, ~1,200h verified
// capacity released) — the numbers are genuinely computed from these seeded
// records, not hardcoded to match those figures exactly.
import type { CopilotUsageRecord, Employee, Process, WorkContributionRecord } from '../types'
import { nextCopilotUsageId, nextWorkItemId } from '../ids'
import { type Rng, int, pick } from '../rng'
import type { BuiltOrg } from './organization.seed'

const ACTIVITIES = ['Report drafting', 'Requirement documentation', 'Data reconciliation', 'Customer response drafting', 'Process analysis', 'Meeting summarization', 'Exception review', 'Invoice checking']

export function buildCopilotUsage(rng: Rng, org: BuiltOrg): CopilotUsageRecord[] {
  const divisions = org.orgNodes.filter((n) => n.level === 'Division')
  return divisions.map((div) => {
    const eligible = int(rng, 300, 1200)
    const licensed = Math.round(eligible * (int(rng, 70, 95) / 100))
    const active = Math.round(licensed * (int(rng, 60, 92) / 100))
    return {
      id: nextCopilotUsageId(), divisionId: div.id, period: 'Q3-2026',
      eligibleUsers: eligible, licensedUsers: licensed, activeUsers: active,
      activeDays: int(rng, 8, 22),
      applicationUsage: { Word: int(rng, 40, 95), Excel: int(rng, 30, 90), Teams: int(rng, 50, 98), Outlook: int(rng, 45, 96) },
      copilotSupportedActivities: ['Drafting', 'Summarizing', 'Search', 'Analysis'],
      agentUsageCount: int(rng, 200, 5000),
      adoptionByDivisionPct: Math.round((active / eligible) * 100),
      adoptionByRolePct: { Manager: int(rng, 60, 95), Analyst: int(rng, 55, 92), Specialist: int(rng, 40, 85) },
      licenseUtilizationPct: Math.round((active / licensed) * 100),
    }
  })
}

export function buildWorkContribution(rng: Rng, employees: Employee[], processes: Process[]): WorkContributionRecord[] {
  const records: WorkContributionRecord[] = []
  const pool = employees.slice(0, 28)
  for (const emp of pool) {
    const process = pick(rng, processes)
    const baselineHours = int(rng, 40, 320)
    const aiContributionPct = int(rng, 15, 65)
    const humanContributionPct = 100 - aiContributionPct
    const actualHumanHours = Math.round(baselineHours * (humanContributionPct / 100) * (int(rng, 85, 100) / 100))
    const accepted = int(rng, 6, 30)
    const edited = int(rng, 0, 6)
    const rejected = int(rng, 0, 2)
    const released = Math.round(baselineHours - actualHumanHours)
    records.push({
      id: nextWorkItemId(),
      employeeId: emp.id, positionId: emp.positionId, sectionId: emp.sectionId, processId: process.id,
      activity: pick(rng, ACTIVITIES), workItem: `${pick(rng, ACTIVITIES)} batch ${int(rng, 1, 40)}`,
      toolOrAgent: pick(rng, ['Microsoft 365 Copilot', 'AGT-D2D-DOC-01', 'AI Platform Copilot', 'Manual']),
      baselineHours, actualHumanHours,
      aiContributionPct, humanContributionPct,
      outputAccepted: accepted, outputEdited: edited, outputRejected: rejected,
      qualityResult: rejected > 0 ? 'PartialPass' : 'Pass',
      verifiedTimeReleasedHours: { value: Math.max(0, released), tag: 'Observed' },
      businessOutcome: pick(rng, ['Faster cycle time', 'Reduced rework', 'Capacity redeployed to higher-value work', 'Improved accuracy']),
      tokenCost: int(rng, 50, 4000),
    })
  }
  return records
}
