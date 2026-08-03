// Shared navigation config — single source of truth for the SideNav (App.jsx)
// and the global CommandPalette search index (also App.jsx). Route paths here
// must match router.jsx exactly.
const icon = (...d) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)

const Icons = {
  overview: icon(<rect key="a" x="3" y="3" width="7" height="9" rx="1.5" />, <rect key="b" x="14" y="3" width="7" height="5" rx="1.5" />, <rect key="c" x="14" y="12" width="7" height="9" rx="1.5" />, <rect key="d" x="3" y="16" width="7" height="5" rx="1.5" />),
  organization: icon(<circle key="a" cx="12" cy="5" r="2.3" />, <circle key="b" cx="5" cy="19" r="2.3" />, <circle key="c" cx="19" cy="19" r="2.3" />, <path key="d" d="M12 7.3V13M12 13L5 16.8M12 13l7 3.8" />),
  processes: icon(<path key="a" d="M4 12a8 8 0 0 1 14.5-4.6" />, <path key="b" d="M18.5 3v4.4H14" />, <path key="c" d="M20 12a8 8 0 0 1-14.5 4.6" />, <path key="d" d="M5.5 21v-4.4H10" />),
  initiatives: icon(<path key="a" d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />),
  agents: icon(<rect key="a" x="5" y="7" width="14" height="11" rx="2.5" />, <path key="b" d="M9 7V5a3 3 0 0 1 6 0v2" />, <circle key="c" cx="9.5" cy="12.5" r="1.1" />, <circle key="d" cx="14.5" cy="12.5" r="1.1" />, <path key="e" d="M9.5 15.5h5" />),
  harness: icon(<circle key="a" cx="6" cy="12" r="2.3" />, <circle key="b" cx="18" cy="6" r="2.3" />, <circle key="c" cx="18" cy="18" r="2.3" />, <path key="d" d="M8.2 11l7.6-3.7M8.2 13l7.6 3.7" />),
  playbook: icon(<path key="a" d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />, <path key="b" d="M4 19a2 2 0 0 1 2-2h13" />, <path key="c" d="M9 7h7M9 10.5h7" />),
  d2d: icon(<path key="a" d="M3 6h11M3 6l3-3M3 6l3 3" />, <path key="b" d="M21 18H10M21 18l-3-3M21 18l-3 3" />),
  copilot: icon(<path key="a" d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />, <path key="b" d="M6 12v1a6 6 0 0 0 12 0v-1M12 19v3" />),
  performance: icon(<path key="a" d="M4 19h16" />, <rect key="b" x="6" y="12" width="3" height="7" />, <rect key="c" x="11" y="8" width="3" height="11" />, <rect key="d" x="16" y="4" width="3" height="15" />),
  value: icon(<circle key="a" cx="12" cy="12" r="9" />, <path key="b" d="M9.5 15s.7 1.5 2.5 1.5 2.7-2.6.7-3.3-3.7-1.3-2-3.3S15 8.5 15 8.5" />),
  tokens: icon(<circle key="a" cx="9" cy="9" r="5" />, <circle key="b" cx="15" cy="15" r="5" />),
  observability: icon(<path key="a" d="M3 17l4-6 4 3 4-8 6 11" />),
  strategic: icon(<circle key="a" cx="12" cy="12" r="8" />, <circle key="b" cx="12" cy="12" r="4" />, <circle key="c" cx="12" cy="12" r="0.6" fill="currentColor" />),
  map: icon(<path key="a" d="M9 3v15M15 6v15" />, <path key="b" d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />),
  capability: icon(<rect key="a" x="3" y="4" width="7.5" height="7.5" rx="1.6" />, <rect key="b" x="13.5" y="4" width="7.5" height="7.5" rx="1.6" />, <rect key="c" x="3" y="14.5" width="7.5" height="5.5" rx="1.6" />, <path key="d" d="M13.5 17.2h7.5M17.2 14.5v5.5" />),
  constellation: icon(<circle key="a" cx="12" cy="12" r="1.6" fill="currentColor" />, <circle key="b" cx="12" cy="12" r="5.4" strokeDasharray="1.5 2.5" />, <circle key="c" cx="12" cy="12" r="9.4" strokeDasharray="1.5 3" />, <circle key="d" cx="17.4" cy="12" r="1.5" />, <circle key="e" cx="8.5" cy="4.6" r="1.3" />),
  admin: icon(<circle key="a" cx="12" cy="12" r="2.6" />, <path key="b" d="M19.4 13.5a7.5 7.5 0 0 0 0-3l2-1.4-2-3.4-2.3.8a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.3-.8-2 3.4 2 1.4a7.5 7.5 0 0 0 0 3l-2 1.4 2 3.4 2.3-.8a7.6 7.6 0 0 0 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3.8 2-3.4z" />),
  journey: icon(<path key="a" d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />, <path key="b" d="M9 4v14M15 6v14" />),
  architecture: icon(<circle key="a" cx="5" cy="6" r="2" />, <circle key="b" cx="19" cy="6" r="2" />, <circle key="c" cx="12" cy="18" r="2" />, <path key="d" d="M7 7l4 9M17 7l-4 9M7 6h10" />),
  vibe: icon(<path key="a" d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />),
  pmlog: icon(<path key="a" d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />, <path key="b" d="M4 19a2 2 0 0 1 2-2h13" />),
}

// Main "Control Tower" module group — order matches the requirements doc's
// own presentation sequence (Section 26).
export const CONTROL_TOWER_NAV = [
  { path: '/', label: 'Executive Overview', icon: Icons.overview },
  { path: '/organization', label: 'Organization', icon: Icons.organization },
  { path: '/processes/agenticity', label: 'Processes & Quality Procedures', icon: Icons.processes },
  { path: '/ai-initiatives', label: 'AI Initiatives', icon: Icons.initiatives },
  { path: '/agents', label: 'Agents', icon: Icons.agents },
  { path: '/harness-engineering', label: 'Harness Engineering', icon: Icons.harness },
  { path: '/ai-playbook', label: 'AI Playbook', icon: Icons.playbook },
  { path: '/d2d-integration', label: 'D2D Integration', icon: Icons.d2d },
  { path: '/copilot-workforce', label: 'Copilot & Workforce', icon: Icons.copilot },
  { path: '/performance/agents', label: 'Performance', icon: Icons.performance },
  { path: '/value-realization', label: 'Value Realization', icon: Icons.value },
  { path: '/token-economics', label: 'Token Economics', icon: Icons.tokens },
  { path: '/observability', label: 'Observability', icon: Icons.observability },
  { path: '/strategic-alignment', label: 'Strategic Alignment', icon: Icons.strategic },
  { path: '/capability-library', label: 'AI Capability Library', icon: Icons.capability },
  { path: '/agent-constellation', label: 'Agent Constellation', icon: Icons.constellation },
  { path: '/enterprise-map', label: 'Final Enterprise Map', icon: Icons.map },
  { path: '/administration', label: 'Administration', icon: Icons.admin },
]

// Secondary group — the four DAK auto-updating meta pages about the build
// itself (not part of the Control Tower product surface).
export const PROJECT_NAV = [
  { path: '/journey', label: 'Journey', icon: Icons.journey },
  { path: '/architecture', label: 'Architecture', icon: Icons.architecture },
  { path: '/vibe-code', label: 'Vibe Code', icon: Icons.vibe },
  { path: '/pm-log', label: 'PM Log', icon: Icons.pmlog },
]

export const ALL_NAV = [...CONTROL_TOWER_NAV, ...PROJECT_NAV]
