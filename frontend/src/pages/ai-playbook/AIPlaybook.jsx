// AI Playbook — requirements doc Section 10. A living, scope-filtered playbook,
// explicitly NOT a static document: one route, one scope resolver, one builder,
// and the same 15 sections derived for every scope the doc names (division,
// department, section, job, process, Quality Procedure, agent, strategic
// objective) plus the enterprise root.
//
// Routes:
//   /ai-playbook                        → the enterprise playbook
//   /ai-playbook/:scopeType/:scopeId     → any scope
//   /ai-playbook/example/d2d             → the required department worked example
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Skeleton } from '@astryxdesign/core/Skeleton'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { getPlaybook } from '../../data/mockApi'
import { d2dExampleDepartmentId, enterpriseScopeId } from '../../data/playbookScope.ts'
import { PLAYBOOK_SCOPE_LABELS } from '../../data/types'
import { PLAYBOOK_SECTIONS } from './sections/registry.js'
import { PlaybookSection } from './PlaybookSection.jsx'
import { PlaybookRail } from './PlaybookRail.jsx'
import { PlaybookScopePicker } from './PlaybookScopePicker.jsx'

/** What the scope covers, stated in counts — the header proof that the page really re-derived. */
function ScopeSummary({ scope }) {
  // Singular/plural spelled out per noun — "process"/"harness" do not pluralize
  // by appending an "s".
  const counts = [
    ['process', 'processes', scope.processIds.length],
    ['Quality Procedure', 'Quality Procedures', scope.qpIds.length],
    ['position', 'positions', scope.positionIds.length],
    ['agent', 'agents', scope.agentIds.length],
    ['harness', 'harnesses', scope.harnessIds.length],
    ['AI initiative', 'AI initiatives', scope.initiativeIds.length],
  ]
  return (
    <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
      {counts.map(([one, many, count]) => (
        <Badge key={one} label={`${count} ${count === 1 ? one : many}`} variant={count === 0 ? 'neutral' : 'info'} />
      ))}
    </HStack>
  )
}

export default function AIPlaybook({ exampleD2D = false }) {
  const params = useParams()
  const scopeType = exampleD2D ? 'department' : (params.scopeType ?? 'enterprise')
  const scopeId = exampleD2D
    ? d2dExampleDepartmentId()
    : (params.scopeId ?? enterpriseScopeId())

  const [playbook, setPlaybook] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setPlaybook(null)
    setNotFound(false)
    if (!scopeId) { setNotFound(true); return undefined }
    getPlaybook(scopeType, scopeId).then((result) => {
      if (cancelled) return
      if (result) setPlaybook(result)
      else setNotFound(true)
    })
    return () => { cancelled = true }
  }, [scopeType, scopeId])

  if (notFound) {
    return (
      <div className="page-band page-band--wide">
        <EmptyState
          title="Playbook scope not found"
          description={`No ${PLAYBOOK_SCOPE_LABELS[scopeType] ?? scopeType} with ID "${scopeId}".`}
        />
      </div>
    )
  }

  return (
    <div className="page-band page-band--wide">
      <VStack gap={4} style={{ marginBottom: 'var(--spacing-5)' }}>
        <div>
          <span className="eyebrow">Control Tower</span>
          <Heading level={1} type="display-3">AI Playbook</Heading>
          <Text color="secondary" size="lg">
            A living playbook, not a document — every section below is re-derived for the scope you select.
          </Text>
        </div>
        {!exampleD2D && <PlaybookScopePicker scopeType={scopeType} scopeId={scopeId} />}
        {exampleD2D && (
          <Banner
            status="info"
            title="Department playbook example"
            description="The worked example the requirements doc asks for: the department that owns the Demand-to-Delivery pipeline. It renders through the same generic playbook builder as every other scope — nothing here is special-cased."
          />
        )}
      </VStack>

      {!playbook ? (
        <Skeleton height={640} radius={2} />
      ) : (
        <>
          <VStack gap={2} style={{ marginBottom: 'var(--spacing-6)' }}>
            <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
              <Badge label={PLAYBOOK_SCOPE_LABELS[playbook.scope.type]} variant="success" />
              <Text weight="semibold" size="lg">{playbook.scope.label}</Text>
            </HStack>
            <Text color="secondary" size="sm">{playbook.scope.context}</Text>
            <ScopeSummary scope={playbook.scope} />
          </VStack>

          <div className="playbook-layout">
            <PlaybookRail />
            <VStack gap={8}>
              {PLAYBOOK_SECTIONS.map((section, i) => (
                <PlaybookSection
                  key={section.id}
                  id={section.id}
                  number={i + 1}
                  title={section.title}
                  purpose={section.purpose}
                >
                  <section.Component playbook={playbook} />
                </PlaybookSection>
              ))}
            </VStack>
          </div>
        </>
      )}
    </div>
  )
}
