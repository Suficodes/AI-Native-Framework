// The 17 view-simulation roles from the requirements doc (Section 20).
// Fixed list, not seeded — shared by the topbar RoleSwitcher (src/app/App.jsx)
// and mockApi.getRoles(). View-only: this prototype has no real authentication
// or authorization, which is why RoleSwitcher always shows a
// "Simulated view — no authentication" badge alongside it.
export interface Role {
  id: string
  name: string
  description: string
}

export const ROLES: Role[] = [
  { id: 'ROLE-01', name: 'CAIO', description: 'Chief AI Officer — enterprise AI strategy, standards, and investment.' },
  { id: 'ROLE-02', name: 'CIO', description: 'Chief Information Officer — technology architecture and platform decisions.' },
  { id: 'ROLE-03', name: 'EVP', description: 'Executive Vice President — divisional strategic oversight.' },
  { id: 'ROLE-04', name: 'Division Head', description: 'Accountable for a division’s AI-native transformation.' },
  { id: 'ROLE-05', name: 'Department Manager', description: 'Manages a department’s processes and workforce.' },
  { id: 'ROLE-06', name: 'Section Manager', description: 'Owns a section’s mandate, QPs, and day-to-day delivery.' },
  { id: 'ROLE-07', name: 'Business Owner', description: 'Accountable for an initiative’s outcome and continued need.' },
  { id: 'ROLE-08', name: 'Agent Manager', description: 'Daily performance and exception handling for assigned agents.' },
  { id: 'ROLE-09', name: 'IT Lead', description: 'Technical delivery and integration ownership.' },
  { id: 'ROLE-10', name: 'Enterprise Architect', description: 'Architecture and security review authority.' },
  { id: 'ROLE-11', name: 'Quality Manager', description: 'Owns Quality Procedure accuracy and compliance.' },
  { id: 'ROLE-12', name: 'Finance Validator', description: 'Validates cost, savings, and ROI for Value Realization.' },
  { id: 'ROLE-13', name: 'BPI Validator', description: 'Business Process Improvement validation of realized benefit.' },
  { id: 'ROLE-14', name: 'PMO', description: 'Portfolio governance and cross-initiative tracking.' },
  { id: 'ROLE-15', name: 'AI Platform Engineer', description: 'Builds and operates harnesses, models, and agent infrastructure.' },
  { id: 'ROLE-16', name: 'Risk and Security', description: 'Risk assessment, controls, and incident response.' },
  { id: 'ROLE-17', name: 'Employee', description: 'Individual contributor — human or human+agent workforce view.' },
]
