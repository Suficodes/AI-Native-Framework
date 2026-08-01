// AI Playbook seed (requirements doc Section 10). The playbook itself is
// *derived*, not seeded — data/playbookAggregates.ts builds all 15 sections
// from the rest of the dataset. Only the inputs that genuinely have no home
// elsewhere in the model live here:
//
//   - narrative constants (vision, operating-model principles, governance
//     rules, sourcing criteria, baseline harness requirements) — enterprise
//     doctrine, identical whatever the scope, so a plain export, not an entity;
//   - two real entities the model was missing: ReusableSkill (Section 10.15,
//     also the "Skill" level of the Section 15 token hierarchy) and
//     PlaybookLesson (Section 10.14).
import type {
  Harness, HarnessRequirementCategory, OrgNode, PlaybookLesson,
  PlaybookSourcingCriterion, Process, ReusableSkill,
} from '../types'
import { nextLessonId, nextSkillId } from '../ids'
import { type Rng, int, pick, pickMany } from '../rng'

// ─────────────────────────── 1. AI-native vision ───────────────────────────

export const VISION_STATEMENT =
  'Every process is designed for human–agent collaboration: agents carry the repeatable, '
  + 'evidence-bound work inside approved boundaries, humans own judgement, exceptions, '
  + 'relationships and accountability — and every unit of AI work is measured, governed '
  + 'and converted into verified business value.'

/**
 * Vision pillars. `measure` names the derived metric that fills currentPct/targetPct —
 * the copy is fixed, the numbers are always recomputed for the active scope.
 */
export const VISION_PILLARS: { name: string; description: string; measure: string }[] = [
  {
    name: 'Agentic processes',
    description: 'Processes are re-designed around agent-executable steps with explicit human control points, not automated as-is.',
    measure: 'Average process agenticity, current vs target',
  },
  {
    name: 'Governed digital workforce',
    description: 'Agents are managed like employees: a digital job description, named owners, performance reviews, and a probation gate.',
    measure: 'Share of in-scope agents in Production or ScaleApproved',
  },
  {
    name: 'Verified AI work contribution',
    description: 'AI contribution is evidenced from process and work-item data, never inferred from licence or usage counts.',
    measure: 'AI work coverage across in-scope positions',
  },
  {
    name: 'Value-backed spend',
    description: 'Token and delivery spend is justified against validated benefit, per outcome and per hour released.',
    measure: 'Benefit realization against approved target',
  },
]

// ─────────────────────────── 2. Human–agent operating model ───────────────────────────

export const OPERATING_MODEL_PRINCIPLES = [
  'Design the process first; assign the worker — human, copilot, or agent — second.',
  'Every agent operates inside an approved boundary defined by a Quality Procedure.',
  'A human is accountable for every agent outcome; accountability is never delegated to a model.',
  'Mandatory control points (QP indicator C) stay human and cannot be automated away.',
  'Exceptions escalate to a named human role, not to a retry loop.',
  'Capacity released by agents is redeployed deliberately, and recorded as redeployed.',
]

export const HUMAN_ACCOUNTABILITIES = [
  'Own the business outcome and the customer relationship',
  'Approve, reject, or amend agent output at defined control points',
  'Handle exceptions, ambiguity, and first-of-a-kind cases',
  'Supervise assigned agents and act on performance reviews',
  'Maintain the Quality Procedure the agent executes against',
  'Sign off value realization evidence',
]

export const AGENT_ACCOUNTABILITIES = [
  'Execute the approved workflow within the harness boundary',
  'Retrieve only from approved knowledge sources and cite them',
  'Draft, validate, and structure output to the approved template',
  'Flag missing information rather than filling gaps by inference',
  'Log every step, tool call, and token to the observability store',
  'Stop and escalate on repeated failure or low confidence',
]

// ─────────────────────────── 7. Buy / configure / build ───────────────────────────

