// The Section 15 drill-down: Enterprise → Division → Department → Process →
// Agent → Harness → Skill → Model → Transaction, one level at a time with a
// breadcrumb back up.
//
// Because the ledger is generated bottom-up, the children shown here always sum
// to the row above them — except at the Transaction level, which is an explicit
// sample of individual calls and says so.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { ancestryOf, childrenOf, childrenAreSample } from '../../data/tokenAggregates.ts'
import { formatNumber } from '../../utils/format.js'
import { Aed } from '../../dewa/Aed.jsx'

function Breadcrumb({ chain, onSelect }) {
  return (
    <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
      {chain.map((row, i) => (
        <HStack key={row.id} gap={2} align="center">
          {i > 0 && <Text size="sm" color="secondary">›</Text>}
          {i === chain.length - 1 ? (
            <Text size="sm" weight="semibold">{row.refLabel}</Text>
          ) : (
            <Text
              size="sm" color="accent" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
              onClick={() => onSelect(row.id)}
            >
              {row.refLabel}
            </Text>
          )}
        </HStack>
      ))}
    </HStack>
  )
}

export function TokenHierarchy({ rowId, onSelect, onOpenTransaction }) {
  const chain = ancestryOf(rowId)
  const current = chain[chain.length - 1]
  const children = childrenOf(rowId)
  const isSample = childrenAreSample(current)

  const columns = [
    {
      key: 'refLabel',
      header: children[0]?.level ?? 'Detail',
      width: proportional(2.4, { minWidth: 230 }),
      renderCell: (row) => (
        <Text
          size="sm" weight="medium" color="accent" role="button" tabIndex={0}
          style={{ cursor: 'pointer', display: 'block' }}
          onClick={() => (row.level === 'Transaction' ? onOpenTransaction(row.refId) : onSelect(row.id))}
        >
          {row.refLabel}
        </Text>
      ),
    },
    { key: 'model', header: 'Model', width: proportional(1.4, { minWidth: 150 }), renderCell: (row) => <Text size="sm" color="secondary">{row.model}</Text> },
    { key: 'inputTokens', header: 'Input', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{formatNumber(row.inputTokens)}</Text> },
    { key: 'outputTokens', header: 'Output', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{formatNumber(row.outputTokens)}</Text> },
    { key: 'cachedTokens', header: 'Cached', width: pixel(110), renderCell: (row) => <Text size="sm" className="mono">{formatNumber(row.cachedTokens)}</Text> },
    { key: 'transactionCount', header: 'Calls', width: pixel(96), renderCell: (row) => <Text size="sm" className="mono">{formatNumber(row.transactionCount)}</Text> },
    { key: 'retries', header: 'Retries', width: pixel(90), renderCell: (row) => <Text size="sm" className="mono">{formatNumber(row.retries)}</Text> },
    { key: 'latencyMs', header: 'Latency', width: pixel(96), renderCell: (row) => <Text size="sm" className="mono">{formatNumber(row.latencyMs)} ms</Text> },
    { key: 'outcome', header: 'Outcome', width: pixel(100), renderCell: (row) => <Badge label={row.outcome} variant={row.outcome === 'Success' ? 'success' : row.outcome === 'Partial' ? 'warning' : 'error'} /> },
    { key: 'cost', header: 'Cost', width: pixel(110), renderCell: (row) => <Text size="sm" weight="semibold"><Aed aed={row.cost} compact /></Text> },
    { key: 'value', header: 'Value', width: pixel(110), renderCell: (row) => <Text size="sm"><Aed aed={row.value.value} compact /></Text> },
  ]

  return (
    <VStack gap={4}>
      <Card padding={4}>
        <VStack gap={3}>
          <Breadcrumb chain={chain} onSelect={onSelect} />
          <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
            <Badge label={current.level} variant="info" />
            <Text weight="semibold" size="lg">{current.refLabel}</Text>
            <Text size="sm" color="secondary">{current.period}</Text>
          </HStack>
          <HStack gap={5} style={{ flexWrap: 'wrap' }}>
            <VStack gap={0}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>Cost</Text>
              <Text weight="semibold"><Aed aed={current.cost} compact /></Text>
            </VStack>
            <VStack gap={0}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>Tokens</Text>
              <Text weight="semibold" className="mono">{formatNumber(current.inputTokens + current.outputTokens)}</Text>
            </VStack>
            <VStack gap={0}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>Calls</Text>
              <Text weight="semibold" className="mono">{formatNumber(current.transactionCount)}</Text>
            </VStack>
            <VStack gap={0}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>Successful outcomes</Text>
              <Text weight="semibold" className="mono">{formatNumber(current.successfulOutcomes)}</Text>
            </VStack>
            <VStack gap={0}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>Value</Text>
              <Text weight="semibold"><Aed aed={current.value.value} compact /></Text>
            </VStack>
          </HStack>
        </VStack>
      </Card>

      {isSample && (
        <Banner
          status="info"
          title="Transactions below are a sample."
          description={`This node covers ${formatNumber(current.transactionCount)} calls; a representative sample is kept for drill-down, so these rows do not sum to the totals above. Every level from Enterprise down to Model does reconcile exactly.`}
        />
      )}

      {children.length === 0 ? (
        <Card padding={4}>
          <EmptyState title="Nothing below this level" description="This is a leaf of the token hierarchy." />
        </Card>
      ) : (
        <Card padding={0}>
          <div style={{ overflowX: 'auto' }}>
            <Table data={children} columns={columns} idKey="id" hasHover density="compact" />
          </div>
        </Card>
      )}
    </VStack>
  )
}
