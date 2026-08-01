// One generic register renders all 18 tabular Administration screens from
// their config in adminScreens.js — search, CSV export and a responsive table,
// with no per-screen component.
import { useMemo, useState } from 'react'
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { TextInput } from '@astryxdesign/core/TextInput'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { downloadCsv } from '../../utils/exportCsv.js'

/** Status-ish values get a badge; the palette is shared with the rest of the app. */
const BADGE_VARIANT = {
  Active: 'success', Healthy: 'success', Production: 'success', ScaleApproved: 'success',
  Approved: 'success', OnTrack: 'success', Low: 'success', Standard: 'success',
  Draft: 'neutral', Retired: 'neutral', Development: 'neutral', Frontier: 'neutral',
  UnderReview: 'warning', Probation: 'warning', RiskReview: 'warning', Degraded: 'warning',
  AtRisk: 'warning', Medium: 'warning', Small: 'info', Evaluation: 'info',
  TechnicalTesting: 'info', BusinessEvaluation: 'info', Complete: 'info',
  Expired: 'error', Suspended: 'error', Restricted: 'error', Delayed: 'error',
  Blocked: 'error', High: 'error',
}

export function AdminRegister({ screen }) {
  const [query, setQuery] = useState('')
  const allRows = useMemo(() => screen.rows(), [screen])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(q)))
  }, [allRows, query])

  const columns = screen.columns.map((col) => ({
    key: col.key,
    header: col.header,
    width: col.width ? pixel(col.width) : proportional(col.flex ?? 1, { minWidth: 120 }),
    renderCell: (row) => (
      col.badge
        ? <Badge label={String(row[col.key])} variant={BADGE_VARIANT[row[col.key]] ?? 'neutral'} />
        : <Text size="sm" className={col.mono ? 'mono' : undefined}>{String(row[col.key] ?? '—')}</Text>
    ),
  }))

  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Text color="secondary" size="sm">{screen.description}</Text>
      </VStack>

      <HStack gap={3} align="center" justify="between" style={{ flexWrap: 'wrap' }}>
        <HStack gap={3} align="center" style={{ flexWrap: 'wrap' }}>
          <TextInput
            label={`Search ${screen.label}`} isLabelHidden size="sm" width={280}
            placeholder={`Search ${screen.label.toLowerCase()}…`} value={query} onChange={setQuery}
          />
          <Badge label={`${rows.length} of ${allRows.length} records`} variant="neutral" />
        </HStack>
        <HStack gap={2} align="center">
          <Badge label="Read-only" variant="info" />
          <DewaButton
            label="Export CSV"
            variant="secondary"
            onClick={() => downloadCsv(`${screen.slug}.csv`, screen.columns.map((c) => ({ key: c.key, header: c.header })), rows)}
          />
        </HStack>
      </HStack>

      {rows.length === 0 ? (
        <EmptyState title="No matching records" description={`Nothing in ${screen.label} matches “${query}”.`} />
      ) : (
        <Card padding={0}>
          <div style={{ overflowX: 'auto' }}>
            <Table data={rows} columns={columns} idKey={screen.idKey} hasHover density="compact" />
          </div>
        </Card>
      )}
    </VStack>
  )
}
