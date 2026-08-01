// Value Realization aggregates (requirements doc Section 14). Every money
// figure runs through lib/calc.ts's implementations of the doc's four named
// formulas — Net Value, AI Value Realization %, Cost per Verified Hour
// Released, Useful Intelligence per AED — rather than being recomputed inline.
import { dataset } from './mockApi'
import {
  aiValueRealizationPct, costPerVerifiedHourReleased, netValue,
  usefulIntelligencePerAed, verifiedCapacityReleasedHours,
} from '../lib/calc'
import type { BenefitCategory, CostCategory, ID, VRRecord, VrStage } from './types'
import { VR_STAGE_ORDER } from './types'

export const BENEFIT_LABELS: Record<BenefitCategory, string> = {
  CostAvoidance: 'Cost avoidance', Productivity: 'Productivity',
  RevenueProtection: 'Revenue protection', RevenueGeneration: 'Revenue generation',
  CycleTimeReduction: 'Cycle-time reduction', Quality: 'Quality', Compliance: 'Compliance',
  RiskReduction: 'Risk reduction', CustomerExperience: 'Customer experience',
  EmployeeExperience: 'Employee experience', Sustainability: 'Sustainability',
  StrategicCapability: 'Strategic capability',
}

export const COST_LABELS: Record<CostCategory, string> = {
  ModelAndTokenCost: 'Model and token cost', SoftwareLicenses: 'Software licenses',
  Infrastructure: 'Infrastructure', Integration: 'Integration', Development: 'Development',
  DataPreparation: 'Data preparation', Testing: 'Testing', Security: 'Security',
  ChangeManagement: 'Change management', HumanSupervision: 'Human supervision',
  SupportAndMaintenance: 'Support and maintenance',
}

export const VR_STAGE_LABELS: Record<VrStage, string> = {
  Draft: 'Draft', BusinessValidation: 'Business validation', FinanceValidation: 'Finance validation',
  BPIValidation: 'BPI validation', PMOValidation: 'PMO validation', Approved: 'Approved',
  PostGoLiveTracking: 'Post-go-live tracking', Realized: 'Realized', Closed: 'Closed',
}

/** A benefit counts as validated once it has cleared the four validation gates. */
const VALIDATED_STAGES = new Set<VrStage>(['Approved', 'PostGoLiveTracking', 'Realized', 'Closed'])
export const isValidated = (record: VRRecord) => VALIDATED_STAGES.has(record.validationStatus)

const round1 = (n: number) => Math.round(n * 10) / 10
export const totalCostOf = (record: VRRecord) => record.aiCost.reduce((s, line) => s + line.amount, 0)

// ─────────────────────────── Portfolio ───────────────────────────

export interface VRRow extends VRRecord {
  initiativeTitle: string
  divisionId: ID
  divisionName: string
  agentName: string | null
  harnessName: string | null
  totalCost: number
}

export function vrRows(): VRRow[] {
  return dataset.vrRecords.map((record) => {
    const initiative = dataset.aiInitiatives.find((i) => i.id === record.aiInitiativeId)
    const division = dataset.orgNodes.find((n) => n.id === initiative?.divisionId)
    return {
      ...record,
      initiativeTitle: initiative?.title ?? record.aiInitiativeId,
      divisionId: initiative?.divisionId ?? '',
      divisionName: division?.name ?? 'Unassigned',
      agentName: dataset.agents.find((a) => a.id === record.agentId)?.name ?? null,
      harnessName: dataset.harnesses.find((h) => h.id === record.harnessId)?.name ?? null,
      totalCost: totalCostOf(record),
    }
  })
}

export function vrRow(vrId: ID): VRRow | undefined {
  return vrRows().find((r) => r.id === vrId)
}

// ─────────────────────────── Executive analytics ───────────────────────────

/** The eleven figures Section 14's executive dashboard asks for. */
export function vrPortfolioSummary() {
  const records = dataset.vrRecords
  const validated = records.filter(isValidated)
  const unvalidated = records.filter((r) => !isValidated(r))

  const expectedBenefit = records.reduce((s, r) => s + r.target, 0)
  const realizedBenefit = records.reduce((s, r) => s + r.grossBenefit, 0)
  const validatedBenefit = validated.reduce((s, r) => s + r.grossBenefit, 0)
  const unvalidatedBenefit = unvalidated.reduce((s, r) => s + r.grossBenefit, 0)
  const totalAiCost = records.reduce((s, r) => s + totalCostOf(r), 0)

  // Successful outcomes = validated records that met or beat their target —
  // the numerator the doc's Useful Intelligence per AED formula expects.
  const successfulOutcomes = validated.filter((r) => r.actualResult >= r.target).length
  const verifiedHours = verifiedCapacityReleasedHours(dataset.workContribution)

  return {
    recordCount: records.length,
    expectedBenefit,
    realizedBenefit,
    validatedBenefit,
    unvalidatedBenefit,
    totalAiCost,
    netValue: netValue(validatedBenefit, totalAiCost),
    valueRealizationPct: round1(aiValueRealizationPct(validatedBenefit, expectedBenefit)),
    costPerVerifiedHourReleased: round1(costPerVerifiedHourReleased(totalAiCost, verifiedHours)),
    usefulIntelligencePerAed: usefulIntelligencePerAed(successfulOutcomes, totalAiCost || 1),
    costPerOutcome: successfulOutcomes === 0 ? 0 : Math.round(totalAiCost / successfulOutcomes),
    successfulOutcomes,
    verifiedHoursReleased: Math.round(verifiedHours),
  }
}

