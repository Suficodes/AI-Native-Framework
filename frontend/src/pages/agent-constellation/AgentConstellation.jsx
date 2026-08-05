// Agent Constellation — the AI agent workforce as one picture: the enterprise
// core, its divisions, the agents each division runs, and the processes and
// Quality Procedures those agents touch.
//
// Complements /enterprise-map rather than replacing it. That map is the
// analytical surface (nineteen entity kinds, ten lenses, Story Mode); this is
// the presentation surface — one question, one screen, readable across a room.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { buildConstellationGraph } from '../../data/constellationGraph.ts'
import { ConstellationCanvas } from './ConstellationCanvas.jsx'
import { ConstellationDirectory } from './ConstellationDirectory.jsx'
import { ConstellationLegend } from './ConstellationLegend.jsx'
import { ConstellationDetailPanel } from './ConstellationDetailPanel.jsx'
import { DomainCarousel } from './DomainCarousel.jsx'
import './constellation.css'

export default function AgentConstellation() {
  const graph = useMemo(() => buildConstellationGraph(), [])
  const [mode, setMode] = useState('radial')
  const [focusDomainId, setFocusDomainId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  // Neural mode is inherently per-division: a top-down tree of all four side by
  // side collapses into an unreadable strip. Entering it without a focus picks
  // the busiest division rather than showing nothing useful.
  const busiestDomainId = useMemo(
    () => [...graph.domains].sort((a, b) => b.metrics.agentCount - a.metrics.agentCount)[0]?.id,
    [graph],
  )
  const effectiveFocusId =
    mode === 'neural' ? (focusDomainId ?? busiestDomainId) : focusDomainId
  const focusDomain = effectiveFocusId ? graph.byId.get(effectiveFocusId) : null

  // Esc unwinds one layer at a time: selection, then fullscreen, then focus.
  // SidePanel handles its own Esc, so the selection branch here only matters
  // when the panel is already closing.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (selectedId) setSelectedId(null)
      else if (fullscreen) setFullscreen(false)
      else setFocusDomainId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, fullscreen])

  const onFocusDomain = useCallback(
    (id) => setFocusDomainId((current) => (current === id ? null : id)),
    [],
  )

  return (
    // --wide because the canvas sits between two 264px rails; page-band itself
    // is the shared page gutter every route uses.
    <div className="page-band page-band--wide">
      <Heading level={1} size="xl">Agent Constellation</Heading>
      <Text color="secondary">
        Every AI agent DEWA runs, the division that owns it, and the processes and Quality
        Procedures it touches — in one picture.
      </Text>

      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-2)',
          alignItems: 'center',
          flexWrap: 'wrap',
          margin: 'var(--spacing-4) 0 var(--spacing-3)',
        }}
      >
        <SegmentedControl value={mode} onChange={setMode} label="Layout">
          <SegmentedControlItem value="radial" label="Radial" />
          <SegmentedControlItem value="neural" label="Neural" />
        </SegmentedControl>
        {mode === 'radial' && focusDomain && (
          <Button size="sm" variant="secondary" onClick={() => setFocusDomainId(null)}>
            Back to all divisions
          </Button>
        )}
        {mode === 'neural' && (
          <Text size="sm" color="secondary">
            One division at a time — use the pill below the canvas to move between them.
          </Text>
        )}
      </div>

      <div className={`cn-shell ${fullscreen ? 'is-fullscreen' : ''}`}>
        <ConstellationDirectory
          graph={graph}
          query={query}
          onQueryChange={setQuery}
          focusDomainId={focusDomainId}
          onFocusDomain={onFocusDomain}
        />

        <div className="cn-stage">
          <ConstellationCanvas
            graph={graph}
            mode={mode}
            focusDomainId={effectiveFocusId}
            hoveredId={hoveredId}
            selectedId={selectedId}
            query={query}
            onHover={setHoveredId}
            onSelect={setSelectedId}
            onFocusDomain={onFocusDomain}
          />
          <div className="cn-stage-controls">
            <Button size="sm" variant="secondary" onClick={() => setFullscreen((v) => !v)}>
              {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </Button>
          </div>
          {focusDomain && (
            <DomainCarousel
              domains={graph.domains}
              activeId={effectiveFocusId}
              onChange={setFocusDomainId}
            />
          )}
          <p aria-live="polite" className="sr-only">
            {focusDomain ? `Focused on ${focusDomain.label} division.` : 'Showing all divisions.'}
          </p>
        </div>

        <ConstellationLegend
          graph={graph}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onHover={setHoveredId}
        />
      </div>

      <ConstellationDetailPanel
        graph={graph}
        nodeId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
