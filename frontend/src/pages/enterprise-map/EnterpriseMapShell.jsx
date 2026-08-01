// "AI-Native Enterprise Map" (requirements doc Section 18) — deliberately its
// own top-level route, NOT nested under the App shell/SideNav, because the doc
// calls for a full-screen experience with its own presentation mode.
//
// Everything on this screen is a view of ONE graph through ONE applyLens()
// call (CONVENTIONS.md's central rule). The lens rail, the filters, the flow
// toggles, Story Mode and presentation mode all do the same thing: change the
// options passed to that single function.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/HStack'
import { VStack } from '@astryxdesign/core/VStack'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import {
  applyLens, discloseGraph, defaultExpansion, expansionPathTo, lensById,
} from '../../data/enterpriseMapLenses.ts'
import { buildEnterpriseGraph } from '../../data/enterpriseMapGraph.ts'
import { STORY_STEPS } from '../../data/enterpriseMapStory.ts'
import { useChartMode } from '../../lib/useChartMode.js'
import { DewaButton } from '../../dewa/DewaButton.jsx'
import { MapCanvas } from './MapCanvas.jsx'
import { MapRail } from './MapRail.jsx'
import { MapDetailPanel } from './MapDetailPanel.jsx'
import { StoryBar } from './StoryBar.jsx'

const STORY_INTERVAL_MS = 9000

