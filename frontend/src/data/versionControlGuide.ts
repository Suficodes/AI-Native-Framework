// Content for the Version Control guide, held as data rather than baked into
// JSX — same rule the rest of this prototype follows, and it keeps the page
// component inside its size cap.
//
// This is guidance for the projects DEWA will run, not a record of how this
// prototype itself was built.

export interface GuidePoint {
  title: string
  body: string
}

export interface BoundaryItem {
  label: string
  detail: string
}

export interface RepoRow {
  name: string
  purpose: string
  owner: string
  visibility: 'Internal' | 'Private'
}

export interface GateRow {
  check: string
  blocks: string
  rationale: string
}

/** Why version control is not optional once agents are in production. */
export const WHY_IT_MATTERS: GuidePoint[] = [
  {
    title: 'Reproducibility',
    body: 'An agent output is only defensible if you can say exactly which prompt, harness version and model produced it. That mapping lives in a commit, not in someone’s memory.',
  },
  {
    title: 'Audit evidence, for free',
    body: 'Quality Procedures demand who changed what, when, and who approved it. A protected branch with reviewed pull requests produces that record as a by-product of working normally.',
  },
  {
    title: 'Rollback in minutes',
    body: 'A prompt change that degrades quality is reverted by reverting a commit. Without version control the only fix is rebuilding from whatever the last person remembers.',
  },
  {
    title: 'Many teams, one codebase',
    body: 'Divisions ship in parallel without overwriting each other. Branches make concurrent work safe; merges make it visible.',
  },
]

/**
 * The most common misconception to correct up front: source control carries
 * *definitions*, not operational data. Getting this wrong is how PII and
 * credentials end up in a repository permanently.
 */
export const GOES_IN_GIT: BoundaryItem[] = [
  { label: 'Agent and harness definitions', detail: 'Prompts, tool lists, guardrails, evaluation criteria' },
  { label: 'Quality Procedures as code', detail: 'Control checks expressed as tests that run on every change' },
  { label: 'Infrastructure as code', detail: 'Environments, permissions and connectors, declared not clicked' },
  { label: 'Pipelines and tests', detail: 'Build, evaluation and deployment definitions' },
  { label: 'Schema and migrations', detail: 'The shape of data, versioned alongside the code that reads it' },
  { label: 'Documentation', detail: 'Decisions and runbooks, next to what they describe' },
]

export const NEVER_IN_GIT: BoundaryItem[] = [
  { label: 'Secrets and credentials', detail: 'Key vault, referenced by name — a committed secret is compromised forever' },
  { label: 'Customer and personal data', detail: 'Enterprise data platform, under its own access controls' },
  { label: 'Model weights and large binaries', detail: 'Model registry or artifact store, referenced by version' },
  { label: 'Run logs and traces', detail: 'Observability platform, where they can be queried and expired' },
  { label: 'Build outputs', detail: 'Artifact registry — rebuildable from source, so storing them adds only drift' },
]

/** Repository topology once there are dozens of AI projects rather than one. */
export const REPO_TYPES: RepoRow[] = [
  {
    name: 'dewa-ai-platform',
    purpose: 'Shared runtime, agent scaffolding and connector clients every project builds on.',
    owner: 'AI Platform Section',
    visibility: 'Internal',
  },
  {
    name: 'dewa-ai-capability-<skill>',
    purpose: 'One reusable skill per repo, versioned and released independently so consumers pin a version.',
    owner: 'Owning section',
    visibility: 'Internal',
  },
  {
    name: 'dewa-ai-<division>-<initiative>',
    purpose: 'A delivery repo per AI initiative — its agents, harnesses, evaluations and pipelines.',
    owner: 'Delivering division',
    visibility: 'Private',
  },
  {
    name: 'dewa-ai-infrastructure',
    purpose: 'Environments, network policy, identity and connector provisioning as code.',
    owner: 'AI Platform Section',
    visibility: 'Private',
  },
  {
    name: 'dewa-ai-templates',
    purpose: 'Template repositories that scaffold a compliant project with gates already wired in.',
    owner: 'AI Platform Section',
    visibility: 'Internal',
  },
]

/** What has to pass before a change reaches main. */
export const MERGE_GATES: GateRow[] = [
  { check: 'Automated tests', blocks: 'Merge', rationale: 'Regression in behaviour the team already agreed on.' },
  { check: 'Agent evaluation suite', blocks: 'Merge', rationale: 'A prompt change can pass every unit test and still degrade answer quality.' },
  { check: 'Quality Procedure controls', blocks: 'Merge', rationale: 'The QP’s mandatory controls are asserted as code, so drift is caught before release.' },
  { check: 'Secret and dependency scan', blocks: 'Merge', rationale: 'Catches a committed credential while it is still cheap to rotate.' },
  { check: 'Peer review', blocks: 'Merge', rationale: 'One approval normally; two for any change raising an agent above L3 autonomy.' },
  { check: 'Risk owner sign-off', blocks: 'Release', rationale: 'Required where the harness touches restricted data or customer-facing decisions.' },
]

export const PRINCIPLES: GuidePoint[] = [
  {
    title: 'main is always deployable',
    body: 'Protected, never committed to directly, and green at all times. If main is broken, fixing it outranks new work.',
  },
  {
    title: 'Branches live days, not months',
    body: 'Short-lived branches merge cleanly. A branch open for six weeks becomes a second codebase that has to be reconciled.',
  },
  {
    title: 'Release by tag, deploy by promotion',
    body: 'A tagged commit is promoted through environments unchanged. What was tested in staging is byte-identical to what reaches production.',
  },
  {
    title: 'One initiative, one repository',
    body: 'Traceable ownership from AI initiative to repo to deployed agent — and a clean boundary when an initiative is retired.',
  },
]
