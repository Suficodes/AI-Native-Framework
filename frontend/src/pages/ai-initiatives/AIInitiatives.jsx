// AI Initiatives module — requirements doc Section 7. Portfolio table +
// Kanban view (toggle), covering the 8 named sample initiatives plus 12
// generated ones (20 total, Section 21).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { ExportButton } from '../../components/ExportButton.jsx'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getAIInitiatives } from '../../data/mockApi'
import { divisionName, sectionName } from '../../data/processesAggregates.ts'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { InitiativeKanbanBoard } from './InitiativeKanbanBoard.jsx'

const STATUS_VARIANT = { OnTrack: 'success', AtRisk: 'warning', Delayed: 'error', Blocked: 'error', Complete: 'neutral' }
const RISK_VARIANT = { Low: 'success', Medium: 'warning', High: 'error' }

export default function AIInitiatives() {
  const navigate = useNavigate()
  const [initiatives, setInitiatives] = useState(null)
  const [view, setView] = useState('portfolio')
  useEffect(() => { getAIInitiatives().then(setInitiatives) }, [])

  const columns = [
    {
      key: 'title', header: 'Initiative', width: proportional(2.2, { minWidth: 200 }),
      renderCell: (row) => (
        <Text
          weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => navigate(`/ai-initiatives/${row.id}`)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/ai-initiatives/${row.id}`) } }}
        >
          {row.title}
        </Text>
      ),
    },
    { key: 'division', header: 'Division', width: proportional(1.6, { minWidth: 160 }) },
    { key: 'section', header: 'Section', width: proportional(1.4, { minWidth: 140 }) },
    { key: 'stage', header: 'Stage', width: pixel(110), renderCell: (row) => <Badge label={row.stage} variant="info" /> },
    { key: 'status', header: 'Status', width: pixel(90), renderCell: (row) => <Badge label={row.status} variant={STATUS_VARIANT[row.status]} /> },
    { key: 'aiType', header: 'AI type', width: pixel(120) },
    { key: 'agenticityTarget', header: 'Target', width: pixel(70), renderCell: (row) => <Badge label={row.agenticityTarget} variant="neutral" /> },
    { key: 'riskLevel', header: 'Risk', width: pixel(80), renderCell: (row) => <Badge label={row.riskLevel} variant={RISK_VARIANT[row.riskLevel]} /> },
    {
      key: 'realizedValue', header: 'Realized value', width: pixel(150),
      renderCell: (row) => <Text size="sm"><Aed aed={row.realizedValue.value} compact /> <ValueTag tag={row.realizedValue.tag} /></Text>,
    },
  ]

  const rows = (initiatives ?? []).map((i) => ({ ...i, division: divisionName(i.divisionId), section: sectionName(i.sectionId) }))

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">AI Initiatives</Heading>
        <Text color="secondary" size="lg">Portfolio and Kanban across the 11 delivery stages, from Idea to Retired.</Text>
        <div style={{ marginTop: 'var(--spacing-3)' }}>
          <ExportButton filename="initiatives" columns={[{key:'id',header:'ID'},{key:'title',header:'Initiative'},{key:'division',header:'Division'},{key:'stage',header:'Stage'},{key:'status',header:'Status'},{key:'riskLevel',header:'Risk'}]} rows={rows} />
        </div>
      </div>

      {!initiatives ? (
        <Skeleton height={480} radius={2} />
      ) : (
        <>
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <SegmentedControl value={view} onChange={setView} label="View">
              <SegmentedControlItem value="portfolio" label="Portfolio" />
              <SegmentedControlItem value="kanban" label="Kanban" />
            </SegmentedControl>
          </div>

          {view === 'portfolio' ? (
            <Card padding={0}>
              <div style={{ overflowX: 'auto' }}>
                <Table data={rows} columns={columns} idKey="id" hasHover />
              </div>
            </Card>
          ) : (
            <InitiativeKanbanBoard initiatives={rows} />
          )}
        </>
      )}
    </div>
  )
}
