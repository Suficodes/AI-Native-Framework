// <KpiCard> — the shared KPI primitive used across every module (Executive
// Overview alone needs 16). Per the UX section of the requirements doc,
// every KPI needs a definition, source, and reporting period (shown in an
// info HoverCard) plus a drill-down affordance, and every important value
// must carry an Estimated/Observed/Verified/Validated tag.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { HoverCard } from '@astryxdesign/core/HoverCard'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { useNavigate } from 'react-router-dom'
import { Metric } from '../dewa/Metric.jsx'
import { Aed } from '../dewa/Aed.jsx'
import { ValueTag } from '../dewa/ValueTag.jsx'

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 8v.01" />
  </svg>
)

/**
 * `currency` renders the value as money with the real dirham glyph via <Aed>,
 * which is what CONVENTIONS.md requires of every money figure — a `prefix="AED "`
 * string is a violation, not a shortcut. Use `compact` for large amounts.
 */
export function KpiCard({
  label, value, format, suffix, prefix, sub, tag, definition, source, period = 'Q3 2026',
  drillDownTo, trend, currency = false, compact = false, decimals = 0,
}) {
  const navigate = useNavigate()
  const clickable = Boolean(drillDownTo)
  return (
    <Card
      padding={4}
      onClick={clickable ? () => navigate(drillDownTo) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(drillDownTo) } } : undefined}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      <VStack gap={2}>
        <HStack align="center" justify="between">
          <Text size="sm" color="secondary" weight="medium">{label}</Text>
          {definition && (
            <HoverCard
              placement="above"
              content={
                <div style={{ width: 240 }}>
                  <MetadataList columns="single">
                    <MetadataListItem label="Definition">{definition}</MetadataListItem>
                    {source && <MetadataListItem label="Source">{source}</MetadataListItem>}
                    <MetadataListItem label="Period">{period}</MetadataListItem>
                  </MetadataList>
                </div>
              }
            >
              <span style={{ display: 'inline-flex', color: 'var(--color-text-secondary)', cursor: 'help' }}>
                <InfoIcon />
              </span>
            </HoverCard>
          )}
        </HStack>
        <div className="kpi-value">
          {currency && typeof value === 'number' ? (
            <Aed aed={value} compact={compact} decimals={decimals} animated />
          ) : typeof value === 'number' ? (
            <Metric value={value} format={format} suffix={suffix} prefix={prefix} trend={trend} />
          ) : (
            <span>{prefix}{value}{suffix}</span>
          )}
        </div>
        <HStack align="center" justify="between">
          {sub && <Text size="sm" color="secondary">{sub}</Text>}
          {tag && <ValueTag tag={tag} />}
        </HStack>
      </VStack>
    </Card>
  )
}
