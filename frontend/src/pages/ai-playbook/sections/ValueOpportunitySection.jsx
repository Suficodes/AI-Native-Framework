// Playbook section 11 — value opportunity. Deliberately shows the three
// different kinds of number side by side with their tags, so an estimated
// process opportunity is never read as validated benefit.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { Aed } from '../../../dewa/Aed.jsx'
import { ValueTag } from '../../../dewa/ValueTag.jsx'
import { DewaButton } from '../../../dewa/DewaButton.jsx'

const BENEFIT_LABELS = {
  CostAvoidance: 'Cost avoidance', Productivity: 'Productivity', RevenueProtection: 'Revenue protection',
  RevenueGeneration: 'Revenue generation', CycleTimeReduction: 'Cycle-time reduction', Quality: 'Quality',
  Compliance: 'Compliance', RiskReduction: 'Risk reduction', CustomerExperience: 'Customer experience',
  EmployeeExperience: 'Employee experience', Sustainability: 'Sustainability', StrategicCapability: 'Strategic capability',
}

function ValueCard({ label, amount, tag, note }) {
  return (
    <Card padding={4}>
      <VStack gap={2}>
        <Text size="sm" color="secondary" weight="medium">{label}</Text>
        <div className="kpi-value"><Aed aed={amount} compact /></div>
        <HStack justify="between" align="center">
          <Text size="sm" color="secondary">{note}</Text>
          <ValueTag tag={tag} />
        </HStack>
      </VStack>
    </Card>
  )
}

export function ValueOpportunitySection({ playbook }) {
  const navigate = useNavigate()
  const value = playbook.valueOpportunity

  const columns = [
    { key: 'type', header: 'Benefit type', width: proportional(2, { minWidth: 200 }), renderCell: (row) => <Text size="sm">{BENEFIT_LABELS[row.type] ?? row.type}</Text> },
    { key: 'amount', header: 'Gross benefit', width: pixel(160), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.amount} compact /></Text> },
  ]

  return (
    <VStack gap={4}>
      <div className="auto-grid" style={{ '--min': '230px' }}>
        <ValueCard label="Unrealized process opportunity" amount={value.processOpportunity.value} tag={value.processOpportunity.tag} note="Sum of step-level opportunity" />
        <ValueCard label="Expected value in the pipeline" amount={value.initiativeExpectedValue.value} tag={value.initiativeExpectedValue.tag} note="Across in-scope AI initiatives" />
        <ValueCard label="Validated net benefit" amount={value.realizedNetBenefit.value} tag={value.realizedNetBenefit.tag} note="VR records, benefit less AI cost" />
        <ValueCard label="Total AI cost booked" amount={value.totalAiCost} tag="Verified" note={`Benefit realization ${value.benefitRealizationPct}%`} />
      </div>

      {value.byBenefitType.length > 0 && (
        <Card padding={0}>
          <div style={{ overflowX: 'auto' }}>
            <Table data={value.byBenefitType} columns={columns} idKey="type" hasHover density="compact" />
          </div>
        </Card>
      )}

      <div>
        <DewaButton label="Open Value Realization" variant="secondary" onClick={() => navigate('/value-realization')} />
      </div>
    </VStack>
  )
}
