// Chart mark colors — literal hex per mode (see useChartMode.js for why these
// aren't CSS custom properties). Values match dewa/chart-colors.css's
// documentation of the dataviz skill's validated reference palette; keep the
// two in sync if either changes.
const CATEGORICAL_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const CATEGORICAL_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']

const STATUS_LIGHT = { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' }
const STATUS_DARK = STATUS_LIGHT // status steps are mode-invariant per the dataviz skill reference palette

const SEQUENTIAL_LIGHT = ['#cde2fb', '#3987e5', '#0d366b']
const SEQUENTIAL_DARK = SEQUENTIAL_LIGHT

const AXIS_TEXT_LIGHT = '#52514e'
const AXIS_TEXT_DARK = '#c3c2b7'
const GRID_LIGHT = '#e5e4df'
const GRID_DARK = '#33322e'

export function categorical(mode) { return mode === 'dark' ? CATEGORICAL_DARK : CATEGORICAL_LIGHT }
export function status(mode) { return mode === 'dark' ? STATUS_DARK : STATUS_LIGHT }
export function sequential(mode) { return mode === 'dark' ? SEQUENTIAL_DARK : SEQUENTIAL_LIGHT }
export function axisText(mode) { return mode === 'dark' ? AXIS_TEXT_DARK : AXIS_TEXT_LIGHT }
export function gridColor(mode) { return mode === 'dark' ? GRID_DARK : GRID_LIGHT }

// Fixed categorical assignments — reused everywhere the same entity appears
// (dataviz skill rule: "color follows the entity, never its rank").
export function workforceTypeColor(mode) {
  const c = categorical(mode)
  return { Human: axisText(mode), HumanPlusCopilot: c[0], HumanPlusAgent: c[6], AgentOnly: c[2] }
}

export function initiativeStatusColor(mode) {
  const s = status(mode)
  return { OnTrack: s.good, AtRisk: s.warning, Delayed: s.serious, Blocked: s.critical, Complete: axisText(mode) }
}

export function agentResultColor(mode) {
  const s = status(mode)
  const c = categorical(mode)
  return {
    ExceedsExpectations: s.good, MeetsExpectations: c[0], NeedsOptimization: s.warning,
    Restricted: s.serious, Suspended: s.critical, Retired: axisText(mode),
  }
}
