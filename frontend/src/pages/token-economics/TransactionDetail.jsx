// One sampled transaction — the bottom of the Section 15 drill-down. Shows
// every tracked field the doc lists for a call, plus the chain back up to the
// enterprise so the call's place in the hierarchy is explicit.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { getTokenUsage } from '../../data/mockApi'
import { ancestryOf, transactionById } from '../../data/tokenAggregates.ts'
import { formatNumber } from '../../utils/format.js'
import { Aed } from '../../dewa/Aed.jsx'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'

const OUTCOME_VARIANT = { Success: 'success', Partial: 'warning', Failure: 'error' }

export default function TransactionDetail() {
  const { txId } = useParams()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setLoaded(false); getTokenUsage().then(() => setLoaded(true)) }, [txId])

  if (!loaded) return <div className="page-band page-band--wide"><Skeleton height={420} radius={2} /></div>

  const tx = transactionById(txId)
  if (!tx) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="Transaction not found" description={`No sampled transaction with ID "${txId}".`} />
      </div>
    )
  }

  const chain = ancestryOf(tx.id).slice(0, -1)
  const totalTokens = tx.inputTokens + tx.outputTokens

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Token Economics" variant="ghost" onClick={() => navigate('/token-economics')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">Transaction · {tx.refId}</span>
        <Heading level={1} type="display-3">{tx.refLabel}</Heading>
        <Text color="secondary" size="lg">{tx.model} · {tx.period}</Text>
      </div>

      <VStack gap={5}>
        <Card padding={4}>
          <VStack gap={3}>
            <Text weight="semibold">Position in the hierarchy</Text>
            <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
              {chain.map((row, i) => (
                <HStack key={row.id} gap={2} align="center">
                  {i > 0 && <Text size="sm" color="secondary">›</Text>}
                  <Badge label={row.level} variant="neutral" />
                  <Text size="sm">{row.refLabel}</Text>
                </HStack>
              ))}
            </HStack>
          </VStack>
        </Card>

        <div className="auto-grid" style={{ '--min': '210px' }}>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Cost</Text>
              <div className="kpi-value"><Aed aed={tx.cost} /></div>
              <HStack justify="between" align="center">
                <Text size="sm" color="secondary">This call</Text>
                <ValueTag tag="Observed" />
              </HStack>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Attributed value</Text>
              <div className="kpi-value"><Aed aed={tx.value.value} /></div>
              <HStack justify="between" align="center">
                <Text size="sm" color="secondary">Business value of the output</Text>
                <ValueTag tag={tx.value.tag} />
              </HStack>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Total tokens</Text>
              <div className="kpi-value mono">{formatNumber(totalTokens)}</div>
              <Text size="sm" color="secondary">{formatNumber(tx.cachedTokens)} cached</Text>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Outcome</Text>
              <div style={{ paddingTop: 'var(--spacing-2)' }}>
                <Badge label={tx.outcome} variant={OUTCOME_VARIANT[tx.outcome]} />
              </div>
              <Text size="sm" color="secondary">
                {tx.humanIntervention ? 'A human intervened on this call' : 'Completed without human intervention'}
              </Text>
            </VStack>
          </Card>
        </div>

        <Card padding={4}>
          <MetadataList columns={3}>
            <MetadataListItem label="Transaction ID">{tx.refId}</MetadataListItem>
            <MetadataListItem label="Period">{tx.period}</MetadataListItem>
            <MetadataListItem label="Model">{tx.model}</MetadataListItem>
            <MetadataListItem label="Input tokens">{formatNumber(tx.inputTokens)}</MetadataListItem>
            <MetadataListItem label="Output tokens">{formatNumber(tx.outputTokens)}</MetadataListItem>
            <MetadataListItem label="Cached tokens">{formatNumber(tx.cachedTokens)}</MetadataListItem>
            <MetadataListItem label="Reasoning units">{formatNumber(tx.reasoningUnits)}</MetadataListItem>
            <MetadataListItem label="Retrieval calls">{formatNumber(tx.retrievalCalls)}</MetadataListItem>
            <MetadataListItem label="Tool calls">{formatNumber(tx.toolCalls)}</MetadataListItem>
            <MetadataListItem label="Retries">{tx.retries}</MetadataListItem>
            <MetadataListItem label="Latency">{formatNumber(tx.latencyMs)} ms</MetadataListItem>
            <MetadataListItem label="Human intervention">{tx.humanIntervention ? 'Yes' : 'No'}</MetadataListItem>
          </MetadataList>
        </Card>
      </VStack>
    </div>
  )
}
