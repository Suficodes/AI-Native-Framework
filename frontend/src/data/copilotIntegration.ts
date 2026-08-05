// GitHub Copilot integration content — how the IDE DEWA's engineers already
// use connects to the repositories, and what flows back out of it into this
// Control Tower.
//
// Kept separate from versionControlGuide.ts so both stay inside the 200-line
// module cap and each has one responsibility.

export interface ContextItem {
  label: string
  detail: string
}

export interface ControlItem {
  control: string
  where: string
  effect: string
}

export interface TelemetrySource {
  source: string
  provides: string
  refresh: string
  consumedBy: string
}

/** What the IDE sends to Copilot as context when an engineer is working. */
export const CONTEXT_PULLED: ContextItem[] = [
  { label: 'Open file and selection', detail: 'The code in front of the engineer, plus the cursor position' },
  { label: 'Neighbouring open tabs', detail: 'Related files already open, for consistent naming and patterns' },
  { label: 'Repository index', detail: 'Semantic search across the repo, so a suggestion matches how this codebase does things' },
  { label: 'copilot-instructions.md', detail: 'Repo-level standards injected into every request — the governance hook' },
  { label: 'Pull request diff', detail: 'On review, the change under discussion and its surrounding code' },
]

/** What must never reach it, and the mechanism that stops it. */
export const CONTEXT_EXCLUDED: ContextItem[] = [
  { label: 'Restricted paths', detail: 'Content exclusion rules at org and repo level — the file is never sent' },
  { label: 'Secrets and .env files', detail: 'Excluded by path, and caught again by secret scanning on push' },
  { label: 'Customer and personal data', detail: 'Not in the repository in the first place — it lives in the data platform' },
  { label: 'Restricted-classification code', detail: 'Repositories opted out of Copilot entirely by policy' },
]

/**
 * The controls that make Copilot governable rather than merely available.
 * This is the part that matters to a CAIO — Copilot is already in the IDE;
 * the question is what constrains it.
 */
export const COPILOT_CONTROLS: ControlItem[] = [
  {
    control: 'copilot-instructions.md',
    where: 'Every repository, committed and reviewed',
    effect: 'DEWA coding standards, security baselines and the owning Quality Procedure are prepended to every Copilot request in that repo.',
  },
  {
    control: 'Content exclusion',
    where: 'Organization and repository policy',
    effect: 'Named paths are never transmitted as context. Enforced by the platform, not by developer discipline.',
  },
  {
    control: 'Copilot code review',
    where: 'Pull request, before human review',
    effect: 'A first pass on every PR so reviewers spend their attention on design rather than on style and obvious defects.',
  },
  {
    control: 'Organization-wide policy',
    where: 'GitHub organization settings',
    effect: 'Which models are permitted, whether suggestions matching public code are blocked, and who holds a seat.',
  },
  {
    control: 'Audit log',
    where: 'GitHub organization',
    effect: 'Every policy change, seat grant and exclusion edit is recorded — the evidence a Quality Procedure review asks for.',
  },
]

/** What DEWA pulls back out of GitHub, and which module consumes it. */
export const TELEMETRY_SOURCES: TelemetrySource[] = [
  {
    source: 'Copilot Metrics API',
    provides: 'Active users, suggestions shown and accepted, acceptance rate, lines accepted — by editor, language and team.',
    refresh: 'Daily',
    consumedBy: 'Copilot & Workforce',
  },
  {
    source: 'Copilot seat assignments',
    provides: 'Who holds a licence, when it was last used, and which team it belongs to.',
    refresh: 'Daily',
    consumedBy: 'Copilot & Workforce',
  },
  {
    source: 'Repository and PR events',
    provides: 'Commits, pull requests, review latency, check outcomes — delivery throughput per initiative.',
    refresh: 'Near real time (webhook)',
    consumedBy: 'Performance',
  },
  {
    source: 'Actions workflow runs',
    provides: 'Evaluation results, QP control checks and deployment outcomes per harness version.',
    refresh: 'Per run',
    consumedBy: 'Observability',
  },
  {
    source: 'Organization audit log',
    provides: 'Policy changes, seat grants, content-exclusion edits, access changes.',
    refresh: 'Daily',
    consumedBy: 'Administration',
  },
  {
    source: 'Billing and usage',
    provides: 'Copilot seat cost, alongside model spend from the agent platform.',
    refresh: 'Monthly',
    consumedBy: 'Token Economics',
  },
]

export const INTEGRATION_NOTES = {
  direction:
    'The connection is read-only in this direction: the Control Tower reads from GitHub, it never writes to a repository. Nothing on these screens can change code.',
  identity:
    'Access is a GitHub App scoped to the organization, authenticated per installation, with the same least-privilege scopes the MCP connectors use.',
  boundary:
    'Only metadata and aggregate metrics cross the boundary. Source code is not copied into the Control Tower — a link points back to the commit on GitHub.',
}