export default function EnterpriseMapShell() {
  const navigate = useNavigate()
  const mode = useChartMode()

  const [lensId, setLensId] = useState('organization')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState([])
  const [divisionNodeId, setDivisionNodeId] = useState('')
  const [extraEdgeKinds, setExtraEdgeKinds] = useState([])
  const [targetState, setTargetState] = useState(false)
  const [expandedIds, setExpandedIds] = useState(() => defaultExpansion('organization'))
  const [selected, setSelected] = useState(null)
  const [presentation, setPresentation] = useState(false)
  const [storyIndex, setStoryIndex] = useState(null)
  const [playing, setPlaying] = useState(false)

  const inStory = storyIndex != null

  const divisionOptions = useMemo(
    () => buildEnterpriseGraph().nodes
      .filter((n) => n.kind === 'division')
      .map((n) => ({ value: n.id, label: n.label })),
    [],
  )

  // ── One lens call drives everything on screen ──────────────────────
  const lensOptions = useMemo(
    () => ({ filters, divisionNodeId: divisionNodeId || undefined, search, extraEdgeKinds }),
    [filters, divisionNodeId, search, extraEdgeKinds],
  )
  const full = useMemo(() => applyLens(lensId, lensOptions), [lensId, lensOptions])
  const visible = useMemo(() => discloseGraph(full, expandedIds), [full, expandedIds])

  // A node is expandable if the active lens still has children for it.
  const expandableIds = useMemo(() => {
    const withChildren = new Set()
    for (const node of full.nodes) if (node.parentId) withChildren.add(node.parentId)
    return withChildren
  }, [full.nodes])

  const applyStoryStep = useCallback((index) => {
    const step = STORY_STEPS[index]
    setStoryIndex(index)
    setLensId(step.lens)
    setFilters(step.filters ?? [])
    setExtraEdgeKinds(step.extraEdgeKinds ?? [])
    setTargetState(Boolean(step.targetState))
    setDivisionNodeId(step.divisionNodeId ?? '')
    setSearch('')
    setSelected(null)
    const spec = lensById(step.lens)
    setExpandedIds(defaultExpansion(step.lens, step.depth ?? spec.defaultDepth))
  }, [])

  // Auto-advance, stopping at the last step rather than looping — an executive
  // walkthrough that silently restarts is disorienting.
  useEffect(() => {
    if (!playing || !inStory) return undefined
    const timer = setTimeout(() => {
      if (storyIndex >= STORY_STEPS.length - 1) setPlaying(false)
      else applyStoryStep(storyIndex + 1)
    }, STORY_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [playing, inStory, storyIndex, applyStoryStep])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && presentation) setPresentation(false)
      if (!inStory) return
      if (e.key === 'ArrowRight') applyStoryStep(Math.min(STORY_STEPS.length - 1, storyIndex + 1))
      if (e.key === 'ArrowLeft') applyStoryStep(Math.max(0, storyIndex - 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [presentation, inStory, storyIndex, applyStoryStep])

  const changeLens = (nextLens) => {
    setLensId(nextLens)
    setExpandedIds(defaultExpansion(nextLens))
    setSelected(null)
    setStoryIndex(null)
    setPlaying(false)
  }

  const toggleExpand = useCallback((nodeId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  // Searching is useless if the match is inside a collapsed branch, so a search
  // opens the path to whatever it finds.
  useEffect(() => {
    if (!search.trim() || full.matched.size === 0) return
    setExpandedIds((prev) => {
      const next = new Set(prev)
      for (const id of full.matched) for (const ancestor of expansionPathTo(id)) next.add(ancestor)
      return next
    })
  }, [search, full.matched])

  const focusNode = useCallback((node) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      for (const ancestor of expansionPathTo(node.id)) next.add(ancestor)
      return next
    })
    setSelected(node)
  }, [])

  const spec = lensById(lensId)
  const fitKey = `${lensId}|${filters.join(',')}|${divisionNodeId}|${targetState}`

  return (
    <div style={{ height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', background: 'var(--color-background-body)' }}>
      {/* Header — hidden in presentation mode, where only the map and the
          narration should be on screen. */}
      {!presentation && (
        <header style={{
          flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 'var(--spacing-3)', padding: 'var(--spacing-3) var(--spacing-5)',
          borderBottom: '1px solid var(--color-border)',
        }}
        >
          <VStack gap={0}>
            <span className="eyebrow">AI-Native Enterprise Map</span>
            <HStack gap={3} align="center" style={{ flexWrap: 'wrap' }}>
              <Heading level={1} type="display-4" style={{ margin: 0 }}>{spec.label} lens</Heading>
              <Text color="secondary" size="sm">{spec.question}</Text>
            </HStack>
          </VStack>
          <HStack gap={2} align="center">
            {targetState && <Badge label="Target state" variant="success" />}
            <DewaButton
              label={inStory ? 'Restart story' : 'Story Mode'}
              variant="secondary"
              onClick={() => { applyStoryStep(0); setPlaying(true) }}
            />
            <DewaButton label="Presentation mode" variant="ghost" onClick={() => setPresentation(true)} />
            <DewaButton label="Back to Control Tower" variant="ghost" onClick={() => navigate('/')} />
          </HStack>
        </header>
      )}

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {!presentation && (
          <aside style={{ width: 268, flex: 'none', borderRight: '1px solid var(--color-border)', minHeight: 0 }}>
            <MapRail
              lensId={lensId}
              onLens={changeLens}
              search={search}
              onSearch={setSearch}
              filters={filters}
              onToggleFilter={(id) => setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))}
              divisionOptions={divisionOptions}
              divisionNodeId={divisionNodeId}
              onDivision={(value) => setDivisionNodeId(value ?? '')}
              extraEdgeKinds={extraEdgeKinds}
              onToggleEdge={(kind) => setExtraEdgeKinds((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]))}
              targetState={targetState}
              onTargetState={setTargetState}
              mode={mode}
              nodeCount={visible.nodes.length}
              edgeCount={visible.edges.length}
            />
          </aside>
        )}

        <main style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          {visible.nodes.length === 0 ? (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
              <EmptyState
                title="Nothing matches this combination"
                description="No node satisfies every active filter under this lens. Clear a filter or widen the division scope."
              />
            </div>
          ) : (
            <MapCanvas
              graph={visible}
              colorBy={spec.colorBy}
              mode={mode}
              expandedIds={expandedIds}
              expandableIds={expandableIds}
              onToggle={toggleExpand}
              onSelect={setSelected}
              selectedId={selected?.id ?? null}
              matched={full.matched}
              presentation={presentation}
              fitKey={fitKey}
            />
          )}

          {presentation && (
            <div style={{ position: 'absolute', top: 'var(--spacing-3)', right: 'var(--spacing-3)', zIndex: 5 }}>
              <DewaButton label="Exit presentation (Esc)" variant="secondary" onClick={() => setPresentation(false)} />
            </div>
          )}
        </main>
      </div>

      {inStory && (
        <StoryBar
          stepIndex={storyIndex}
          playing={playing}
          onStep={applyStoryStep}
          onPlayPause={() => setPlaying((p) => !p)}
          onExit={() => { setStoryIndex(null); setPlaying(false) }}
          presentation={presentation}
        />
      )}

      <MapDetailPanel
        node={selected}
        graph={visible}
        onClose={() => setSelected(null)}
        onFocus={focusNode}
      />
    </div>
  )
}
