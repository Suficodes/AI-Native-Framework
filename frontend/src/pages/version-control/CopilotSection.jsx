// "GitHub Copilot in the loop" — the IDE half of the GitHub story. Where
// Copilot sits, what context it is allowed to pull, what constrains it, and
// what flows back into this Control Tower.
//
// Adoption metrics for Copilot live in the Copilot & Workforce module; this
// section is the integration architecture behind them.
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Heading } from '@astryxdesign/core/Heading'
import { Badge } from '@astryxdesign/core/Badge'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { CopilotContextDiagram } from './diagrams/CopilotContextDiagram.jsx'
import { TelemetryFlowDiagram } from './diagrams/TelemetryFlowDiagram.jsx'
import {
  CONTEXT_PULLED, CONTEXT_EXCLUDED, COPILOT_CONTROLS, TELEMETRY_SOURCES, INTEGRATION_NOTES,
} from '../../data/copilotIntegration.ts'

const CONTROL_COLUMNS = [
  {
    key: 'control',
    header: 'Control',
    width: proportional(1.3, { minWidth: 200 }),
    renderCell: (row) => <code className="mono">{row.control}</code>,
  },
  {
    key: 'where',
    header: 'Where it is set',
    width: proportional(1.3, { minWidth: 190 }),
    renderCell: (row) => <Text size="sm" color="secondary">{row.where}</Text>,
  },
  {
    key: 'effect',
    header: 'What it does',
    width: proportional(2.6, { minWidth: 300 }),
    renderCell: (row) => <Text size="sm" color="secondary">{row.effect}</Text>,
  },
]

const TELEMETRY_COLUMNS = [
  {
    key: 'source',
    header: 'Source',
    width: proportional(1.2, { minWidth: 190 }),
    renderCell: (row) => <Text size="sm" weight="medium">{row.source}</Text>,
  },
  {
    key: 'provides',
    header: 'What it provides',
    width: proportional(2.8, { minWidth: 300 }),
    renderCell: (row) => <Text size="sm" color="secondary">{row.provides}</Text>,
  },
  {
    key: 'refresh',
    header: 'Refresh',
    width: pixel(150),
    renderCell: (row) => <Text size="sm" color="secondary">{row.refresh}</Text>,
  },
  {
    key: 'consumedBy',
    header: 'Feeds',
    width: pixel(170),
    renderCell: (row) => <Badge label={row.consumedBy} variant="info" />,
  },
]

function ContextList({ tone, heading, items }) {
  return (
    <Card padding={4}>
      <Text weight="semibold">{heading}</Text>
      <ul className="vc-boundary-list" style={{ marginTop: 'var(--spacing-2)' }}>
        {items.map((item) => (
          <li key={item.label} className={`vc-tone-${tone}`}>
            <Text size="sm" weight="medium">{item.label}</Text>
            <Text size="xs" color="secondary">{item.detail}</Text>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function CopilotSection({ Figure }) {
  return (
    <>
      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>
        GitHub Copilot in the loop
      </Heading>
      <Text color="secondary" className="vc-lede">
        Copilot is already the assistant in DEWA&rsquo;s IDEs, so the question is not whether to adopt
        it but what governs it and what it reports back. It reads from the same repositories described
        above, and everything it helps write re-enters through the same pull request gate.
      </Text>
      <Figure caption="Copilot never sees a repository wholesale. The IDE sends scoped context, the repo's own instructions file shapes every request, and content exclusion decides what is never transmitted at all.">
        <CopilotContextDiagram />
      </Figure>

      <div className="vc-boundary" style={{ marginTop: 'var(--spacing-4)' }}>
        <ContextList tone="in" heading="Context it is given" items={CONTEXT_PULLED} />
        <ContextList tone="out" heading="Context it never receives" items={CONTEXT_EXCLUDED} />
      </div>

      <Heading level={3} size="md" style={{ marginTop: 'var(--spacing-5)' }}>What makes it governable</Heading>
      <Text color="secondary" className="vc-lede">
        <code className="mono">copilot-instructions.md</code> is the highest-leverage file in the
        repository: it is committed, reviewed and versioned like any other, and it puts DEWA&rsquo;s
        standards and the owning Quality Procedure into every suggestion made in that repo.
      </Text>
      <div className="vc-scroll">
        <Table data={COPILOT_CONTROLS} columns={CONTROL_COLUMNS} idKey="control" hasHover />
      </div>

      <Heading level={3} size="md" style={{ marginTop: 'var(--spacing-5)' }}>
        What is pulled back into the Control Tower
      </Heading>
      <Text color="secondary" className="vc-lede">
        {INTEGRATION_NOTES.direction} {INTEGRATION_NOTES.boundary}
      </Text>
      <Figure caption={INTEGRATION_NOTES.identity}>
        <TelemetryFlowDiagram />
      </Figure>
      <div className="vc-scroll" style={{ marginTop: 'var(--spacing-3)' }}>
        <Table data={TELEMETRY_SOURCES} columns={TELEMETRY_COLUMNS} idKey="source" hasHover />
      </div>
    </>
  )
}
