// AI Capability Library — the platform-leverage view. One question: what does
// DEWA build once and reuse everywhere, and what does that avoid?
//
// The twelve skills are the same ReusableSkill records the AI Playbook shows at
// section 15; this module adds call volume, the reuse multiplier and the cost
// those reuses avoid, alongside the shared memory and the MCP connectors that
// make the skills usable across divisions.
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Banner } from '@astryxdesign/core/Banner'
import { KpiCard } from '../../components/KpiCard.jsx'
import { ExportButton } from '../../components/ExportButton.jsx'
import { Aed } from '../../dewa/Aed.jsx'
import { getCapabilityLibrary } from '../../data/capabilityLibrary.ts'
import { SkillsTable } from './SkillsTable.jsx'
import { MemoryPanel } from './MemoryPanel.jsx'
import { ConnectorsPanel } from './ConnectorsPanel.jsx'
import './capability-library.css'

const library = getCapabilityLibrary()

const EXPORT_COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Skill' },
  { key: 'category', header: 'Category' },
  { key: 'maturity', header: 'Maturity' },
  { key: 'approvedForAutonomy', header: 'Max autonomy' },
  { key: 'callsThisQuarter', header: 'Calls this quarter' },
  { key: 'reuseInstances', header: 'Reuse instances' },
  { key: 'bespokeBuildCost', header: 'Bespoke build cost (AED)' },
  { key: 'buildCostAvoided', header: 'Build cost avoided (AED)' },
  { key: 'netAvoided', header: 'Net avoided (AED)' },
]

export default function CapabilityLibrary() {
  const { skills, memory, connectors, totals } = library

  return (
    <div>
      <span className="eyebrow">Control Tower</span>
      <Heading level={1} size="xl">AI Capability Library</Heading>
      <Text color="secondary">
        What DEWA builds once and reuses everywhere — the shared skills agents call, the memory they
        recall from, and the governed connectors they reach enterprise systems through.
      </Text>

      <div className="auto-grid" style={{ margin: 'var(--spacing-5) 0' }}>
        <KpiCard
          label="Skills in library" value={totals.skills} tag="Observed"
          definition="Approved reusable capabilities any harness can embed instead of building its own."
        />
        <KpiCard
          label="Skill calls this quarter" value={totals.calls} tag="Observed"
          definition="Times a library skill was invoked by an agent across all divisions."
        />
        <KpiCard
          label="Reuse instances" value={totals.reuseInstances} tag="Observed"
          definition="Total harness-to-skill embeddings. Every instance past the first is a build that did not happen."
        />
        <KpiCard
          label="Rebuild cost avoided" value={totals.netAvoided} currency compact tag="Estimated"
          definition="Bespoke build cost × reuse instances beyond the first, net of the tokens spent running the skills."
        />
        <KpiCard
          label="Memory recall hit rate" value={totals.avgRecallHitRatePct} suffix="%" tag="Observed"
          definition="Share of agent runs answered from shared memory instead of re-retrieving context from source."
        />
        <KpiCard
          label="MCP connectors" value={totals.connectors} tag="Observed"
          definition="Governed doors between agents and enterprise systems. Skills reach systems only through these."
        />
      </div>

      <div className="cl-callout">
        <div className="cl-callout-body">
          <Text weight="semibold">Reuse instead of rebuild</Text>
          <Text size="sm" color="secondary">
            Without a shared library, each of the {totals.reuseInstances} harness embeddings would have
            been built from scratch. One implementation serves them all. Running those {totals.skills}{' '}
            skills for a whole quarter costs <Aed aed={totals.runCost} decimals={2} /> in tokens —
            the build cost is what dominates, which is exactly why reuse is where the money is.
          </Text>
        </div>
        <div className="cl-callout-figure">
          <Text size="sm" color="secondary">Avoided</Text>
          <div className="kpi-value"><Aed aed={totals.netAvoided} compact /></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-2)', margin: 'var(--spacing-6) 0 var(--spacing-2)', flexWrap: 'wrap' }}>
        <Heading level={2} size="lg">The library</Heading>
        <ExportButton filename="capability-library" columns={EXPORT_COLUMNS} rows={skills} />
      </div>
      <div className="cl-scroll"><SkillsTable skills={skills} /></div>

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>Shared memory</Heading>
      <Text color="secondary" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
        Agents do not re-derive context on every run — they recall it. Across{' '}
        {totals.memoryEntries.toLocaleString('en-US')} entries, recall answered {totals.avgRecallHitRatePct}%
        of runs and avoided {(totals.memoryTokensAvoided / 1_000_000).toFixed(0)}M tokens of re-retrieval
        this quarter.
      </Text>
      <MemoryPanel stores={memory} />

      <Heading level={2} size="lg" style={{ marginTop: 'var(--spacing-6)' }}>MCP connectors</Heading>
      <Text color="secondary" style={{ display: 'block', marginBottom: 'var(--spacing-3)' }}>
        {totals.connectorCalls.toLocaleString('en-US')} calls this quarter across {totals.connectors}{' '}
        connectors. Access is granted to the connector, not to the agent, so a system can be revoked
        in one place.
      </Text>
      <div className="cl-scroll"><ConnectorsPanel connectors={connectors} /></div>

      <div style={{ marginTop: 'var(--spacing-6)' }}>
        <Banner
          status="info"
          title="Skills, owners and reuse counts are dataset-derived. Costs and volumes are planning assumptions."
          description="Build cost per capability, quarterly call volume, the memory stores and the MCP connectors are illustrative figures for demonstration — they are not observed DEWA spend. Token cost is priced at the same AED 30 per million tokens Token Economics uses, so the two modules cannot disagree."
        />
      </div>
    </div>
  )
}
