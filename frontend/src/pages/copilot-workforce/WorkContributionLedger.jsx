// Work Contribution Ledger — requirements doc Section 12's full field list.
// Route: /copilot-workforce/ledger. The formula-based KPIs on the Copilot &
// Workforce page are computed from exactly this data (lib/calc.ts).
import { useEffect, useState } from 'react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getWorkContribution } from '../../data/mockApi'
import { sectionName } from '../../data/processesAggregates.ts'
import { employeeName, positionTitle, processName } from '../../data/lookups.ts'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { useNavigate } from 'react-router-dom'

const QUALITY_VARIANT = { Pass: 'success', PartialPass: 'warning', Fail: 'error' }

export default function WorkContributionLedger() {
  const navigate = useNavigate()
  const [records, setRecords] = useState(null)
  useEffect(() => { getWorkContribution().then(setRecords) }, [])

  const columns = [
    { key: 'employee', header: 'Employee', width: proportional(1.6, { minWidth: 160 }) },
    { key: 'position', header: 'Position', width: proportional(1.6, { minWidth: 160 }) },
    { key: 'section', header: 'Organization', width: proportional(1.6, { minWidth: 160 }) },
    { key: 'process', header: 'Process', width: proportional(1.6, { minWidth: 160 }) },
    {
      key: 'activity', header: 'Activity / work item', width: proportional(1.8, { minWidth: 180 }),
      renderCell: (row) => (
        <div>
          <Text size="sm" style={{ display: 'block' }}>{row.activity}</Text>
          <Text size="xs" color="secondary">{row.workItem}</Text>
        </div>
      ),
    },
    { key: 'toolOrAgent', header: 'Tool or agent', width: proportional(1.4, { minWidth: 150 }) },
    {
      key: 'hours', header: 'Baseline → actual', width: pixel(130),
      renderCell: (row) => <Text size="sm">{row.baselineHours}h → {row.actualHumanHours}h</Text>,
    },
    {
      key: 'contribution', header: 'AI / human %', width: pixel(120),
      renderCell: (row) => <Text size="sm">AI {row.aiContributionPct}% / H {row.humanContributionPct}%</Text>,
    },
    {
      key: 'output', header: 'Accepted / edited / rejected', width: pixel(150),
      renderCell: (row) => <Text size="sm">{row.outputAccepted} / {row.outputEdited} / {row.outputRejected}</Text>,
    },
    {
      key: 'qualityResult', header: 'Quality', width: pixel(100),
      renderCell: (row) => <Badge label={row.qualityResult} variant={QUALITY_VARIANT[row.qualityResult]} />,
    },
    {
      key: 'verifiedTimeReleasedHours', header: 'Verified time released', width: pixel(140),
      renderCell: (row) => <Text size="sm">{row.verifiedTimeReleasedHours.value}h <ValueTag tag={row.verifiedTimeReleasedHours.tag} /></Text>,
    },
    { key: 'businessOutcome', header: 'Business outcome', width: proportional(1.6, { minWidth: 170 }) },
    { key: 'tokenCost', header: 'Token cost', width: pixel(90) },
  ]

  const rows = (records ?? []).map((r) => ({
    ...r,
    employee: employeeName(r.employeeId) ?? '—',
    position: positionTitle(r.positionId) ?? '—',
    section: sectionName(r.sectionId),
    process: processName(r.processId) ?? '—',
  }))

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Copilot & Workforce" variant="ghost" onClick={() => navigate('/copilot-workforce')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Work Contribution Ledger</Heading>
        <Text color="secondary" size="lg">The evidence behind every AI-work-coverage figure in the app — one row per human/AI work item.</Text>
      </div>

      {!records ? (
        <Skeleton height={480} radius={2} />
      ) : (
        <Card padding={0}>
          <div style={{ overflowX: 'auto' }}>
            <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
          </div>
        </Card>
      )}
    </div>
  )
}