export const SOURCING_CRITERIA: Omit<PlaybookSourcingCriterion, 'recommendedCount'>[] = [
  {
    decision: 'Buy',
    whenToUse: [
      'The capability is generic productivity work (drafting, summarizing, meeting notes)',
      'No DEWA-specific process logic or Quality Procedure is encoded',
      'Enterprise data access is already covered by the existing licence and tenant controls',
    ],
    platforms: ['Microsoft 365 Copilot', 'SAP Joule', 'Vendor-embedded copilots'],
  },
  {
    decision: 'Configure',
    whenToUse: [
      'The workflow is standard but the knowledge, prompts, and approvals are DEWA-specific',
      'Required tools are available as pre-built connectors',
      'Autonomy stays at or below L3 with a human approval step',
    ],
    platforms: ['Microsoft Copilot Studio', 'SAP Build Process Automation', 'Neptune DXP workflow'],
  },
  {
    decision: 'Build',
    whenToUse: [
      'The agent runs a full harness: multi-step reasoning, custom evaluations, and guardrails',
      'Integration spans systems no connector covers, or requires bespoke controls',
      'Autonomy is L4 or above, or the risk profile demands a custom evaluation suite',
    ],
    platforms: ['Enterprise AI platform (custom harness)', 'AI Platform Section runtime'],
  },
]

// ─────────────────────────── 9. Harness requirements ───────────────────────────

export const BASELINE_HARNESS_REQUIREMENTS: {
  requirement: string
  category: HarnessRequirementCategory
  /** Which harness field the derivation checks to decide Met / Partial / NotMet. */
  check: 'workflowStages' | 'guardrails' | 'humanApprovalPoints' | 'evaluationSuite' | 'loggingPolicy' | 'tokenLimit'
}[] = [
  { requirement: 'Implements all 11 workflow blocks, trigger through value update', category: 'Structure', check: 'workflowStages' },
  { requirement: 'Declares guardrails covering fabrication, approved knowledge, and restricted data', category: 'Guardrails', check: 'guardrails' },
  { requirement: 'Defines at least one named human approval point before commit', category: 'HumanControl', check: 'humanApprovalPoints' },
  { requirement: 'Runs an evaluation suite with a scored quality gate before release', category: 'Evaluation', check: 'evaluationSuite' },
  { requirement: 'Logs every step, tool call, and token to the observability store', category: 'Observability', check: 'loggingPolicy' },
  { requirement: 'Enforces a token limit, retry limit, and kill switch', category: 'CostControl', check: 'tokenLimit' },
]

type PlaybookHarnessRequirementCategory =
  'Structure' | 'Guardrails' | 'HumanControl' | 'Evaluation' | 'Observability' | 'CostControl'

// ─────────────────────────── 10. Governance ───────────────────────────

export const GOVERNANCE_RULES = [
  { area: 'Onboarding', rule: 'No agent enters production without a digital job description and four named owners (manager, business, technical, risk).' },
  { area: 'Boundary', rule: 'An agent may only act on processes and Quality Procedures explicitly assigned to it.' },
  { area: 'Autonomy', rule: 'Autonomy above L3 requires Risk Review sign-off and a passed probation period.' },
  { area: 'Data', rule: 'Data access is least-privilege and reviewed at every version release; restricted fields are masked in output.' },
  { area: 'Evidence', rule: 'Every agent decision is traceable to its inputs, sources, and the human who approved it.' },
  { area: 'Performance', rule: 'Agents are reviewed on the 7-dimension performance index; NeedsOptimization triggers a harness change request.' },
  { area: 'Cost', rule: 'Spend above the alert threshold notifies the business owner; above the suspension threshold the agent is suspended.' },
  { area: 'Retirement', rule: 'A retired agent keeps its audit history and its value record stays open until the VR review closes.' },
]

export const APPROVAL_GATES = [
  'Development', 'Technical testing', 'Business evaluation', 'Risk review',
  'Probation', 'Production', 'Scale approval',
]

export const ACCOUNTABLE_ROLES = [
  { role: 'Agent Manager', responsibility: 'Day-to-day supervision, exception handling, and the performance review.' },
  { role: 'Business Owner', responsibility: 'Owns the outcome, the Quality Procedure, and the value case.' },
  { role: 'Technical Owner', responsibility: 'Owns the harness, model routing, evaluations, and releases.' },
  { role: 'Risk Owner', responsibility: 'Owns guardrails, data classification, and the kill-switch decision.' },
  { role: 'Value Owner', responsibility: 'Owns baseline, benefit evidence, and VR validation through to realized.' },
]

// ─────────────────────────── 12. Token budget guidance ───────────────────────────

