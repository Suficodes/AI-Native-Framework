// The 19 Administration sub-screens (requirements doc Section 19), driven by
// ONE config list and ONE generic register component rather than 19
// near-identical files.
//
// Each screen declares where its rows come from and which columns to show, so
// every screen shows the REAL master data the rest of the app runs on — a
// configuration screen that renders a placeholder teaches an executive
// nothing, and Section 25 explicitly says "avoid placeholder-only screens".
//
// Editing is deliberately out of scope: this is a frontend-only prototype with
// no persistence layer, so the registers are read-only and say so rather than
// offering a Save button that would silently do nothing.
import { dataset } from '../../data/mockApi'
import { AGENTICITY_LABELS, QP_INDICATOR_LABELS, WORKFORCE_TYPE_LABELS } from '../../data/types'
import { ROLES } from '../../data/roles.ts'
import { COST_LABELS, BENEFIT_LABELS } from '../../data/valueAggregates.ts'

const orgName = (id) => dataset.orgNodes.find((n) => n.id === id)?.name ?? '—'
const employeeName = (id) => dataset.employees.find((e) => e.id === id)?.name ?? '—'

/** Model catalogue with the rates the token ledger actually bills at. */
const MODEL_RATES = [
  { model: 'Claude Sonnet 4.5', vendor: 'Anthropic', tier: 'Frontier', aedPerMillion: 42 },
  { model: 'GPT-4.1', vendor: 'OpenAI', tier: 'Frontier', aedPerMillion: 38 },
  { model: 'Gemini 2.5 Pro', vendor: 'Google', tier: 'Frontier', aedPerMillion: 30 },
  { model: 'Azure OpenAI GPT-4o', vendor: 'Microsoft Azure', tier: 'Small', aedPerMillion: 14 },
  { model: 'SAP Joule', vendor: 'SAP', tier: 'Small', aedPerMillion: 9 },
  { model: 'Local Llama 3.1 70B', vendor: 'Self-hosted', tier: 'Small', aedPerMillion: 5 },
]

const RISK_LEVELS = [
  { level: 'Low', definition: 'No personal or restricted data; reversible output; human review optional.', maxAutonomy: 'L5', gate: 'Business evaluation' },
  { level: 'Medium', definition: 'Internal data; output affects a business record; human review required before commit.', maxAutonomy: 'L4', gate: 'Risk review' },
  { level: 'High', definition: 'Restricted data, customer-facing, or safety-classified; mandatory human control point.', maxAutonomy: 'L3', gate: 'Risk review + probation' },
]

const ACCESS_MATRIX = [
  { capability: 'View every module', CAIO: 'Yes', CIO: 'Yes', EVP: 'Yes', 'Section Manager': 'Own section', 'Agent Manager': 'Own agents' },
  { capability: 'Approve a Value Realization record', CAIO: 'Yes', CIO: 'No', EVP: 'Yes', 'Section Manager': 'No', 'Agent Manager': 'No' },
  { capability: 'Change an agent\'s autonomy level', CAIO: 'Yes', CIO: 'Yes', EVP: 'No', 'Section Manager': 'No', 'Agent Manager': 'Request only' },
  { capability: 'Trigger an agent kill switch', CAIO: 'Yes', CIO: 'Yes', EVP: 'No', 'Section Manager': 'Own section', 'Agent Manager': 'Own agents' },
  { capability: 'Edit a Quality Procedure', CAIO: 'No', CIO: 'No', EVP: 'No', 'Section Manager': 'Own section', 'Agent Manager': 'No' },
  { capability: 'Set a token budget', CAIO: 'Yes', CIO: 'Yes', EVP: 'No', 'Section Manager': 'No', 'Agent Manager': 'No' },
]

