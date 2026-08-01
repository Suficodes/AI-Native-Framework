// One AI Room, with the ten fields Section 17 requires: sponsor, strategic
// goals, priority processes, active initiatives, agents, harnesses, value,
// risks, playbook maturity, and next actions.
// Route: /strategic-alignment/ai-rooms/:roomId
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { getAIRooms } from '../../data/mockApi'
import { aiRoomById } from '../../data/strategyAggregates.ts'
import { Aed } from '../../dewa/Aed.jsx'
import { ValueTag } from '../../dewa/ValueTag.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'

const MATURITY_VARIANT = { Emerging: 'neutral', Developing: 'info', Mature: 'success', Optimizing: 'success' }

function BulletCard({ title, items, tone = 'secondary' }) {
  return (
    <Card padding={4}>
      <VStack gap={3}>
        <Text weight="semibold">{title}</Text>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: 'var(--spacing-2)', listStyle: 'disc' }}>
          {items.map((item) => (
            <li key={item}><Text size="sm" color={tone}>{item}</Text></li>
          ))}
        </ul>
      </VStack>
    </Card>
  )
}

function LinkCard({ title, items, to, emptyLabel }) {
  const navigate = useNavigate()
  return (
    <Card padding={4}>
      <VStack gap={3}>
        <Text weight="semibold">{title}</Text>
        {items.length === 0 ? (
          <Text size="sm" color="secondary">{emptyLabel}</Text>
        ) : (
          <VStack gap={2}>
            {items.map((item) => (
              <Text
                key={item.id} size="sm" color="accent" role="button" tabIndex={0}
                style={{ cursor: 'pointer', display: 'block' }}
                onClick={() => navigate(to(item.id))}
              >
                {item.label}
              </Text>
            ))}
          </VStack>
        )}
      </VStack>
    </Card>
  )
}

export default function AIRoomDetail() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setLoaded(false); getAIRooms().then(() => setLoaded(true)) }, [roomId])

  if (!loaded) return <div className="page-band page-band--wide"><Skeleton height={480} radius={2} /></div>

  const room = aiRoomById(roomId)
  if (!room) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState title="AI Room not found" description={`No AI Room with ID "${roomId}".`} />
      </div>
    )
  }

  return (
    <div className="page-band page-band--wide">
      <DewaButton label="Back to AI Rooms" variant="ghost" onClick={() => navigate('/strategic-alignment/ai-rooms')} style={{ marginBottom: 'var(--spacing-4)' }} />

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <span className="eyebrow">AI Room · {room.id}</span>
        <Heading level={1} type="display-3">{room.name}</Heading>
        <HStack gap={3} align="center" style={{ flexWrap: 'wrap', marginTop: 'var(--spacing-2)' }}>
          <Text color="secondary" size="lg">Sponsor · {room.sponsorName}</Text>
          <Badge label={`Playbook maturity: ${room.playbookMaturity}`} variant={MATURITY_VARIANT[room.playbookMaturity]} />
          {room.openIncidents > 0 && <Badge label={`${room.openIncidents} open incidents`} variant="warning" />}
        </HStack>
      </div>

      <VStack gap={5}>
        <div className="auto-grid" style={{ '--min': '230px' }}>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Value attributed to this room</Text>
              <div className="kpi-value"><Aed aed={room.value.value} compact /></div>
              <HStack justify="between" align="center">
                <Text size="sm" color="secondary">Room-level estimate</Text>
                <ValueTag tag={room.value.tag} />
              </HStack>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Realized net benefit</Text>
              <div className="kpi-value"><Aed aed={room.realizedValue} compact signed /></div>
              <HStack justify="between" align="center">
                <Text size="sm" color="secondary">From this room&apos;s VR records</Text>
                <ValueTag tag="Validated" />
              </HStack>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Active initiatives</Text>
              <div className="kpi-value">{room.activeInitiativeIds.length}</div>
              <Text size="sm" color="secondary">{room.agentIds.length} agents · {room.harnessIds.length} harnesses</Text>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={2}>
              <Text size="sm" color="secondary" weight="medium">Priority processes</Text>
              <div className="kpi-value">{room.priorityProcessIds.length}</div>
              <Text size="sm" color="secondary">Owned by this room this cycle</Text>
            </VStack>
          </Card>
        </div>

        <BulletCard title="Strategic goals" items={room.strategicGoals} tone="primary" />

        <div className="auto-grid" style={{ '--min': '340px' }}>
          <LinkCard
            title="Priority processes"
            items={room.priorityProcessIds.map((id, i) => ({ id, label: room.processNames[i] ?? id }))}
            to={(id) => `/processes/agenticity/${id}`}
            emptyLabel="No priority process assigned yet."
          />
          <LinkCard
            title="Active initiatives"
            items={room.initiativeTitles.map((i) => ({ id: i.id, label: i.title }))}
            to={(id) => `/ai-initiatives/${id}`}
            emptyLabel="No initiative in flight."
          />
          <LinkCard
            title="Agents"
            items={room.agentNames.map((a) => ({ id: a.id, label: a.name }))}
            to={(id) => `/agents/${id}`}
            emptyLabel="No agent assigned to this room."
          />
          <LinkCard
            title="Harnesses"
            items={room.harnessNames.map((h) => ({ id: h.id, label: h.name }))}
            to={(id) => `/harness-engineering/${id}`}
            emptyLabel="No harness built yet."
          />
        </div>

        <div className="auto-grid" style={{ '--min': '340px' }}>
          <BulletCard title="Risks" items={room.risks} />
          <BulletCard title="Next actions" items={room.nextActions} tone="primary" />
        </div>
      </VStack>
    </div>
  )
}
