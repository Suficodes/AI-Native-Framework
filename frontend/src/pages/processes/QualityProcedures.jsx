// Quality Procedures tab — requirements doc Section 6.B: the QP register
// plus a compliance dashboard.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getQualityProcedures } from '../../data/mockApi'
import { sectionName, qpStatusBreakdown, overdueQps, avgQpCoverage } from '../../data/processesAggregates.ts'
import { QP_INDICATOR_LABELS } from '../../data/types'
import { KpiCard } from '../../components/KpiCard.jsx'
import { formatDate } from '../../utils/format.js'
import { ProcessesTabs } from './ProcessesTabs.jsx'

export default function QualityProcedures() {
  const navigate = useNavigate()
  const [qps, setQps] = useState(null)
  useEffect(() => { getQualityProcedures().then(setQps) }, [])

  const columns = [
    {
      key: 'title', header: 'Title', width: proportional(2, { minWidth: 200 }),
      renderCell: (row) => (
        <Text
          weight="medium" color="accent"
          onClick={() => navigate(`/processes/quality-procedures/${row.id}`)}
          style={{ cursor: 'pointer' }}
        >
          {row.title}
        </Text>
      ),
    },
    { key: 'id', header: 'QP ID', width: pixel(90) },
    { key: 'section', header: 'Section owner', width: proportional(1.4, { minWidth: 160 }) },
    { key: 'version', header: 'Version', width: pixel(70) },
    {
      key: 'status', header: 'Status', width: pixel(110),
      renderCell: (row) => <Badge label={row.status} variant={row.status === 'Active' ? 'success' : row.status === 'Expired' ? 'error' : 'neutral'} />,
    },
    {
      key: 'indicator', header: 'Indicator', width: pixel(150),
      renderCell: (row) => <Badge label={`${row.indicator} — ${QP_INDICATOR_LABELS[row.indicator]}`} variant="info" />,
    },
    {
      key: 'coverage', header: 'AI coverage (current / target)', width: pixel(170),
      renderCell: (row) => <Text size="sm">{row.currentAiCoveragePct}% / {row.targetAiCoveragePct}%</Text>,
    },
    {
      key: 'reviewDate', header: 'Review date', width: pixel(110),
      renderCell: (row) => <Text size="sm">{formatDate(row.reviewDate)}</Text>,
    },
  ]

  const rows = (qps ?? []).map((q) => ({ ...q, section: sectionName(q.sectionOwnerId) }))
  const statusBreakdown = qps ? qpStatusBreakdown() : null
  const overdue = qps ? overdueQps() : []
  const coverage = qps ? avgQpCoverage() : { current: 0, target: 0 }

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Processes & Quality Procedures</Heading>
        <Text color="secondary" size="lg">The Quality Procedure register, compliance dashboard, and QP → agent-conversion view.</Text>
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <ProcessesTabs active="quality-procedures" />
      </div>

      {!qps ? (
        <Skeleton height={480} radius={2} />
      ) : (
        <VStack gap={5}>
          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Procedure compliance dashboard</Heading>
            <div className="auto-grid" style={{ '--min': '200px' }}>
              <KpiCard label="Active QPs" value={statusBreakdown.Active} tag="Observed" definition="Quality Procedures currently in Active status." period="Q3 2026" />
              <KpiCard label="Under review" value={statusBreakdown.UnderReview} tag="Observed" definition="Quality Procedures currently under review." period="Q3 2026" />
              <KpiCard label="Overdue reviews" value={overdue.length} tag="Observed" definition="Quality Procedures whose review date has passed and are not retired." period="Q3 2026" />
              <KpiCard label="Avg current AI coverage" value={Math.round(coverage.current)} suffix="%" tag="Estimated" definition="Average currentAiCoveragePct across all Quality Procedures." period="Q3 2026" />
              <KpiCard label="Avg target AI coverage" value={Math.round(coverage.target)} suffix="%" tag="Estimated" definition="Average targetAiCoveragePct across all Quality Procedures." period="Q3 2026" />
            </div>
          </div>

          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>QP register</Heading>
            <Card padding={0}>
              <div style={{ overflowX: 'auto' }}>
                <Table data={rows} columns={columns} idKey="id" hasHover />
              </div>
            </Card>
          </div>
        </VStack>
      )}
    </div>
  )
}