export const TOKEN_BUDGET_GUIDANCE = [
  'Route to the smallest model that passes the evaluation suite; reserve reasoning models for exception paths.',
  'Cache the stable context (templates, standards, Quality Procedures) — it is the cheapest coverage gain available.',
  'Cap retries at the harness level; a retry that will not succeed is pure cost.',
  'Budget per outcome, not per prompt — the control metric is cost per successful business outcome.',
  'Review any agent whose cost per verified hour released exceeds the loaded cost of the hour it releases.',
]

// ─────────────────────────── 15. Approved reusable skills ───────────────────────────

const SKILL_DEFS: { name: string; description: string; category: ReusableSkill['category'] }[] = [
  { name: 'Approved-source retrieval', description: 'Retrieve and rank passages from the approved enterprise knowledge set, returning citations with every passage.', category: 'Retrieval' },
  { name: 'Template-compliant drafting', description: 'Draft a document section against an approved DEWA template, preserving mandatory headings and fields.', category: 'Document' },
  { name: 'Completeness validation', description: 'Check a record or document against a required-field checklist and list what is missing, never inferring the gap.', category: 'Validation' },
  { name: 'Duplicate identification', description: 'Compare an incoming record against historical records and surface probable duplicates with a similarity rationale.', category: 'Analysis' },
  { name: 'Stakeholder identification', description: 'Derive the affected roles and sections for a demand or change from the org model and process ownership.', category: 'Analysis' },
  { name: 'Architecture and security screening', description: 'Screen a proposed solution against enterprise architecture standards and security baselines, flagging deviations.', category: 'Validation' },
  { name: 'Restricted-data masking', description: 'Detect and mask personal, commercial, and security-classified fields before any output leaves the boundary.', category: 'Validation' },
  { name: 'SAP record read', description: 'Read master and transactional records from the approved SAP services with least-privilege scopes.', category: 'Integration' },
  { name: 'D2D demand read/write', description: 'Read D2D demand records and commit approved updates back to the demand portal with an audit stamp.', category: 'Integration' },
  { name: 'Evidence pack assembly', description: 'Assemble the traceability pack — inputs, sources, evaluation scores, approver — for an audit or VR review.', category: 'Document' },
  { name: 'Executive summarization', description: 'Summarize a long artefact into a decision-grade brief with explicit confidence and open questions.', category: 'Communication' },
  { name: 'Exception escalation notice', description: 'Compose and route an escalation to the accountable human role with the failure trace attached.', category: 'Communication' },
]

const SKILL_MATURITY: ReusableSkill['maturity'][] = ['Pilot', 'Approved', 'Standard']

export function buildReusableSkills(rng: Rng, orgNodes: OrgNode[], harnesses: Harness[]): ReusableSkill[] {
  // Skills are platform assets — owned by the AI Platform Section where one
  // exists, otherwise by whichever section owns the harnesses that use them.
  const aiPlatform = orgNodes.find((n) => n.name === 'AI Platform Section')
  const sections = orgNodes.filter((n) => n.level === 'Section')
  const fallback = aiPlatform ?? sections[0]

  return SKILL_DEFS.map((def) => {
    const users = pickMany(rng, harnesses, int(rng, 1, 5))
    return {
      id: nextSkillId(),
      name: def.name,
      description: def.description,
      category: def.category,
      ownerSectionId: (def.category === 'Integration' ? fallback : pick(rng, [fallback, ...sections.slice(0, 6)])).id,
      maturity: pick(rng, SKILL_MATURITY),
      approvedForAutonomy: pick(rng, ['L2', 'L3', 'L4'] as const),
      usedByHarnessIds: users.map((h) => h.id),
      reuseCount: users.length * int(rng, 4, 40),
      avgTokenCostPerCall: int(rng, 400, 9000),
    }
  })
}

// ─────────────────────────── 14. Lessons learned ───────────────────────────

