// The Section 15 budget controls, per agent: annual and monthly budget,
// per-transaction limit, retry limit, approved models, alert level and
// suspension threshold — beside the run-rate actually observed.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { dataset } from '../../data/mockApi'
import { Aed } from '../../dewa/Aed.jsx'

export function BudgetControlsTable({ rows }) {
  const navigate = useNavigate()
  const breached = rows.filter((r) => r.breached)

  const withControls = rows.map((row) => ({
    ...row,
    control: dataset.budgetControls.find((b) => b.agentId === row.agentId),
  }))

  const columns = [
    {
      key: 'agent',
      header: 'Agent',
      width: proportional(2, { minWidth: 190 }),
      renderCell: (row) => (
        <Text
          size="sm" weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/agents/${row.agentId}`)}
        >
          {row.agent}
        </Text>
      ),
    },
    { key: 'annualBudget', header: 'Annual budget', width: pixel(130), renderCell: (row) => <Text size="sm"><Aed aed={row.annualBudget} compact /></Text> },
    { key: 'monthlyBudget', header: 'Monthly', width: pixel(110), renderCell: (row) => <Text size="sm"><Aed aed={row.control?.monthlyBudget ?? 0} compact /></Text> },
    { key: 'annualizedSpend', header: 'Annualized spend', width: pixel(150), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.annualizedSpend} compact /></Text> },
    { key: 'variance', header: 'Variance', width: pixel(120), renderCell: (row) => <Text size="sm" color={row.variance < 0 ? 'secondary' : 'accent'}><Aed aed={row.variance} compact signed /></Text> },
    {
      key: 'consumptionPct',
      header: 'Consumption',
      width: pixel(170),
      renderCell: (row) => (
        <ProgressBar
          value={Math.min(100, row.consumptionPct)}
          label={`${row.consumptionPct}%`}
          hasValueLabel
          variant={row.consumptionPct >= 100 ? 'error' : row.consumptionPct >= row.alertLevelPct ? 'warning' : 'success'}
        />
      ),
    },
    { key: 'perTransactionLimit', header: 'Per-call limit', width: pixel(120), renderCell: (row) => <Text size="sm"><Aed aed={row.control?.perTransactionLimit ?? 0} /></Text> },
    { key: 'retryLimit', header: 'Retry limit', width: pixel(100), renderCell: (row) => <Text size="sm" className="mono">{row.control?.retryLimit ?? '—'}</Text> },
    {
      key: 'approvedModels',
      header: 'Approved models',
      width: proportional(1.8, { minWidth: 190 }),
      renderCell: (row) => (
        <VStack gap={1}>
          {(row.control?.approvedModels ?? []).map((model) => (
            <Text key={model} size="sm" color="secondary" style={{ display: 'block' }}>{model}</Text>
          ))}
        </VStack>
      ),
    },
    {
      key: 'thresholds',
      header: 'Alert / suspend',
      width: pixel(130),
      renderCell: (row) => (
        <Text size="sm" color="secondary" className="mono">
          {row.alertLevelPct}% / {row.control?.suspensionThresholdPct ?? 100}%
        </Text>
      ),
    },
  ]

  return (
    <VStack gap={4}>
      {breached.length > 0 ? (
        <Banner
          status="warning"
          title={`${breached.length} agent${breached.length === 1 ? '' : 's'} past the alert level`}
          description="At the alert threshold the business owner is notified; at the suspension threshold the agent stops. Annualized spend is the run-rate over the months the ledger covers."
        />
      ) : (
        <Banner
          status="success"
          title="Every agent is inside its approved budget"
          description="No agent's annualized spend has reached its alert level this period."
        />
      )}
      <Card padding={0}>
        <div style={{ overflowX: 'auto' }}>
          <Table data={withControls} columns={columns} idKey="agentId" hasHover density="balanced" />
        </div>
      </Card>
    </VStack>
  )
}
