// The AI Capability Library — DEWA's shared inventory of reusable agent
// skills, the memory stores agents read from, and the MCP connectors that
// reach the enterprise systems.
//
// The skills themselves are NOT new data: they are the twelve ReusableSkill
// records already in the dataset (surfaced today only as section 15 of the AI
// Playbook). This module adds the platform-leverage view over them — how often
// each is called, and what reusing it instead of rebuilding it avoids.
//
// Memory stores and connectors are declared here because the model has no home
// for them yet. They are marked as such in the UI.
import { dataset } from './mockApi'
import type { ID, ReusableSkill } from './types'

/**
 * Blended AED per million tokens. Kept equal to tokenUsage.seed.ts's default
 * rate on purpose — the Capability Library must never quote a token cost that
 * contradicts Token Economics.
 */
export const AED_PER_MILLION_TOKENS = 30

/**
 * What building each capability bespoke costs once, in AED. Scales with how
 * much assurance the capability carries: a Validation skill approved for high
 * autonomy needs evaluation harnesses and sign-off that a Retrieval skill does
 * not. These are planning estimates, not observed spend.
 */
const BUILD_COST_BY_CATEGORY: Record<ReusableSkill['category'], number> = {
  Retrieval: 48000,
  Document: 56000,
  Communication: 52000,
  Analysis: 74000,
  Validation: 96000,
  Integration: 88000,
}

/** Maturity premium — a Standard skill carries more hardening than a Pilot. */
const MATURITY_MULTIPLIER: Record<ReusableSkill['maturity'], number> = {
  Pilot: 0.8,
  Approved: 1,
  Standard: 1.25,
}

/**
 * Calls in the current quarter. Deterministic, and deliberately held in a tight
 * 15–20 band: this is a steady-state library, not a launch spike.
 */
const callsThisQuarter = (skill: ReusableSkill, index: number) =>
  15 + ((index * 7 + skill.usedByHarnessIds.length * 3) % 6)

export interface CapabilitySkill {
  id: ID
  name: string
  description: string
  category: ReusableSkill['category']
  maturity: ReusableSkill['maturity']
  approvedForAutonomy: string
  ownerSectionId: ID
  /** Harnesses that embed this skill — the reuse multiplier. */
  reuseInstances: number
  callsThisQuarter: number
  avgTokenCostPerCall: number
  /** One-off cost of building this capability bespoke. */
  bespokeBuildCost: number
  /** Builds avoided by reusing one implementation: build × (instances − 1). */
  buildCostAvoided: number
  /** Token cost of actually running it this quarter. */
  runCostThisQuarter: number
  netAvoided: number
}

export interface MemoryStore {
  id: string
  name: string
  holds: string
  entries: number
  /** Share of agent runs that answered from memory instead of re-retrieving. */
  recallHitRatePct: number
  /** Tokens not spent this quarter because a recall replaced a re-retrieval. */
  tokensAvoided: number
  retention: string
  scope: string
}

export interface Connector {
  id: string
  name: string
  system: string
  callsThisQuarter: number
  skillsServed: number
  status: 'Live' | 'Pilot' | 'Planned'
}

export interface CapabilityLibrary {
  skills: CapabilitySkill[]
  memory: MemoryStore[]
  connectors: Connector[]
  totals: {
    skills: number
    calls: number
    reuseInstances: number
    buildCostAvoided: number
    runCost: number
    netAvoided: number
    memoryEntries: number
    memoryTokensAvoided: number
    memoryCostAvoided: number
    avgRecallHitRatePct: number
    connectors: number
    connectorCalls: number
  }
}

const aedForTokens = (tokens: number) => (tokens / 1_000_000) * AED_PER_MILLION_TOKENS

// Memory stores. Agents read these instead of re-deriving context every run,
// which is where the recall saving comes from.
const MEMORY_STORES: MemoryStore[] = [
  {
    id: 'MEM-01',
    name: 'Enterprise knowledge memory',
    holds: 'Approved policies, Quality Procedures and standards, chunked and embedded so any agent can cite the current version.',
    entries: 48210,
    recallHitRatePct: 82,
    tokensAvoided: 41_600_000,
    retention: 'Current version + 2 superseded',
    scope: 'All agents, read-only',
  },
  {
    id: 'MEM-02',
    name: 'Process execution memory',
    holds: 'How each process ran before — prior demands, estimates, routing decisions and their outcomes.',
    entries: 12480,
    recallHitRatePct: 74,
    tokensAvoided: 22_150_000,
    retention: '24 months rolling',
    scope: 'Agents assigned to the process',
  },
  {
    id: 'MEM-03',
    name: 'Customer interaction memory',
    holds: 'Prior contact history and resolution paths, so a returning customer is not asked the same questions twice.',
    entries: 30_960,
    recallHitRatePct: 68,
    tokensAvoided: 15_400_000,
    retention: '18 months, PII masked at write',
    scope: 'Customer & Digital Services only',
  },
  {
    id: 'MEM-04',
    name: 'Compliance and audit memory',
    holds: 'Every control decision, override and escalation, written once and never mutated — the evidence trail for an audit.',
    entries: 9_740,
    recallHitRatePct: 91,
    tokensAvoided: 6_800_000,
    retention: '7 years, append-only',
    scope: 'Risk, Compliance and Internal Audit',
  },
]

