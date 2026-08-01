// Colour scales for the Enterprise Map. Each lens declares what it colours by
// (see enterpriseMapLenses.ts) and this module turns that into a colour — one
// place, so two lenses can never disagree about what "high value" looks like.
//
// Node KIND is an identity, so it takes the categorical palette. Everything
// else the lenses colour by — agenticity, value, cost, risk, performance,
// coverage — is a MAGNITUDE or a STATE, so those take the sequential and status
// ramps (dataviz skill: never colour a magnitude with a categorical palette).
import { categorical, status, axisText } from '../../lib/chartColors'

export const KIND_LABELS = {
  enterprise: 'Enterprise',
  objective: 'Strategic objective',
  criterion: 'Excellence criterion',
  division: 'Division',
  superDepartment: 'Super department',
  department: 'Department',
  section: 'Section',
  position: 'Position',
  employee: 'Human employee',
  agent: 'Agent',
  activity: 'Activity',
  process: 'Process',
  qualityProcedure: 'Quality Procedure',
  initiative: 'AI initiative',
  harness: 'Harness',
  system: 'System or data',
  outcome: 'Operational outcome',
  value: 'Value realization',
  cost: 'Token and total cost',
}

export function kindColor(mode) {
  const c = categorical(mode)
  const neutral = axisText(mode)
  return {
    enterprise: neutral,
    objective: c[6],
    criterion: c[4],
    division: c[0],
    superDepartment: c[0],
    department: c[0],
    section: c[0],
    position: neutral,
    employee: neutral,
    agent: c[1],
    activity: neutral,
    process: c[5],
    qualityProcedure: c[3],
    initiative: c[3],
    harness: c[1],
    system: neutral,
    outcome: c[2],
    value: c[2],
    cost: c[7],
  }
}

/** Three-stop ramp for a magnitude, low → high. */
function ramp(mode, value, max, stops) {
  if (max <= 0 || value == null) return axisText(mode)
  const share = Math.min(1, value / max)
  if (share < 0.34) return stops[0]
  if (share < 0.67) return stops[1]
  return stops[2]
}

/**
 * Colour for a node under the active lens. `scales` carries the maxima for the
 * current result set, so a lens is always shaded relative to what is on screen
 * rather than against a global constant that may be off by orders of magnitude.
 */
export function nodeColor(node, colorBy, mode, scales) {
  const s = status(mode)
  const c = categorical(mode)
  const neutral = axisText(mode)

  switch (colorBy) {
    case 'agenticity': {
      const level = node.metrics.agenticityCurrent
      if (level == null) return neutral
      // Agenticity is an ordered level, so a sequential ramp, not categories.
      return ramp(mode, level, 6, [s.critical, s.warning, s.good])
    }
    case 'value':
      return node.metrics.value == null ? neutral : ramp(mode, node.metrics.value, scales.maxValue, [c[4], c[2], c[5]])
    case 'cost':
      return node.metrics.cost == null ? neutral : ramp(mode, node.metrics.cost, scales.maxCost, [s.good, s.warning, s.critical])
    case 'risk': {
      // Risk is a state with a meaningful threshold, not a smooth magnitude.
      if (node.tags.includes('high-risk-agent') || node.tags.includes('expired-qp')) return s.critical
      const risk = node.metrics.riskScore
      if (risk == null) return neutral
      return risk >= 50 ? s.critical : risk >= 25 ? s.warning : s.good
    }
    case 'performance': {
      const score = node.metrics.performance ?? node.metrics.compliance
      if (score == null) return neutral
      return score >= 85 ? s.good : score >= 65 ? s.warning : s.critical
    }
    case 'coverage': {
      const coverage = node.metrics.aiCoveragePct
      if (coverage == null) return node.tags.includes('agent-supported') ? c[1] : neutral
      return ramp(mode, coverage, 100, [neutral, c[0], c[2]])
    }
    default:
      return kindColor(mode)[node.kind] ?? neutral
  }
}

/** Maxima across the visible set, so shading is relative to what is on screen. */
export function computeScales(nodes) {
  return {
    maxValue: Math.max(1, ...nodes.map((n) => n.metrics.value ?? 0)),
    maxCost: Math.max(1, ...nodes.map((n) => n.metrics.cost ?? 0)),
  }
}

/** Legend entries for the active lens's colour dimension. */
export function legendFor(colorBy, mode) {
  const s = status(mode)
  const c = categorical(mode)
  const neutral = axisText(mode)
  switch (colorBy) {
    case 'agenticity':
      return [
        { color: s.critical, label: 'L0–L1 manual or digitized' },
        { color: s.warning, label: 'L2–L3 AI-assisted' },
        { color: s.good, label: 'L4+ agent-led' },
      ]
    case 'value':
      return [
        { color: c[4], label: 'Lower value' },
        { color: c[2], label: 'Mid value' },
        { color: c[5], label: 'Highest value' },
      ]
    case 'cost':
      return [
        { color: s.good, label: 'Lower cost' },
        { color: s.warning, label: 'Mid cost' },
        { color: s.critical, label: 'Highest cost' },
      ]
    case 'risk':
      return [
        { color: s.good, label: 'Within tolerance' },
        { color: s.warning, label: 'Watch' },
        { color: s.critical, label: 'High risk or expired control' },
      ]
    case 'performance':
      return [
        { color: s.good, label: 'Exceeds (85+)' },
        { color: s.warning, label: 'Meets (65–84)' },
        { color: s.critical, label: 'Needs optimization' },
      ]
    case 'coverage':
      return [
        { color: neutral, label: 'Human-only' },
        { color: c[0], label: 'Partly AI-covered' },
        { color: c[2], label: 'Mostly AI-covered' },
      ]
    default:
      return Object.entries(kindColor(mode))
        .filter(([kind]) => ['objective', 'division', 'process', 'agent', 'initiative', 'value', 'cost'].includes(kind))
        .map(([kind, color]) => ({ color, label: KIND_LABELS[kind] }))
  }
}

/** Edge styling per relationship kind — the flows the doc asks to be toggleable. */
export function edgeStyle(kind, mode) {
  const c = categorical(mode)
  const s = status(mode)
  const base = { strokeWidth: 1.4, stroke: 'var(--color-border)' }
  switch (kind) {
    case 'value': return { stroke: c[2], strokeWidth: 2 }
    case 'token': return { stroke: c[7], strokeWidth: 2, strokeDasharray: '5 3' }
    case 'contributes': return { stroke: c[6], strokeWidth: 1.8 }
    case 'supervises': return { stroke: c[1], strokeWidth: 1.6, strokeDasharray: '4 3' }
    case 'governs': return { stroke: c[3], strokeWidth: 1.6 }
    case 'controls': return { stroke: c[1], strokeWidth: 1.6 }
    case 'executes': return { stroke: c[5], strokeWidth: 1.6 }
    case 'depends': return { stroke: s.warning, strokeWidth: 1.6, strokeDasharray: '2 3' }
    default: return base
  }
}

export const EDGE_KIND_LABELS = {
  contains: 'Structure',
  contributes: 'Strategic contribution',
  governs: 'Quality Procedure control',
  executes: 'Agent executes process',
  supervises: 'Agent reporting line',
  delivers: 'Initiative created agent',
  controls: 'Harness controls agent',
  value: 'Value flow',
  token: 'Token-cost flow',
  depends: 'Process dependency',
  staffs: 'Position staffing',
}
