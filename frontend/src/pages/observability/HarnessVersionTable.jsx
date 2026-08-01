// Harness-version comparison (Section 16). The question a release decision
// turns on is whether the current version made quality better, so the current
// and previous release sit next to the evaluation average and the failure rate
// actually observed in production.
import { useNavigate } from 'react-router-dom'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'

const STATUS_VARIANT = {
  Development: 'neutral', TechnicalTesting: 'info', BusinessEvaluation: 'info',
  RiskReview: 'warning', Probation: 'warning', Production: 'success', ScaleApproved: 'success',
}

export function HarnessVersionTable({ rows }) {
  const navigate = useNavigate()

  const columns = [
    {
      key: 'name',
      header: 'Harness',
      width: proportional(2, { minWidth: 200 }),
      renderCell: (row) => (
        <VStack gap={1}>
          <Text
            size="sm" weight="medium" color="accent" role="button" tabIndex={0}
            style={{ cursor: 'pointer', display: 'block' }}
            onClick={() => navigate(`/harness-engineering/${row.harnessId}`)}
          >
            {row.name}
          </Text>
          <Badge label={row.status} variant={STATUS_VARIANT[row.status] ?? 'neutral'} />
        </VStack>
      ),
    },
    { key: 'currentRelease', header: 'Current release', width: proportional(1.5, { minWidth: 160 }), renderCell: (row) => <Text size="sm" className="mono">{row.currentRelease}</Text> },
    { key: 'previousRelease', header: 'Previous', width: proportional(1.5, { minWidth: 150 }), renderCell: (row) => <Text size="sm" color="secondary" className="mono">{row.previousRelease}</Text> },
    {
      key: 'evalAverage',
      header: 'Eval average',
      width: pixel(120),
      renderCell: (row) => (
        <Badge label={`${row.evalAverage}%`} variant={row.evalAverage >= 90 ? 'success' : row.evalAverage >= 80 ? 'warning' : 'error'} />
      ),
    },
    { key: 'weakestCriterion', header: 'Weakest criterion', width: proportional(1.8, { minWidth: 190 }), renderCell: (row) => <Text size="sm" color="secondary">{row.weakestCriterion}</Text> },
    { key: 'observedRuns', header: 'Runs', width: pixel(80), renderCell: (row) => <Text size="sm" className="mono">{row.observedRuns}</Text> },
    {
      key: 'observedFailureRatePct',
      header: 'Failure rate',
      width: pixel(110),
      renderCell: (row) => (
        <Text size="sm" className="mono" color={row.observedFailureRatePct > 10 ? 'primary' : 'secondary'}>
          {row.observedFailureRatePct}%
        </Text>
      ),
    },
    { key: 'guardrails', header: 'Guardrails', width: pixel(100), renderCell: (row) => <Text size="sm" className="mono">{row.guardrails}</Text> },
    {
      key: 'killSwitchEnabled',
      header: 'Kill switch',
      width: pixel(110),
      renderCell: (row) => <Badge label={row.killSwitchEnabled ? 'Enabled' : 'Off'} variant={row.killSwitchEnabled ? 'success' : 'error'} />,
    },
    { key: 'latestNotes', header: 'Release notes', width: proportional(2.2, { minWidth: 220 }), renderCell: (row) => <Text size="sm" color="secondary">{row.latestNotes}</Text> },
  ]

  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows} columns={columns} idKey="harnessId" hasHover density="balanced" textOverflow="wrap" />
      </div>
    </Card>
  )
}