// MCP connectors. System names match what agents.seed.ts and harnesses already
// declare as systemAccess, so the two views cannot drift apart.
const CONNECTORS: Connector[] = [
  { id: 'MCP-01', name: 'SAP S/4HANA', system: 'Finance, procurement and asset master data', callsThisQuarter: 4820, skillsServed: 5, status: 'Live' },
  { id: 'MCP-02', name: 'D2D Demand Portal', system: 'Demand intake, estimation and delivery records', callsThisQuarter: 3610, skillsServed: 4, status: 'Live' },
  { id: 'MCP-03', name: 'Enterprise data platform', system: 'Curated analytical data across divisions', callsThisQuarter: 2940, skillsServed: 6, status: 'Live' },
  { id: 'MCP-04', name: 'Knowledge search API', system: 'Policies, Quality Procedures and standards', callsThisQuarter: 5170, skillsServed: 7, status: 'Live' },
  { id: 'MCP-05', name: 'Document generation service', system: 'Templated BRDs, reports and evidence packs', callsThisQuarter: 1880, skillsServed: 3, status: 'Live' },
  { id: 'MCP-06', name: 'SAP Neptune DXP', system: 'The delivery surface the Control Tower itself targets', callsThisQuarter: 960, skillsServed: 2, status: 'Pilot' },
  { id: 'MCP-07', name: 'GIS and network records', system: 'Asset location and network topology', callsThisQuarter: 540, skillsServed: 2, status: 'Pilot' },
  { id: 'MCP-08', name: 'SCADA historian', system: 'Grid telemetry time series', callsThisQuarter: 0, skillsServed: 1, status: 'Planned' },
]

let cached: CapabilityLibrary | null = null

export function getCapabilityLibrary(): CapabilityLibrary {
  if (cached) return cached

  const skills: CapabilitySkill[] = dataset.reusableSkills.map((skill, index) => {
    const reuseInstances = skill.usedByHarnessIds.length
    const calls = callsThisQuarter(skill, index)
    const bespokeBuildCost = Math.round(
      BUILD_COST_BY_CATEGORY[skill.category] * MATURITY_MULTIPLIER[skill.maturity],
    )
    // Without a shared library each consuming harness would have built its own.
    // One implementation serves them all, so every instance past the first is a
    // build avoided.
    const buildCostAvoided = bespokeBuildCost * Math.max(0, reuseInstances - 1)
    const runCostThisQuarter = aedForTokens(calls * skill.avgTokenCostPerCall)

    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      maturity: skill.maturity,
      approvedForAutonomy: skill.approvedForAutonomy,
      ownerSectionId: skill.ownerSectionId,
      reuseInstances,
      callsThisQuarter: calls,
      avgTokenCostPerCall: skill.avgTokenCostPerCall,
      bespokeBuildCost,
      buildCostAvoided,
      runCostThisQuarter,
      netAvoided: buildCostAvoided - runCostThisQuarter,
    }
  })

  const sum = (pick: (s: CapabilitySkill) => number) => skills.reduce((t, s) => t + pick(s), 0)
  const memoryTokensAvoided = MEMORY_STORES.reduce((t, m) => t + m.tokensAvoided, 0)

  cached = {
    skills,
    memory: MEMORY_STORES,
    connectors: CONNECTORS,
    totals: {
      skills: skills.length,
      calls: sum((s) => s.callsThisQuarter),
      reuseInstances: sum((s) => s.reuseInstances),
      buildCostAvoided: sum((s) => s.buildCostAvoided),
      runCost: sum((s) => s.runCostThisQuarter),
      netAvoided: sum((s) => s.netAvoided),
      memoryEntries: MEMORY_STORES.reduce((t, m) => t + m.entries, 0),
      memoryTokensAvoided,
      memoryCostAvoided: aedForTokens(memoryTokensAvoided),
      avgRecallHitRatePct: Math.round(
        MEMORY_STORES.reduce((t, m) => t + m.recallHitRatePct, 0) / MEMORY_STORES.length,
      ),
      connectors: CONNECTORS.length,
      connectorCalls: CONNECTORS.reduce((t, c) => t + c.callsThisQuarter, 0),
    },
  }
  return cached
}
