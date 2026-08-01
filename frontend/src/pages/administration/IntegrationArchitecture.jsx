// Integration Architecture (requirements doc Section 22) — the platform
// placeholders the prototype would consume in production, grouped exactly as
// the doc lists them: SAP, SAP Neptune, D2D, Microsoft, enterprise systems.
//
// Every row names the Control Tower module that would read from it, so this is
// a map of real dependencies rather than a logo wall. Statuses describe the
// PROTOTYPE's position (all mocked today), not a live connection.
import { Card } from '@astryxdesign/core/Card'
import { VStack } from '@astryxdesign/core/VStack'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { Heading } from '@astryxdesign/core/Heading'

const GROUPS = [
  {
    name: 'SAP',
    systems: [
      { system: 'SAP S/4HANA', provides: 'Financial postings, cost centres, purchase and billing documents', consumedBy: 'Value Realization, Token Economics' },
      { system: 'SAP HCM / organization data', provides: 'Divisions, departments, sections, positions, employees', consumedBy: 'Organization, Performance' },
      { system: 'SAP BW / HANA', provides: 'Historical KPI series and baselines', consumedBy: 'Executive Overview, Value Realization' },
      { system: 'SAP BTP / Joule', provides: 'SAP-embedded copilot usage and agent execution', consumedBy: 'Copilot & Workforce, Observability' },
    ],
  },
  {
    name: 'SAP Neptune',
    systems: [
      { system: 'Neptune application UI', provides: 'The delivery shell these React pages map onto', consumedBy: 'Every module (see README)' },
      { system: 'Neptune business workflow', provides: 'Approval routing for VR and agent gates', consumedBy: 'Value Realization, Harness Engineering' },
      { system: 'Neptune forms', provides: 'Master-data maintenance for Administration screens', consumedBy: 'Administration' },
      { system: 'Neptune approvals', provides: 'Human control points and sign-off capture', consumedBy: 'Quality Procedures, Value Realization' },
      { system: 'Neptune API consumption', provides: 'The service layer replacing mockApi.ts', consumedBy: 'Every module' },
      { system: 'Neptune embedded visualizations', provides: 'Host for the graph and dashboard components', consumedBy: 'Enterprise Map, Observability' },
    ],
  },
  {
    name: 'D2D',
    systems: [
      { system: 'Demand records', provides: 'The demand register and its lifecycle', consumedBy: 'D2D Integration' },
      { system: 'Process stages', provides: 'The 12-stage delivery journey', consumedBy: 'D2D Integration, AI Initiatives' },
      { system: 'BRD generation', provides: 'Documents the D2D Documentation Agent drafts', consumedBy: 'Agents, Observability' },
      { system: 'AI feature usage', provides: 'Which demands used AI assistance, and how', consumedBy: 'Copilot & Workforce' },
      { system: 'SLA tracking', provides: 'Cycle time against the agreed service level', consumedBy: 'Performance' },
      { system: 'Outcomes and Value Realization link', provides: 'Demand to benefit traceability', consumedBy: 'Value Realization' },
    ],
  },
  {
    name: 'Microsoft',
    systems: [
      { system: 'Microsoft Graph', provides: 'Activity signals across Microsoft 365', consumedBy: 'Copilot & Workforce' },
      { system: 'Microsoft 365 Copilot adoption', provides: 'Licences, active users, per-app usage', consumedBy: 'Copilot & Workforce' },
      { system: 'Copilot Studio agents', provides: 'Configured agents and their run telemetry', consumedBy: 'Agents, Observability' },
      { system: 'Entra ID', provides: 'Identity, groups and single sign-on', consumedBy: 'Authentication (not implemented)' },
      { system: 'Purview / compliance', provides: 'Data classification and retention labels', consumedBy: 'Risk & Compliance, Observability' },
    ],
  },
  {
    name: 'Enterprise systems',
    systems: [
      { system: 'API gateway', provides: 'The governed edge every agent tool call passes through', consumedBy: 'Harness Engineering, Observability' },
      { system: 'Knowledge repositories', provides: 'The approved sources agents may retrieve from', consumedBy: 'Harness Engineering, AI Playbook' },
      { system: 'Document management', provides: 'BRDs, evidence packs, audit artefacts', consumedBy: 'Value Realization, Quality Procedures' },
      { system: 'Data platform', provides: 'The curated data products agents read', consumedBy: 'AI Playbook (required data)' },
      { system: 'Grafana', provides: 'Operational dashboards and alerting', consumedBy: 'Observability (embedded)' },
      { system: 'Apache Superset', provides: 'Analytical dashboards over the VR ledger', consumedBy: 'Value Realization (embedded)' },
      { system: 'Custom visualization layer', provides: 'The Enterprise Map graph runtime', consumedBy: 'Enterprise Map' },
    ],
  },
]

export function IntegrationArchitecture() {
  return (
    <VStack gap={5}>
      <Banner
        status="info"
        title="Every integration below is mocked in this prototype."
        description="No external system is contacted and no credentials exist. This screen documents which enterprise platform each module would read from in production, and is the companion to the SAP Neptune implementation mapping in the README."
      />

      {GROUPS.map((group) => (
        <div key={group.name}>
          <HStack gap={3} align="center" style={{ marginBottom: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            <Heading level={3} style={{ margin: 0 }}>{group.name}</Heading>
            <Badge label={`${group.systems.length} systems`} variant="neutral" />
          </HStack>
          <div className="auto-grid" style={{ '--min': '340px' }}>
            {group.systems.map((system) => (
              <Card key={system.system} padding={4}>
                <VStack gap={2}>
                  <HStack justify="between" align="start" gap={2}>
                    <Text weight="semibold" style={{ flex: 1 }}>{system.system}</Text>
                    <Badge label="Mocked" variant="warning" />
                  </HStack>
                  <Text size="sm" color="secondary">{system.provides}</Text>
                  <HStack gap={2} align="center" style={{ flexWrap: 'wrap' }}>
                    <Text size="sm" color="secondary" weight="medium">Consumed by</Text>
                    <Text size="sm">{system.consumedBy}</Text>
                  </HStack>
                </VStack>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </VStack>
  )
}