export function valueByDivision() {
  const rows = vrRows()
  const divisions = dataset.orgNodes.filter((n) => n.level === 'Division')
  return divisions.flatMap((division) => {
    const inDivision = rows.filter((r) => r.divisionId === division.id)
    if (inDivision.length === 0) return []
    return [{
      division: division.name.replace(' Division', ''),
      benefit: inDivision.reduce((s, r) => s + r.grossBenefit, 0),
      cost: inDivision.reduce((s, r) => s + r.totalCost, 0),
      net: inDivision.reduce((s, r) => s + r.netBenefit, 0),
    }]
  })
}

export function valueByAgent() {
  const rows = vrRows().filter((r) => r.agentName != null)
  const byAgent = new Map<string, number>()
  for (const row of rows) byAgent.set(row.agentName!, (byAgent.get(row.agentName!) ?? 0) + row.netBenefit)
  return [...byAgent.entries()]
    .map(([agent, net]) => ({ agent, net }))
    .sort((a, b) => b.net - a.net)
}

export function valueByStrategicObjective() {
  return dataset.strategicObjectives.flatMap((objective) => {
    const initiativeIds = new Set(
      dataset.aiInitiatives.filter((i) => i.strategicObjectiveId === objective.id).map((i) => i.id),
    )
    const records = dataset.vrRecords.filter((r) => initiativeIds.has(r.aiInitiativeId))
    if (records.length === 0) return []
    return [{ objective: objective.name, net: records.reduce((s, r) => s + r.netBenefit, 0) }]
  }).sort((a, b) => b.net - a.net)
}

export function valueByBenefitType() {
  const byType = new Map<BenefitCategory, number>()
  for (const record of dataset.vrRecords) {
    byType.set(record.benefitType, (byType.get(record.benefitType) ?? 0) + record.grossBenefit)
  }
  return [...byType.entries()]
    .map(([type, benefit]) => ({ type, label: BENEFIT_LABELS[type], benefit }))
    .sort((a, b) => b.benefit - a.benefit)
}

export function costByCategory() {
  const byCategory = new Map<CostCategory, number>()
  for (const record of dataset.vrRecords) {
    for (const line of record.aiCost) {
      byCategory.set(line.category, (byCategory.get(line.category) ?? 0) + line.amount)
    }
  }
  return [...byCategory.entries()]
    .map(([category, amount]) => ({ category, label: COST_LABELS[category], amount }))
    .sort((a, b) => b.amount - a.amount)
}

/** The 9-stage approval workflow as a funnel — how many records sit at each gate. */
export function validationFunnel() {
  return VR_STAGE_ORDER.map((stage) => ({
    stage,
    label: VR_STAGE_LABELS[stage],
    count: dataset.vrRecords.filter((r) => r.validationStatus === stage).length,
  }))
}

/** Baseline → target → actual for every record, for the Baselines tab. */
export function baselineComparison() {
  return vrRows().map((row) => ({
    id: row.id,
    initiative: row.initiativeTitle,
    baselinePeriod: row.baselinePeriod,
    baseline: row.baselineValue,
    target: row.target,
    actual: row.actualResult,
    // Improvement against the baseline, which is what the business case promised.
    upliftPct: row.baselineValue === 0 ? 0 : round1(((row.actualResult - row.baselineValue) / row.baselineValue) * 100),
    realizationPct: row.benefitRealizationPct,
  }))
}

/** Post-go-live: only records that have actually gone live are tracked. */
export function postGoLiveRecords(): VRRow[] {
  return vrRows().filter(
    (r) => r.validationStatus === 'PostGoLiveTracking' || r.validationStatus === 'Realized' || r.validationStatus === 'Closed',
  )
}

/** The business case: expected vs realized per initiative, with the delivery stage. */
export function businessCaseRows() {
  return vrRows().map((row) => {
    const initiative = dataset.aiInitiatives.find((i) => i.id === row.aiInitiativeId)
    return {
      id: row.id,
      initiativeId: row.aiInitiativeId,
      initiative: row.initiativeTitle,
      stage: initiative?.stage ?? '—',
      expectedValue: initiative?.expectedValue.value ?? 0,
      target: row.target,
      actualResult: row.actualResult,
      netBenefit: row.netBenefit,
      totalCost: row.totalCost,
      roiPct: row.totalCost === 0 ? 0 : round1((row.netBenefit / row.totalCost) * 100),
      validationStatus: row.validationStatus,
    }
  })
}
