// Shared agent memory. The point an executive should take from this section:
// agents do not re-derive context on every run — they recall it. The recall hit
// rate is the number that says how well that is working.
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/VStack'
import { Badge } from '@astryxdesign/core/Badge'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { formatNumber } from '../../utils/format.js'

const millions = (n) => `${(n / 1_000_000).toFixed(1)}M`

export function MemoryPanel({ stores }) {
  return (
    <div className="cl-memory">
      {stores.map((store) => (
        <Card key={store.id} padding={4}>
          <VStack gap={2}>
            <div className="cl-memory-head">
              <Text weight="semibold">{store.name}</Text>
              <Badge label={store.scope} variant="neutral" />
            </div>

            <Text size="sm" color="secondary">{store.holds}</Text>

            <div className="cl-memory-figures">
              <div>
                <span className="cl-figure">{formatNumber(store.entries)}</span>
                <Text size="xs" color="secondary">entries</Text>
              </div>
              <div>
                <span className="cl-figure">{millions(store.tokensAvoided)}</span>
                <Text size="xs" color="secondary">tokens not re-spent</Text>
              </div>
            </div>

            <div className="cl-recall">
              <div className="cl-recall-head">
                <Text size="xs" color="secondary">Recall hit rate</Text>
                <span className="mono">{store.recallHitRatePct}%</span>
              </div>
              <ProgressBar
                value={store.recallHitRatePct}
                variant={store.recallHitRatePct >= 80 ? 'success' : 'warning'}
              />
            </div>

            <Text size="xs" color="secondary">Retention · {store.retention}</Text>
          </VStack>
        </Card>
      ))}
    </div>
  )
}
