// The 18 Administration sub-screens (requirements doc, Section 19), driven by
// one config list + one generic page component rather than 18 near-identical
// files — matches "use tabs inside modules, don't create too many
// disconnected screens."
export const ADMIN_SCREENS = [
  { slug: "organization-master", label: "Organization Master" },
  { slug: "positions", label: "Positions" },
  { slug: "employees", label: "Employees" },
  { slug: "agents", label: "Agents" },
  { slug: "processes", label: "Processes" },
  { slug: "quality-procedures", label: "Quality Procedures" },
  { slug: "strategic-objectives", label: "Strategic Objectives" },
  { slug: "excellence-criteria", label: "Excellence Criteria" },
  { slug: "ai-initiatives", label: "AI Initiatives" },
  { slug: "harness-templates", label: "Harness Templates" },
  { slug: "models", label: "Models" },
  { slug: "token-prices", label: "Token Prices" },
  { slug: "cost-categories", label: "Cost Categories" },
  { slug: "benefit-categories", label: "Benefit Categories" },
  { slug: "risk-levels", label: "Risk Levels" },
  { slug: "user-roles", label: "User Roles" },
  { slug: "access-permissions", label: "Access Permissions" },
  { slug: "data-refresh", label: "Data Refresh" },
  { slug: "integration-status", label: "Integration Status" },
]
