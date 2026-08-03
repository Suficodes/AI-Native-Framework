// Version Control & GitHub — a short guide to how DEWA's AI projects are kept
// under source control: what gets committed, how dozens of projects are
// organised, how work reaches main, and how a release is promoted.
//
// This is guidance for the projects DEWA will run. It is not a record of how
// this prototype was built — that lives on /vibe-code.
import { Card } from '@astryxdesign/core/Card'
import { Text } from '@astryxdesign/core/Text'
import { Heading } from '@astryxdesign/core/Heading'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { Table, proportional, pixel } from '@astryxdesign/core/Table'
import { BoundaryPanel } from './BoundaryPanel.jsx'
import { CopilotSection } from './CopilotSection.jsx'
import { BranchDiagram } from './diagrams/BranchDiagram.jsx'
import { RepoTopologyDiagram } from './diagrams/RepoTopologyDiagram.jsx'
import { PromotionDiagram } from './diagrams/PromotionDiagram.jsx'
import { WHY_IT_MATTERS, PRINCIPLES, REPO_TYPES, MERGE_GATES } from '../../data/versionControlGuide.ts'
import './version-control.css'

function Points({ points }) {
  return (
    <div className="vc-points">
      {points.map((point) => (
        <Card key={point.title} padding={4}>
          <div className="vc-point">
            <Text weight="semibold">{point.title}</Text>
            <Text size="sm" color="secondary">{point.body}</Text>
          </div>
        </Card>
      ))}
    </div>
  )
}

function Figure({ caption, children }) {
  return (
    <figure className="vc-figure" style={{ margin: 'var(--spacing-3) 0 0' }}>
      {children}
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

const REPO_COLUMNS = [
  {
    key: 'name',
    header: 'Repository',
    width: proportional(1.5, { minWidth: 230 }),
    renderCell: (row) => <code className="mono">{row.name}</code>,
  },
  {
    key: 'purpose',
    header: 'Purpose',
    width: proportional(2.6, { minWidth: 280 }),
    renderCell: (row) => <Text size="sm" color="secondary">{row.purpose}</Text>,
  },
  { key: 'owner', header: 'Owned by', width: proportional(1.2, { minWidth: 150 }) },
  {
    key: 'visibility',
    header: 'Visibility',
    width: pixel(104),
    renderCell: (row) => <Badge label={row.visibility} variant={row.visibility === 'Private' ? 'warning' : 'neutral'} />,
  },
]

const GATE_COLUMNS = [
  { key: 'check', header: 'Check', width: proportional(1.3, { minWidth: 190 }) },
  {
    key: 'blocks',
    header: 'Blocks',
    width: pixel(96),
    renderCell: (row) => <Badge label={row.blocks} variant={row.blocks === 'Release' ? 'warning' : 'info'} />,
  },
  {
    key: 'rationale',
    header: 'Why it exists',
    width: proportional(3, { minWidth: 300 }),
    renderCell: (row) => <Text size="sm" color="secondary">{row.rationale}</Text>,
  },
]

export default function VersionControl() {
  return (
    <div>
      <span className="eyebrow">Control Tower</span>
      <Heading level={1} size="xl">Version Control &amp; GitHub</Heading>
      <Text color="secondary">
        How DEWA&rsquo;s AI projects are kept under source control — what is committed, how dozens of
        projects are organised, how a change reaches <code className="mono">main</code>, how a
        release is promoted to production, and how GitHub Copilot connects to all of it.
      </Text>

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>Why it matters</Heading>
      <Text color="secondary" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
        An agent is software. The moment one makes a decision that affects a customer or a control,
        the question stops being &ldquo;does it work&rdquo; and becomes &ldquo;can you prove what it
        was doing on the day it ran&rdquo;.
      </Text>
      <Points points={WHY_IT_MATTERS} />

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>What actually gets pushed</Heading>
      <Text color="secondary" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
        The most common and most expensive misconception: source control carries <strong>definitions,
        not data</strong>. Everything operational is referenced by name or version and lives in the
        system built to hold it.
      </Text>
      <BoundaryPanel />

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>Many projects, one organization</Heading>
      <Text color="secondary" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
        One GitHub organization, one repository per AI initiative, and a shared platform and
        capability layer underneath that delivery repos depend on rather than copy. This is the same
        reuse argument the AI Capability Library makes, expressed in repository structure.
      </Text>
      <Figure caption="Delivery repositories pin a version of the shared layer. A capability improved once is picked up by every consumer on their next bump — a forked copy is improved never.">
        <RepoTopologyDiagram />
      </Figure>
      <div className="vc-scroll" style={{ marginTop: 'var(--spacing-3)' }}>
        <Table data={REPO_TYPES} columns={REPO_COLUMNS} idKey="name" hasHover />
      </div>

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>Branching</Heading>
      <Figure caption="Work happens on short-lived branches. main is protected, always deployable, and only ever advanced by a reviewed pull request. Releases are tags on main; a hotfix cuts from the tag and merges straight back.">
        <BranchDiagram />
      </Figure>
      <div style={{ marginTop: 'var(--spacing-4)' }}>
        <Points points={PRINCIPLES} />
      </div>

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>The gate on main</Heading>
      <Text color="secondary" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
        Every check below runs automatically on the pull request. This is where governance stops
        being a document and starts being enforced.
      </Text>
      <div className="vc-scroll">
        <Table data={MERGE_GATES} columns={GATE_COLUMNS} idKey="check" hasHover />
      </div>

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>From merge to production</Heading>
      <Figure caption="One artifact is built once and promoted. What passed staging is byte-identical to what runs in production — rebuilding between stages would invalidate the test.">
        <PromotionDiagram />
      </Figure>

      <CopilotSection Figure={Figure} />

      <div style={{ marginTop: 'var(--spacing-6)' }}>
        <Banner
          status="info"
          title="Reference practice, not a DEWA policy document."
          description="Repository names, owners, gate definitions and the Copilot integration described here are an illustrative model for how AI initiatives would be managed under source control. The GitHub and Copilot capabilities referenced — instructions files, content exclusion, the Metrics API, audit logs — are real product features; how DEWA configures them is a decision for DEWA's own engineering standards, not a statement of existing policy."
        />
      </div>
    </div>
  )
}