const LESSON_DEFS: Omit<PlaybookLesson, 'id' | 'appliesToProcessIds' | 'appliesToDivisionIds'>[] = [
  {
    title: 'Automating the as-is process caps the benefit',
    context: 'The first intake agent was built to mirror the existing manual sequence step for step.',
    lesson: 'Agenticity gains came from re-ordering and merging steps, not from executing the old ones faster.',
    recommendation: 'Redesign the process for agent execution before writing the harness; treat the as-is map as input, not specification.',
    sourceType: 'Delivery',
  },
  {
    title: 'Copilot licences are not adoption, and adoption is not value',
    context: 'Licence utilization reached the target while measured work contribution stayed flat.',
    lesson: 'Usage counts moved independently of any verified outcome; only work-item evidence tracked real contribution.',
    recommendation: 'Report adoption, contribution, and value as three separate measures and never substitute one for another.',
    sourceType: 'Adoption',
  },
  {
    title: 'Unbounded retrieval produced confident but unsupported output',
    context: 'An early harness retrieved from the full document store rather than an approved source list.',
    lesson: 'Output quality scores stayed high while traceability failed — reviewers could not confirm where content came from.',
    recommendation: 'Constrain retrieval to an approved source set and make citation a hard evaluation criterion, not a preference.',
    sourceType: 'Evaluation',
  },
  {
    title: 'A missing human control point surfaced only in production',
    context: 'An agent was allowed to commit a record change without a named approver during probation.',
    lesson: 'The Quality Procedure implied an approval that the harness never encoded, so nothing enforced it.',
    recommendation: 'Derive human approval points directly from the QP control indicators when designing the harness.',
    sourceType: 'Incident',
  },
  {
    title: 'Retries hid a systematic input problem',
    context: 'A high retry rate was absorbed by the harness and only visible in the token bill.',
    lesson: 'Repeated retries masked a recurring upstream data gap that a validation step would have caught immediately.',
    recommendation: 'Alert on retry rate as a quality signal, cap retries, and route repeat failures to exception handling.',
    sourceType: 'Incident',
  },
  {
    title: 'Baselines captured after go-live are not defensible',
    context: 'Benefit for an early initiative was estimated retrospectively from post-deployment numbers.',
    lesson: 'Finance validation rejected the case because no pre-implementation baseline existed to compare against.',
    recommendation: 'Register the baseline and measurement method in the VR record before build starts, not at benefit review.',
    sourceType: 'Delivery',
  },
  {
    title: 'Released capacity evaporated without a redeployment plan',
    context: 'Hours released by an assistive agent were verified but never assigned to new work.',
    lesson: 'Capacity released and capacity redeployed diverged, so the benefit never appeared in any business outcome.',
    recommendation: 'Pair every capacity-release target with a named redeployment commitment from the receiving manager.',
    sourceType: 'Delivery',
  },
  {
    title: 'Reusing an approved skill halved delivery time',
    context: 'A second department needed the same validation and citation behaviour as an existing harness.',
    lesson: 'Reusing the approved skill removed the evaluation and risk-review effort that a fresh implementation would have repeated.',
    recommendation: 'Check the approved reusable skills registry before designing any new harness block.',
    sourceType: 'Delivery',
  },
  {
    title: 'Evaluation suites drift when the process changes',
    context: 'A Quality Procedure was revised while the harness evaluation criteria stayed at the previous version.',
    lesson: 'The agent kept scoring well against criteria that no longer described the required outcome.',
    recommendation: 'Version the evaluation suite with the Quality Procedure and re-run it on every QP release.',
    sourceType: 'Evaluation',
  },
  {
    title: 'Model choice mattered less than context quality',
    context: 'A larger model was introduced to fix accuracy issues on a document-drafting agent.',
    lesson: 'Accuracy improved far more from curating the retrieved context than from the model upgrade, at a fraction of the cost.',
    recommendation: 'Exhaust context and instruction improvements before escalating model size or reasoning budget.',
    sourceType: 'Evaluation',
  },
]

export function buildPlaybookLessons(rng: Rng, processes: Process[], orgNodes: OrgNode[]): PlaybookLesson[] {
  const divisions = orgNodes.filter((n) => n.level === 'Division')
  return LESSON_DEFS.map((def) => {
    // Lessons apply to a subset of processes/divisions so scope filtering is
    // real — a section playbook must not show every enterprise lesson.
    const appliesToProcesses = pickMany(rng, processes, int(rng, 2, 5))
    const appliesToDivisions = pickMany(rng, divisions, int(rng, 1, divisions.length))
    return {
      id: nextLessonId(),
      ...def,
      appliesToProcessIds: appliesToProcesses.map((p) => p.id),
      appliesToDivisionIds: [...new Set([...appliesToDivisions.map((d) => d.id), ...appliesToProcesses.map((p) => p.divisionId)])],
    }
  })
}
