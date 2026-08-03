// Copilot & Workforce module — requirements doc Section 12. Separates three
// concepts clearly: AI adoption, AI work contribution, AI business value.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Banner } from '@astryxdesign/core/Banner'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getCopilotUsage } from '../../data/mockApi'
import { divisionName } from '../../data/processesAggregates.ts'
import { copilotSummary, workforceSampleResults } from '../../data/copilotAggregates.ts'
import { KpiCard } from '../../components/KpiCard.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'

export default function CopilotWorkforce() {
  const navigate = useNavigate()
  const [copilotUsage, setCopilotUsage] = useState(null)
  useEffect(() => { getCopilotUsage().then(setCopilotUsage) }, [])

  const columns = [
    { key: 'division', header: 'Division', width: proportional(1.8, { minWidth: 180 }) },
    { key: 'eligibleUsers', header: 'Eligible', width: pixel(90) },
    { key: 'licensedUsers', header: 'Licensed', width: pixel(90) },
    { key: 'activeUsers', header: 'Active', width: pixel(90) },
    { key: 'activeDays', header: 'Active days', width: pixel(100) },
    { key: 'adoptionByDivisionPct', header: 'Adoption', width: pixel(90), renderCell: (row) => <Text size="sm">{row.adoptionByDivisionPct}%</Text> },
    { key: 'licenseUtilizationPct', header: 'License util.', width: pixel(100), renderCell: (row) => <Text size="sm">{row.licenseUtilizationPct}%</Text> },
    { key: 'agentUsageCount', header: 'Agent usage', width: pixel(100) },
  ]

  const rows = (copilotUsage ?? []).map((r) => ({ ...r, division: divisionName(r.divisionId) }))
  const summary = copilotUsage ? copilotSummary() : null
  const sample = copilotUsage ? workforceSampleResults() : null

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Copilot & Workforce</Heading>
        <Text color="secondary" size="lg">Microsoft Copilot adoption and the Work Contribution Ledger.</Text>
        <Text color="secondary" size="sm" style={{ display: 'block', marginTop: 'var(--spacing-2)' }}>
          These are adoption and contribution measures. For how GitHub Copilot connects to the
          repositories, what governs it, and where these numbers are pulled from, see{' '}
          <a href="#/version-control">Version Control &amp; GitHub</a>.
        </Text>
      </div>

      {!copilotUsage ? (
        <Skeleton height={480} radius={2} />
      ) : (
        <VStack gap={6}>
          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-1)' }}>1. AI adoption</Heading>
            <Text color="secondary" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
              Who has access to Copilot and how often they use it — not a measure of value on its own.
            </Text>
            <div className="auto-grid" style={{ '--min': '190px', marginBottom: 'var(--spacing-4)' }}>
              <KpiCard label="Eligible users" value={summary.eligibleUsers} tag="Observed" definition="Employees eligible for a Copilot license, summed across divisions." period="Q3 2026" />
              <KpiCard label="Licensed users" value={summary.licensedUsers} tag="Observed" definition="Employees with an active Copilot license." period="Q3 2026" />
              <KpiCard label="Active users" value={summary.activeUsers} tag="Observed" definition="Employees who used Copilot at least once in the period." period="Q3 2026" />
              <KpiCard label="Adoption" value={summary.adoptionPct} suffix="%" tag="Observed" definition="Active users / eligible users." period="Q3 2026" />
              <KpiCard label="License utilization" value={summary.licenseUtilizationPct} suffix="%" tag="Observed" definition="Active users / licensed users." period="Q3 2026" />
            </div>
            <Card padding={0}>
              <div style={{ overflowX: 'auto' }}>
                <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
              </div>
            </Card>
          </div>

          <Banner
            status="warning"
            title="Copilot usage does not independently prove productivity or value."
            description="Verified work contribution is calculated from process and work-item evidence."
          />

          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-1)' }}>2. AI work contribution</Heading>
            <Text color="secondary" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
              Computed from the Work Contribution Ledger's baseline-hours and AI-contribution evidence
              (AI Work Coverage = Σ baseline hours × AI contribution % ÷ Σ baseline hours; Quality-Adjusted
              Coverage = AI Work Coverage × Acceptance Rate × Accuracy Rate).
            </Text>
            <div className="auto-grid" style={{ '--min': '210px', marginBottom: 'var(--spacing-4)' }}>
              <KpiCard label="AI-assisted work coverage" value={sample.aiWorkCoveragePct} suffix="%" tag="Observed" definition="AI Work Coverage formula over the Work Contribution Ledger." period="Q3 2026" />
              <KpiCard label="Quality-adjusted coverage" value={sample.qualityAdjustedCoveragePct} suffix="%" tag="Estimated" definition="AI Work Coverage × Acceptance Rate × Accuracy Rate." period="Q3 2026" />
              <KpiCard label="Verified capacity released" value={sample.verifiedCapacityReleasedHours} suffix=" h" tag="Verified" definition="Sum of verifiedTimeReleasedHours across the ledger." period="Q3 2026" />
              <KpiCard label="Redeployed capacity" value={sample.redeployedCapacityHours} suffix=" h" tag="Observed" definition="Sum of capacityRedeployedHours from human AI-native performance records." period="Q3 2026" />
            </div>
            <DewaButton label="Open Work Contribution Ledger" variant="secondary" onClick={() => navigate('/copilot-workforce/ledger')} />
          </div>

          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-1)' }}>3. AI business value</Heading>
            <Text color="secondary" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
              Adoption and work contribution are inputs — realized business value (benefits, costs, net
              value) is tracked and validated in Value Realization, not fabricated here.
            </Text>
            <DewaButton label="Open Value Realization" variant="ghost" onClick={() => navigate('/value-realization')} />
          </div>
        </VStack>
      )}
    </div>
  )
}
