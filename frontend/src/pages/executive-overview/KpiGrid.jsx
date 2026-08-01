// The 16 Executive Overview KPI cards (requirements doc Section 4).
import { KpiCard } from '../../components/KpiCard.jsx'
import { computeExecutiveKpis } from '../../data/executiveAggregates'
import { AGENTICITY_LABELS } from '../../data/types'

export function KpiGrid() {
  const k = computeExecutiveKpis()
  return (
    <div className="auto-grid" style={{ '--min': '230px' }}>
      <KpiCard label="Total Employees" value={k.totalEmployees} tag="Observed"
        definition="Total headcount across all positions." source="Organization master" drillDownTo="/organization" />
      <KpiCard label="Human-only Roles" value={k.humanOnly} tag="Observed"
        definition="Positions with no material AI involvement." source="Positions register" drillDownTo="/organization" />
      <KpiCard label="Human + Copilot Roles" value={k.humanPlusCopilot} tag="Observed"
        definition="Positions where AI supports drafting/analysis; human owns the output." source="Positions register" drillDownTo="/organization" />
      <KpiCard label="Human + Agent Roles" value={k.humanPlusAgent} tag="Observed"
        definition="Positions paired with a managed agent." source="Positions register" drillDownTo="/organization" />
      <KpiCard label="Agent-only Digital Employees" value={k.agentOnly} tag="Observed"
        definition="Positions executed entirely by an agent within an approved boundary." source="Positions register" drillDownTo="/organization" />
      <KpiCard label="Active AI Agents" value={k.activeAgents} tag="Observed"
        definition="Agents currently in Active status." source="Digital Employee Registry" drillDownTo="/agents" />
      <KpiCard label="Processes Assessed" value={k.processesAssessed} tag="Observed"
        definition="Processes with a recorded agenticity assessment." source="Process register" drillDownTo="/processes/agenticity" />
      <KpiCard label="Average Process Agenticity" value={k.avgAgenticityLabel} tag="Estimated"
        definition={`Mean current agenticity level across assessed processes. ${k.avgAgenticityLabel}: ${AGENTICITY_LABELS[k.avgAgenticityLabel]}`}
        source="Process register" drillDownTo="/processes/agenticity" />
      <KpiCard label="Active AI Initiatives" value={k.activeInitiatives} tag="Observed"
        definition="Initiatives in Build, Evaluation, Probation, Production, or Scaling." source="AI Initiative portfolio" drillDownTo="/ai-initiatives" />
      <KpiCard label="Validated Annual Value" value={k.validatedAnnualValue} currency compact tag="Validated"
        definition="Net benefit from VR records in Realized or Closed status." source="Value Realization ledger" drillDownTo="/value-realization" />
      <KpiCard label="Total AI Cost" value={k.totalAiCost} currency compact tag="Observed"
        definition="Sum of agent operating cost across the registry." source="Digital Employee Registry" drillDownTo="/token-economics" />
      <KpiCard label="Useful Intelligence per AED" value={k.usefulIntelligencePerAed} format={{ maximumFractionDigits: 2 }} tag="Estimated"
        definition="Successful business outcomes divided by total AI cost." source="VR ledger ÷ Agent cost" drillDownTo="/value-realization" />
      <KpiCard label="Total Token Consumption" value={k.totalTokens} tag="Observed"
        definition="Sum of token consumption across all agents." source="Token Economics" drillDownTo="/token-economics" />
      <KpiCard label="High-Risk Agents" value={k.highRiskAgents} tag="Observed"
        definition="Agents Restricted or with human override rate above 25%." source="Digital Employee Registry" drillDownTo="/agents" />
      <KpiCard label="Quality Procedure Compliance" value={k.qpCompliancePct} suffix="%" tag="Observed"
        definition="Average current AI coverage across Active Quality Procedures." source="QP register" drillDownTo="/processes/quality-procedures" />
      <KpiCard label="Verified Capacity Released" value={k.verifiedCapacityReleasedHours} suffix=" h" tag="Verified"
        definition="Verified human hours released across the Work Contribution Ledger." source="Work Contribution Ledger" drillDownTo="/copilot-workforce/ledger" />
    </div>
  )
}
