// The eight AI Rooms (Section 17). Each is a standing forum owning a slice of
// the transformation; this is the index, with the ten required fields on the
// detail page.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { getAIRooms } from '../../data/mockApi'
import { aiRoomRows } from '../../data/strategyAggregates.ts'
import { Aed } from '../../dewa/Aed.jsx'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'

const MATURITY_VARIANT = { Emerging: 'neutral', Developing: 'info', Mature: 'success', Optimizing: 'success' }

export default function AIRooms() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { getAIRooms().then(() => setLoaded(true)) }, [])

  if (!loaded) return <div className="page-band page-band--wide"><Skeleton height={520} radius={2} /></div>

  const rooms = aiRoomRows()

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to Strategic Alignment" variant="ghost" onClick={() => navigate('/strategic-alignment')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">Strategic Alignment</span>
        <Heading level={1} type="display-3">AI Rooms</Heading>
        <Text color="secondary" size="lg">
          Eight standing forums, each owning a slice of the transformation with its own sponsor, agenda, and value.
        </Text>
      </div>

      <div className="auto-grid" style={{ '--min': '380px' }}>
        {rooms.map((room) => (
          <Card
            key={room.id}
            padding={4}
            onClick={() => navigate(`/strategic-alignment/ai-rooms/${room.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/strategic-alignment/ai-rooms/${room.id}`) } }}
            style={{ cursor: 'pointer' }}
          >
            <VStack gap={3}>
              <HStack justify="between" align="start" gap={2}>
                <Text weight="semibold" size="lg" style={{ flex: 1 }}>{room.name}</Text>
                <Badge label={room.playbookMaturity} variant={MATURITY_VARIANT[room.playbookMaturity]} />
              </HStack>
              <Text size="sm" color="secondary">Sponsor · {room.sponsorName}</Text>
              <Text size="sm">{room.strategicGoals[0]}</Text>
              <HStack gap={2} style={{ flexWrap: 'wrap' }}>
                <Badge label={`${room.priorityProcessIds.length} processes`} variant="neutral" />
                <Badge label={`${room.activeInitiativeIds.length} initiatives`} variant="neutral" />
                <Badge label={`${room.agentIds.length} agents`} variant="neutral" />
                {room.openIncidents > 0 && <Badge label={`${room.openIncidents} open incidents`} variant="warning" />}
              </HStack>
              <HStack justify="between" align="center">
                <Text size="sm" color="secondary">
                  Realized <Aed aed={room.realizedValue} compact />
                </Text>
                <ValueTag tag={room.value.tag} />
              </HStack>
            </VStack>
          </Card>
        ))}
      </div>
    </div>
  )
}