const DATA_REFRESH = [
  { source: 'SAP S/4HANA (master data)', cadence: 'Nightly, 02:00 GST', mode: 'Batch', lastRun: '2026-07-31 02:04', status: 'Healthy' },
  { source: 'SAP HCM (organization and positions)', cadence: 'Nightly, 02:30 GST', mode: 'Batch', lastRun: '2026-07-31 02:33', status: 'Healthy' },
  { source: 'D2D demand portal', cadence: 'Every 15 minutes', mode: 'Incremental', lastRun: '2026-07-31 09:45', status: 'Healthy' },
  { source: 'Microsoft Graph (Copilot adoption)', cadence: 'Daily, 06:00 GST', mode: 'Batch', lastRun: '2026-07-31 06:02', status: 'Healthy' },
  { source: 'Agent runtime telemetry', cadence: 'Streaming', mode: 'Event', lastRun: 'Live', status: 'Healthy' },
  { source: 'Token metering', cadence: 'Hourly', mode: 'Incremental', lastRun: '2026-07-31 09:00', status: 'Degraded' },
  { source: 'Finance validation (VR benefits)', cadence: 'Monthly close', mode: 'Manual', lastRun: '2026-07-01', status: 'Healthy' },
]

/**
 * `rows` is a function so the register is derived at render time from the live
 * dataset — an Administration screen showing a stale copy of master data would
 * be worse than no screen at all.
 */
