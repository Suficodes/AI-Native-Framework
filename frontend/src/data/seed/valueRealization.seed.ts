// 15 Value Realization records (Section 21), spanning the 9-stage approval
// workflow (Draft -> ... -> Closed). netBenefit/benefitRealizationPct are
// computed here the same way lib/calc.ts computes them at render time, so
// seed data and the UI's live formulas never disagree.
import type { AIInitiative, BenefitCategory, CostCategory, Employee, VRRecord, VrStage } from '../types'
import { VR_STAGE_ORDER } from '../types'
import { nextVrId } from '../ids'
import { type Rng, int, pick } from '../rng'

const BENEFIT_TYPES: BenefitCategory[] = ['CostAvoidance', 'Productivity', 'RevenueProtection', 'RevenueGeneration', 'CycleTimeReduction', 'Quality', 'Compliance', 'RiskReduction', 'CustomerExperience', 'EmployeeExperience', 'Sustainability', 'StrategicCapability']
const COST_CATEGORIES: CostCategory[] = ['ModelAndTokenCost', 'SoftwareLicenses', 'Infrastructure', 'Integration', 'Development', 'DataPreparation', 'Testing', 'Security', 'ChangeManagement', 'HumanSupervision', 'SupportAndMaintenance']

export function buildValueRealization(rng: Rng, initiatives: AIInitiative[], employees: Employee[]): VRRecord[] {
  const chosen = initiatives.slice(0, 15)
  return chosen.map((init) => {
    const baselineValue = int(rng, 50_000, 400_000)
    const target = Math.round(baselineValue * (int(rng, 110, 180) / 100))
    const stage = pick(rng, VR_STAGE_ORDER)
    const maturity = VR_STAGE_ORDER.indexOf(stage) / (VR_STAGE_ORDER.length - 1)
    const actualResult = Math.round(target * (0.3 + maturity * 0.75) * (int(rng, 85, 110) / 100))
    const grossBenefit = actualResult
    const costLines = COST_CATEGORIES
      .filter(() => rng() < 0.5)
      .map((category) => ({ category, amount: int(rng, 2_000, 40_000) }))
    if (costLines.length === 0) costLines.push({ category: 'ModelAndTokenCost', amount: int(rng, 5_000, 20_000) })
    const totalCost = costLines.reduce((s, c) => s + c.amount, 0)
    const netBenefit = grossBenefit - totalCost
    const benefitRealizationPct = Math.round((actualResult / target) * 100)

    return {
      id: nextVrId(), aiInitiativeId: init.id, d2dDemandId: init.d2dDemandId,
      agentId: init.agentOwnerId, harnessId: undefined,
      businessOwnerId: init.businessOwnerId, benefitOwnerId: init.businessOwnerId,
      financeValidatorId: pick(rng, employees).id, bpiValidatorId: pick(rng, employees).id, pmoValidatorId: pick(rng, employees).id,
      baselinePeriod: 'Q4-2025', baselineValue, target, actualResult,
      benefitType: pick(rng, BENEFIT_TYPES),
      measurementMethod: 'Baseline vs actual, validated against system-of-record data.',
      evidence: ['Baseline capture report', 'Post-go-live performance export', 'Finance validation memo'],
      grossBenefit, aiCost: costLines, netBenefit, benefitRealizationPct,
      validationStatus: stage, reviewPeriod: 'Q3-2026',
    }
  })
}
