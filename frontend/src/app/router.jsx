import { createHashRouter } from "react-router-dom"
import App from "./App.jsx"
import ComingSoon from "../pages/ComingSoon.jsx"
import Journey from "../pages/Journey.jsx"
import Architecture from "../pages/Architecture.jsx"
import VibeCode from "../pages/VibeCode.jsx"
import PmLog from "../pages/PmLog.jsx"
import EnterpriseMapShell from "../pages/enterprise-map/EnterpriseMapShell.jsx"
import Administration from "../pages/administration/Administration.jsx"
import ExecutiveOverview from "../pages/executive-overview/ExecutiveOverview.jsx"
import Organization from "../pages/organization/Organization.jsx"
import ProcessAgenticity from "../pages/processes/ProcessAgenticity.jsx"
import ProcessDetail from "../pages/processes/ProcessDetail.jsx"
import QualityProcedures from "../pages/processes/QualityProcedures.jsx"
import QualityProcedureDetail from "../pages/processes/QualityProcedureDetail.jsx"
import AIInitiatives from "../pages/ai-initiatives/AIInitiatives.jsx"
import InitiativeDetail from "../pages/ai-initiatives/InitiativeDetail.jsx"
import Agents from "../pages/agents/Agents.jsx"
import AgentProfile from "../pages/agents/AgentProfile.jsx"

// Route table. Every module route below is real (clickable, no 404) from
// Step 1 onward — ComingSoon is a temporary element for routes this build
// hasn't reached yet. As each module's build step lands, its route(s) get
// repointed at real page components (see PROJECT.md's step log for status).
const coming = (title, description) => <ComingSoon title={title} description={description} />

export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <ExecutiveOverview /> },

      { path: "organization", element: <Organization /> },

      { path: "processes/agenticity", element: <ProcessAgenticity /> },
      { path: "processes/agenticity/:processId", element: <ProcessDetail /> },
      { path: "processes/quality-procedures", element: <QualityProcedures /> },
      { path: "processes/quality-procedures/:qpId", element: <QualityProcedureDetail /> },

      { path: "ai-initiatives", element: <AIInitiatives /> },
      { path: "ai-initiatives/:initiativeId", element: <InitiativeDetail /> },

      { path: "agents", element: <Agents /> },
      { path: "agents/:agentId", element: <AgentProfile /> },

      { path: "harness-engineering", element: coming("Harness Engineering", "The Harness Registry and the visual, click-to-configure Harness Designer.") },
      { path: "harness-engineering/:harnessId", element: coming("Harness Designer") },

      { path: "ai-playbook", element: coming("AI Playbook", "The living, scope-filtered enterprise AI Playbook.") },
      { path: "ai-playbook/:scopeType/:scopeId", element: coming("Playbook — filtered view") },
      { path: "ai-playbook/example/d2d", element: coming("AI Playbook — D2D department example") },

      { path: "d2d-integration", element: coming("D2D Integration", "The 12-stage business-need-to-playbook-update journey and demand register.") },
      { path: "d2d-integration/demands/:demandId", element: coming("Demand detail") },

      { path: "copilot-workforce", element: coming("Copilot & Workforce", "Microsoft Copilot adoption and the Work Contribution Ledger.") },
      { path: "copilot-workforce/ledger", element: coming("Work Contribution Ledger") },

      { path: "performance/agents", element: coming("Agent Performance", "KPIs and the 7-dimension Agent Performance Index.") },
      { path: "performance/humans", element: coming("Human AI-Native Performance") },

      { path: "value-realization", element: coming("Value Realization", "VR Portfolio, baselines, benefits, costs, validation, and executive analytics.") },
      { path: "value-realization/:vrId", element: coming("VR record") },
      { path: "value-realization/executive-analytics", element: coming("Value Realization — Executive Analytics") },

      { path: "token-economics", element: coming("Token Economics", "Enterprise-to-transaction token hierarchy, budgets, and consumption analytics.") },
      { path: "token-economics/transactions/:txId", element: coming("Transaction detail") },

      { path: "observability", element: coming("Observability", "AI operations and harness observability — traces, incidents, and alert rules.") },
      { path: "observability/traces/:traceId", element: coming("Trace detail") },

      { path: "strategic-alignment", element: coming("Strategic Alignment", "The strategy map from objective to realized value, and the 8 AI Rooms.") },
      { path: "strategic-alignment/ai-rooms", element: coming("AI Rooms") },
      { path: "strategic-alignment/ai-rooms/:roomId", element: coming("AI Room detail") },

      { path: "administration", element: <Administration /> },
      { path: "administration/:screen", element: <Administration /> },

      { path: "journey", element: <Journey /> },
      { path: "architecture", element: <Architecture /> },
      { path: "vibe-code", element: <VibeCode /> },
      { path: "pm-log", element: <PmLog /> },
    ],
  },
  // Full-screen route — deliberately outside the App shell (no SideNav/topbar).
  { path: "/enterprise-map", element: <EnterpriseMapShell /> },
])