export const ADMIN_SCREENS = [
  {
    slug: 'organization-master',
    label: 'Organization Master',
    description: 'The enterprise hierarchy every other module hangs off: 4 divisions, 8 super departments, 16 departments, 25 sections.',
    idKey: 'id',
    rows: () => dataset.orgNodes.map((n) => ({
      id: n.id, name: n.name, level: n.level, parent: n.parentId ? orgName(n.parentId) : '—',
      mandate: n.mandate ?? '—',
    })),
    columns: [
      { key: 'id', header: 'ID', width: 96, mono: true },
      { key: 'name', header: 'Name', flex: 2.2 },
      { key: 'level', header: 'Level', width: 150 },
      { key: 'parent', header: 'Reports into', flex: 1.6 },
      { key: 'mandate', header: 'Mandate', flex: 2.6 },
    ],
  },
  {
    slug: 'positions',
    label: 'Positions',
    description: 'Every position, its workforce type, and the measured AI coverage of its work.',
    idKey: 'id',
    rows: () => dataset.positions.map((p) => ({
      id: p.id, title: p.title, section: orgName(p.sectionId),
      workforceType: WORKFORCE_TYPE_LABELS[p.workforceType],
      aiCoveragePct: `${p.aiWorkCoveragePct}%`,
      agents: p.assignedAgentIds.length,
    })),
    columns: [
      { key: 'id', header: 'ID', width: 120, mono: true },
      { key: 'title', header: 'Position', flex: 2 },
      { key: 'section', header: 'Section', flex: 1.8 },
      { key: 'workforceType', header: 'Workforce type', flex: 1.5 },
      { key: 'aiCoveragePct', header: 'AI coverage', width: 110 },
      { key: 'agents', header: 'Agents', width: 90 },
    ],
  },
  {
    slug: 'employees',
    label: 'Employees',
    description: 'Human employees. Names are synthetic — no real DEWA employee data is used anywhere in this prototype.',
    idKey: 'id',
    rows: () => dataset.employees.map((e) => ({
      id: e.id, name: e.name, section: orgName(e.sectionId),
      position: dataset.positions.find((p) => p.id === e.positionId)?.title ?? '—',
      copilot: e.copilotLicensed ? 'Licensed' : 'Not licensed',
      hireDate: e.hireDate,
    })),
    columns: [
      { key: 'id', header: 'ID', width: 100, mono: true },
      { key: 'name', header: 'Name', flex: 1.6 },
      { key: 'position', header: 'Position', flex: 1.8 },
      { key: 'section', header: 'Section', flex: 1.8 },
      { key: 'copilot', header: 'Copilot', width: 120 },
      { key: 'hireDate', header: 'Hired', width: 110, mono: true },
    ],
  },
  {
    slug: 'agents',
    label: 'Agents',
    description: 'The digital employee registry as configuration: identity, owners, autonomy and status.',
    idKey: 'id',
    rows: () => dataset.agents.map((a) => ({
      id: a.id, name: a.name, jobTitle: a.digitalJobTitle,
      section: orgName(a.orgAssignment.sectionId),
      autonomy: `${a.autonomyLevel} — ${AGENTICITY_LABELS[a.autonomyLevel]}`,
      model: a.model, status: a.status, owner: employeeName(a.businessOwnerEmployeeId),
    })),
    columns: [
      { key: 'id', header: 'ID', width: 130, mono: true },
      { key: 'name', header: 'Agent', flex: 1.8 },
      { key: 'jobTitle', header: 'Digital job title', flex: 1.8 },
      { key: 'autonomy', header: 'Autonomy', flex: 1.8 },
      { key: 'model', header: 'Model', flex: 1.3 },
      { key: 'owner', header: 'Business owner', flex: 1.4 },
      { key: 'status', header: 'Status', width: 120, badge: true },
    ],
  },
  {
    slug: 'processes',
    label: 'Processes',
    description: 'Registered business processes with their current and target agenticity.',
    idKey: 'id',
    rows: () => dataset.processes.map((p) => ({
      id: p.id, name: p.name, division: orgName(p.divisionId), owner: orgName(p.ownerSectionId),
      current: p.currentAgenticity, target: p.targetAgenticity,
      readiness: `${p.readinessScore}%`, risk: p.riskScore,
    })),
    columns: [
      { key: 'id', header: 'ID', width: 110, mono: true },
      { key: 'name', header: 'Process', flex: 2 },
      { key: 'owner', header: 'Owning section', flex: 1.8 },
      { key: 'current', header: 'Current', width: 90 },
      { key: 'target', header: 'Target', width: 90 },
      { key: 'readiness', header: 'Readiness', width: 110 },
      { key: 'risk', header: 'Risk', width: 80 },
    ],
  },
  {
    slug: 'quality-procedures',
    label: 'Quality Procedures',
    description: 'The control boundaries agents operate inside, with their human-control indicator.',
    idKey: 'id',
    rows: () => dataset.qualityProcedures.map((q) => ({
      id: q.id, title: q.title, owner: orgName(q.sectionOwnerId), version: q.version,
      status: q.status, indicator: `${q.indicator} — ${QP_INDICATOR_LABELS[q.indicator]}`,
      review: q.reviewDate,
    })),
    columns: [
      { key: 'id', header: 'ID', width: 90, mono: true },
      { key: 'title', header: 'Quality Procedure', flex: 2.2 },
      { key: 'owner', header: 'Owning section', flex: 1.6 },
      { key: 'indicator', header: 'Control indicator', flex: 2 },
      { key: 'version', header: 'Version', width: 90 },
      { key: 'review', header: 'Review date', width: 120, mono: true },
      { key: 'status', header: 'Status', width: 120, badge: true },
    ],
  },
  {
    slug: 'strategic-objectives',
    label: 'Strategic Objectives',
    description: 'The enterprise objectives every AI initiative must trace back to.',
    idKey: 'id',
    rows: () => dataset.strategicObjectives.map((o) => ({
      id: o.id, name: o.name, description: o.description,
      criteria: o.excellenceCriterionIds.length,
      initiatives: dataset.aiInitiatives.filter((i) => i.strategicObjectiveId === o.id).length,
    })),
    columns: [
      { key: 'id', header: 'ID', width: 90, mono: true },
      { key: 'name', header: 'Objective', flex: 1.6 },
      { key: 'description', header: 'Description', flex: 3 },
      { key: 'criteria', header: 'Criteria', width: 90 },
      { key: 'initiatives', header: 'Initiatives', width: 100 },
    ],
  },
  {
    slug: 'excellence-criteria',
    label: 'Excellence Criteria',
    description: 'Measurable criteria with a baseline, current value and target — the basis of excellence improvement.',
    idKey: 'id',
    rows: () => dataset.excellenceCriteria.map((c) => ({
      id: c.id, name: c.name,
      objective: dataset.strategicObjectives.find((o) => o.id === c.strategicObjectiveId)?.name ?? '—',
      unit: c.unit, baseline: c.baselineScore, current: c.currentScore, target: c.targetScore,
      direction: c.higherIsBetter ? 'Higher is better' : 'Lower is better',
    })),
    columns: [
      { key: 'id', header: 'ID', width: 80, mono: true },
      { key: 'name', header: 'Criterion', flex: 1.8 },
      { key: 'objective', header: 'Objective', flex: 1.6 },
      { key: 'unit', header: 'Unit', width: 120 },
      { key: 'baseline', header: 'Baseline', width: 100, mono: true },
      { key: 'current', header: 'Current', width: 100, mono: true },
      { key: 'target', header: 'Target', width: 100, mono: true },
      { key: 'direction', header: 'Direction', width: 150 },
    ],
  },
  {
    slug: 'ai-initiatives',
    label: 'AI Initiatives',
    description: 'The AI portfolio, its delivery stage and the objective each initiative carries.',
    idKey: 'id',
    rows: () => dataset.aiInitiatives.map((i) => ({
      id: i.id, title: i.title, division: orgName(i.divisionId),
      objective: dataset.strategicObjectives.find((o) => o.id === i.strategicObjectiveId)?.name ?? '—',
      stage: i.stage, status: i.status, risk: i.riskLevel,
    })),
    columns: [
      { key: 'id', header: 'ID', width: 90, mono: true },
      { key: 'title', header: 'Initiative', flex: 2.2 },
      { key: 'objective', header: 'Strategic objective', flex: 1.6 },
      { key: 'stage', header: 'Stage', width: 120 },
      { key: 'risk', header: 'Risk', width: 90 },
      { key: 'status', header: 'Status', width: 110, badge: true },
    ],
  },
  {
    slug: 'harness-templates',
    label: 'Harness Templates',
    description: 'Deployed harnesses acting as templates: their workflow depth, guardrail count and deployment gate.',
    idKey: 'id',
    rows: () => dataset.harnesses.map((h) => ({
      id: h.id, name: h.name, version: h.version, status: h.status,
      blocks: h.workflowStages.length, guardrails: h.guardrails.length,
      evaluations: h.evaluationSuite.length,
      killSwitch: h.killSwitchEnabled ? 'Enabled' : 'Off',
    })),
    columns: [
      { key: 'id', header: 'ID', width: 130, mono: true },
      { key: 'name', header: 'Harness', flex: 2.2 },
      { key: 'version', header: 'Version', width: 90 },
      { key: 'blocks', header: 'Blocks', width: 90 },
      { key: 'guardrails', header: 'Guardrails', width: 110 },
      { key: 'evaluations', header: 'Evaluations', width: 110 },
      { key: 'killSwitch', header: 'Kill switch', width: 110 },
      { key: 'status', header: 'Gate', width: 150, badge: true },
    ],
  },
  {
    slug: 'models',
    label: 'Models',
    description: 'The approved model catalogue. Tier drives the small-model routing rate in Token Economics.',
    idKey: 'model',
    rows: () => MODEL_RATES.map((m) => ({
      ...m,
      agents: dataset.agents.filter((a) => a.model === m.model).length,
    })),
    columns: [
      { key: 'model', header: 'Model', flex: 1.8 },
      { key: 'vendor', header: 'Vendor', flex: 1.3 },
      { key: 'tier', header: 'Tier', width: 110, badge: true },
      { key: 'aedPerMillion', header: 'AED per million tokens', width: 190, mono: true },
      { key: 'agents', header: 'Agents using', width: 130 },
    ],
  },
  {
    slug: 'token-prices',
    label: 'Token Prices',
    description: 'The rate card the token ledger bills against, with observed consumption per model.',
    idKey: 'model',
    rows: () => MODEL_RATES.map((m) => {
      const rows = dataset.tokenUsage.filter((t) => t.level === 'Model' && t.model === m.model)
      const tokens = rows.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0)
      return {
        model: m.model, aedPerMillion: m.aedPerMillion,
        tokens: tokens.toLocaleString(),
        cost: rows.reduce((s, t) => s + t.cost, 0).toLocaleString(),
        cachedDiscount: '85% of cached input billed at zero',
      }
    }),
    columns: [
      { key: 'model', header: 'Model', flex: 1.8 },
      { key: 'aedPerMillion', header: 'AED / M tokens', width: 140, mono: true },
      { key: 'tokens', header: 'Tokens consumed', width: 170, mono: true },
      { key: 'cost', header: 'Cost (AED)', width: 130, mono: true },
      { key: 'cachedDiscount', header: 'Cache policy', flex: 1.8 },
    ],
  },
  {
    slug: 'cost-categories',
    label: 'Cost Categories',
    description: 'The eleven AI cost categories a Value Realization record can book against.',
    idKey: 'category',
    rows: () => Object.entries(COST_LABELS).map(([category, label]) => {
      const lines = dataset.vrRecords.flatMap((v) => v.aiCost.filter((c) => c.category === category))
      return {
        category, label,
        records: lines.length,
        total: lines.reduce((s, l) => s + l.amount, 0).toLocaleString(),
      }
    }),
    columns: [
      { key: 'label', header: 'Cost category', flex: 2 },
      { key: 'category', header: 'Key', flex: 1.4, mono: true },
      { key: 'records', header: 'VR records', width: 120 },
      { key: 'total', header: 'Booked (AED)', width: 150, mono: true },
    ],
  },
  {
    slug: 'benefit-categories',
    label: 'Benefit Categories',
    description: 'The twelve benefit categories a Value Realization record can claim under.',
    idKey: 'category',
    rows: () => Object.entries(BENEFIT_LABELS).map(([category, label]) => {
      const records = dataset.vrRecords.filter((v) => v.benefitType === category)
      return {
        category, label,
        records: records.length,
        total: records.reduce((s, v) => s + v.grossBenefit, 0).toLocaleString(),
      }
    }),
    columns: [
      { key: 'label', header: 'Benefit category', flex: 2 },
      { key: 'category', header: 'Key', flex: 1.4, mono: true },
      { key: 'records', header: 'VR records', width: 120 },
      { key: 'total', header: 'Gross benefit (AED)', width: 170, mono: true },
    ],
  },
  {
    slug: 'risk-levels',
    label: 'Risk Levels',
    description: 'What each risk level means, the autonomy it permits, and the gate it must clear.',
    idKey: 'level',
    rows: () => RISK_LEVELS.map((r) => ({
      ...r,
      initiatives: dataset.aiInitiatives.filter((i) => i.riskLevel === r.level).length,
    })),
    columns: [
      { key: 'level', header: 'Risk level', width: 120, badge: true },
      { key: 'definition', header: 'Definition', flex: 3 },
      { key: 'maxAutonomy', header: 'Max autonomy', width: 130 },
      { key: 'gate', header: 'Required gate', flex: 1.4 },
      { key: 'initiatives', header: 'Initiatives', width: 110 },
    ],
  },
  {
    slug: 'user-roles',
    label: 'User Roles',
    description: 'The roles the topbar role switcher simulates, and what each one is accountable for.',
    idKey: 'id',
    rows: () => ROLES.map((r) => ({ id: r.id, name: r.name, description: r.description })),
    columns: [
      { key: 'id', header: 'ID', width: 110, mono: true },
      { key: 'name', header: 'Role', flex: 1.4 },
      { key: 'description', header: 'Accountable for', flex: 3.4 },
    ],
  },
  {
    slug: 'access-permissions',
    label: 'Access Permissions',
    description: 'The capability matrix behind the role switcher. Enforcement belongs to enterprise SSO and RBAC in production.',
    idKey: 'capability',
    rows: () => ACCESS_MATRIX,
    columns: [
      { key: 'capability', header: 'Capability', flex: 2.4 },
      { key: 'CAIO', header: 'CAIO', width: 110 },
      { key: 'CIO', header: 'CIO', width: 110 },
      { key: 'EVP', header: 'EVP', width: 110 },
      { key: 'Section Manager', header: 'Section Manager', width: 150 },
      { key: 'Agent Manager', header: 'Agent Manager', width: 150 },
    ],
  },
  {
    slug: 'data-refresh',
    label: 'Data Refresh',
    description: 'Where each part of the model comes from and how often it lands. Cadences are the target design, not live telemetry.',
    idKey: 'source',
    rows: () => DATA_REFRESH,
    columns: [
      { key: 'source', header: 'Source', flex: 2.2 },
      { key: 'cadence', header: 'Cadence', flex: 1.4 },
      { key: 'mode', header: 'Mode', width: 120 },
      { key: 'lastRun', header: 'Last run', width: 160, mono: true },
      { key: 'status', header: 'Status', width: 120, badge: true },
    ],
  },
  {
    slug: 'integration-status',
    label: 'Integration Status',
    description: 'The Section 22 platform integration map: which enterprise system each part of the Control Tower reads from.',
    // Rendered by its own component rather than the generic register — it is an
    // architecture view, not a table of records.
    custom: 'integration',
  },
]

export const adminScreenBySlug = (slug) => ADMIN_SCREENS.find((s) => s.slug === slug)
