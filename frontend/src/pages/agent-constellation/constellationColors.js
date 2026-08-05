// Constellation mark colours. A division is an identity, so it takes the
// categorical palette — one fixed colour per division, reused wherever that
// division appears. Agenticity is an ordered level, so leaves take the status
// ramp instead (dataviz skill: never colour a magnitude with categorical hues).
import { categorical, status, axisText } from '../../lib/chartColors.js'

export function domainColor(mode, index) {
  const c = categorical(mode)
  // Four non-adjacent slots from the validated palette, so neighbouring
  // sectors never sit on similar hues.
  return [c[0], c[2], c[3], c[6]][index % 4]
}

export function nodeColor(mode, node, domainIndex) {
  if (node.tier === 'core') return axisText(mode)
  if (node.tier === 'domain' || node.tier === 'agent') return domainColor(mode, domainIndex)
  const s = status(mode)
  if (node.leafKind === 'qualityProcedure') return axisText(mode)
  const level = node.metrics.agenticity
  if (level == null) return axisText(mode)
  return level >= 4 ? s.good : level >= 2 ? s.warning : s.critical
}

// Tier is encoded in size as well as colour, so colour is never the only
// carrier of what a mark is.
export function nodeRadius(node) {
  return { core: 0, domain: 13, agent: 8, leaf: 3.6 }[node.tier] ?? 4
}

export function legendEntries(mode, domains) {
  const s = status(mode)
  const neutral = axisText(mode)
  return [
    ...domains.map((d, i) => ({ color: domainColor(mode, i), label: d.label, shape: 'domain' })),
    { color: s.good, label: 'Process at L4+ (agent-led)', shape: 'leaf' },
    { color: s.warning, label: 'Process at L2–L3 (AI-assisted)', shape: 'leaf' },
    { color: s.critical, label: 'Process at L0–L1 (manual)', shape: 'leaf' },
    { color: neutral, label: 'Quality Procedure', shape: 'leaf' },
  ]
}
