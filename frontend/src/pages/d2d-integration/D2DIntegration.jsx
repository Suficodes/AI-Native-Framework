// D2D Integration module — requirements doc Section 11: D2D as the delivery
// and work-outcome system. The 12-stage journey + the demand register.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getD2DDemands } from '../../data/mockApi'
import { divisionName } from '../../data/processesAggregates.ts'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { D2DJourneyStages } from './D2DJourneyStages.jsx'

const BRD_VARIANT = { NotStarted: 'neutral', Drafted: 'info', UnderReview: 'warning', Approved: 'success' }

export default function D2DIntegration() {
  const navigate = useNavigate()
  const [demands, setDemands] = useState(null)
  useEffect(() => { getD2DDemands().then(setDemands) }, [])

  const columns = [
    {
      key: 'title', header: 'Demand', width: proportional(2.4, { minWidth: 220 }),
      renderCell: (row) => (
        <Text weight="medium" color="accent" onClick={() => navigate(`/d2d-integration/demands/${row.id}`)} style={{ cursor: 'pointer' }}>
          {row.title}
        </Text>
      ),
    },
    { key: 'division', header: 'Division', width: proportional(1.6, { minWidth: 160 }) },
    {
      key: 'stage', header: 'Stage', width: pixel(160),
      renderCell: (row) => <Badge label={row.stage} variant="info" />,
    },
    { key: 'slaDays', header: 'SLA', width: pixel(80), renderCell: (row) => <Text size="sm">{row.slaDays}d</Text> },
    {
      key: 'brdStatus', header: 'BRD status', width: pixel(110),
      renderCell: (row) => <Badge label={row.brdStatus} variant={BRD_VARIANT[row.brdStatus]} />,
    },
    {
      key: 'estimatedValue', header: 'Estimated value', width: pixel(150),
      renderCell: (row) => <Text size="sm"><Aed usd={row.estimatedValue.value} compact /> <ValueTag tag={row.estimatedValue.tag} /></Text>,
    },
    {
      key: 'goLiveStatus', header: 'Go-live', width: pixel(90),
      renderCell: (row) => <Badge label={row.goLiveStatus === 'Live' ? 'Live' : 'Not live'} variant={row.goLiveStatus === 'Live' ? 'success' : 'neutral'} />,
    },
  ]

  const rows = (demands ?? []).map((d) => ({ ...d, division: divisionName(d.divisionId) }))

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">D2D Integration</Heading>
        <Text color="secondary" size="lg">
          The Demand-to-Delivery pipeline as the enterprise's delivery and work-outcome system —
          from business need to playbook update.
        </Text>
      </div>

      {!demands ? (
        <Skeleton height={480} radius={2} />
      ) : (
        <VStack gap={5}>
          <div>
            <Text weight="semibold" size="sm" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>
              The 12-stage journey
            </Text>
            <D2DJourneyStages demands={demands} />
          </div>

          <div>
            <Heading level={3} style={{ margin: '0 0 var(--spacing-3)' }}>Demand register</Heading>
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
