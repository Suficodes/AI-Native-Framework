// Strategic Alignment and Excellence (requirements doc Section 17) — "show how
// all AI initiatives derive from enterprise strategy".
//
// Three views: the strategy map (the doc's eight-link chain as a graph), the
// excellence-criteria register, and the objective breakdowns. AI Rooms live on
// their own route because each is a standing forum with its own agenda.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Selector } from '@astryxdesign/core/Selector'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { getStrategicObjectives, dataset } from '../../data/mockApi'
import {
  strategyGraph, objectiveRollups, criterionRows, deliveryStatusByObjective, riskByObjective,
} from '../../data/strategyAggregates.ts'
import { KpiCard } from '../../components/KpiCard.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { StrategyMap } from './StrategyMap.jsx'
import { ValueByObjectiveChart, ContributionChart, DeliveryStatusChart, RiskChart } from './StrategyCharts.jsx'

const DIRECTION_VARIANT = { improving: 'success', flat: 'neutral', worsening: 'error' }

function CriteriaTable({ rows }) {
  const columns = [
    { key: 'name', header: 'Excellence criterion', width: proportional(2, { minWidth: 200 }), renderCell: (row) => <Text size="sm" weight="medium">{row.name}</Text> },
    { key: 'objectiveName', header: 'Strategic objective', width: proportional(1.7, { minWidth: 180 }), renderCell: (row) => <Text size="sm" color="secondary">{row.objectiveName}</Text> },
    { key: 'baselineScore', header: 'Baseline', width: pixel(100), renderCell: (row) => <Text size="sm" className="mono">{row.baselineScore}</Text> },
    { key: 'currentScore', header: 'Current', width: pixel(100), renderCell: (row) => <Text size="sm" weight="semibold" className="mono">{row.currentScore}</Text> },
    { key: 'targetScore', header: 'Target', width: pixel(100), renderCell: (row) => <Text size="sm" className="mono">{row.targetScore}</Text> },
    { key: 'unit', header: 'Unit', width: pixel(110), renderCell: (row) => <Text size="sm" color="secondary">{row.unit}</Text> },
    {
      key: 'progressPct',
      header: 'Baseline → target',
      width: pixel(180),
      renderCell: (row) => (
        <ProgressBar
          value={row.progressPct}
          hasValueLabel
          variant={row.progressPct >= 75 ? 'success' : row.progressPct >= 40 ? 'accent' : 'warning'}
        />
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      width: pixel(120),
      renderCell: (row) => <Badge label={row.direction} variant={DIRECTION_VARIANT[row.direction]} />,
    },
  ]
  return (
    <Card padding={0}>
      <div style={{ overflowX: 'auto' }}>
        <Table data={rows} columns={columns} idKey="id" hasHover density="compact" />
      </div>
    </Card>
  )
}

export default function StrategicAlignment() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('map')
  // Defaults to one objective, not all five: the full 71-node map is correct
  // but illegible at fit-view zoom, and a strategy map you cannot read is not
  // showing anyone how initiatives derive from strategy. "All" is one click away.
  const [objectiveId, setObjectiveId] = useState(dataset.strategicObjectives[0]?.id ?? '')
  useEffect(() => { getStrategicObjectives().then(() => setLoaded(true)) }, [])

  if (!loaded) return <div className="page-band page-band--wide"><Skeleton height={560} radius={2} /></div>

  const rollups = objectiveRollups()
  const graph = strategyGraph(objectiveId || undefined)
  const objectiveOptions = [
    ...dataset.strategicObjectives.map((o) => ({ value: o.id, label: o.name })),
    { value: '', label: 'All strategic objectives' },
  ]

  const totals = rollups.reduce(
    (acc, r) => ({
      initiatives: acc.initiatives + r.initiatives,
      expected: acc.expected + r.expectedValue,
      realized: acc.realized + r.realizedValue,
      atRisk: acc.atRisk + r.atRiskInitiatives,
    }),
    { initiatives: 0, expected: 0, realized: 0, atRisk: 0 },
  )

  return (
    <div className="page-band page-band--wide">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <span className="eyebrow">Control Tower</span>
        <Heading level={1} type="display-3">Strategic Alignment</Heading>
        <Text color="secondary" size="lg">
          How every AI initiative derives from enterprise strategy — objective to criterion to division to process to agent to validated value.
        </Text>
      </div>

      <HStack gap={3} align="center" style={{ flexWrap: 'wrap', marginBottom: 'var(--spacing-5)' }}>
        <SegmentedControl value={view} onChange={setView} label="View">
          <SegmentedControlItem value="map" label="Strategy map" />
          <SegmentedControlItem value="objectives" label="Objectives" />
          <SegmentedControlItem value="criteria" label="Excellence criteria" />
        </SegmentedControl>
        {view === 'map' && (
          <Selector
            label="Strategic objective" isLabelHidden size="sm" width={260}
            options={objectiveOptions} value={objectiveId} onChange={setObjectiveId}
          />
        )}
        <DewaButton label="Open AI Rooms" variant="secondary" onClick={() => navigate('/strategic-alignment/ai-rooms')} />
      </HStack>

      <VStack gap={6}>
        <div className="auto-grid" style={{ '--min': '210px' }}>
          <KpiCard label="Strategic objectives" value={dataset.strategicObjectives.length} tag="Verified" definition="Enterprise strategic objectives every AI initiative must trace back to." />
          <KpiCard label="Excellence criteria" value={dataset.excellenceCriteria.length} tag="Verified" definition="Measurable criteria the objectives are judged on." />
          <KpiCard label="Initiatives carrying strategy" value={totals.initiatives} tag="Observed" definition="AI initiatives with a strategic objective assigned." />
          <KpiCard label="Initiatives at risk" value={totals.atRisk} tag="Observed" definition="Initiatives marked at risk, delayed, or blocked." />
          <KpiCard label="Expected value" value={totals.expected} currency compact tag="Estimated" definition="Expected value across every initiative carrying a strategic objective." />
          <KpiCard label="Realized net benefit" value={totals.realized} currency compact tag="Validated" definition="Net benefit validated through Value Realization against these objectives." />
        </div>

        {view === 'map' && <StrategyMap graph={graph} />}

        {view === 'objectives' && (
          <VStack gap={5}>
            <div className="auto-grid" style={{ '--min': '420px' }}>
              <ValueByObjectiveChart data={rollups} />
              <ContributionChart data={rollups} />
              <DeliveryStatusChart data={deliveryStatusByObjective()} />
              <RiskChart data={riskByObjective()} />
            </div>
            <VStack gap={4}>
              {rollups.map((rollup) => (
                <Card key={rollup.objectiveId} padding={4}>
                  <VStack gap={3}>
                    <HStack justify="between" align="center" gap={3} style={{ flexWrap: 'wrap' }}>
                      <VStack gap={0}>
                        <Text weight="semibold" size="lg" style={{ display: 'block' }}>{rollup.objective}</Text>
                        <Text size="sm" color="secondary">{rollup.description}</Text>
                      </VStack>
                      <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
                        <Badge label={`${rollup.initiatives} initiatives`} variant="info" />
                        <Badge label={`${rollup.activeInitiatives} in delivery`} variant="neutral" />
                        {rollup.atRiskInitiatives > 0 && <Badge label={`${rollup.atRiskInitiatives} at risk`} variant="warning" />}
                        {rollup.highRiskInitiatives > 0 && <Badge label={`${rollup.highRiskInitiatives} high risk`} variant="error" />}
                      </HStack>
                    </HStack>
                    <div className="auto-grid" style={{ '--min': '210px' }}>
                      <VStack gap={1}>
                        <Text size="sm" color="secondary" style={{ display: 'block' }}>Expected value</Text>
                        <Text weight="semibold"><Aed aed={rollup.expectedValue} compact /></Text>
                      </VStack>
                      <VStack gap={1}>
                        <Text size="sm" color="secondary" style={{ display: 'block' }}>Realized net benefit</Text>
                        <Text weight="semibold"><Aed aed={rollup.realizedValue} compact signed /></Text>
                      </VStack>
                      <VStack gap={1}>
                        <Text size="sm" color="secondary" style={{ display: 'block' }}>Agenticity progress</Text>
                        <ProgressBar value={rollup.agenticityContribution} hasValueLabel variant="accent" />
                      </VStack>
                      <VStack gap={1}>
                        <Text size="sm" color="secondary" style={{ display: 'block' }}>Excellence improvement</Text>
                        <ProgressBar value={rollup.excellenceImprovementPct} hasValueLabel variant="success" />
                      </VStack>
                    </div>
                  </VStack>
                </Card>
              ))}
            </VStack>
          </VStack>
        )}

        {view === 'criteria' && <CriteriaTable rows={criterionRows()} />}
      </VStack>
    </div>
  )
}
