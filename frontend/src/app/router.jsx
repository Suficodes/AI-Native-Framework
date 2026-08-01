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
import HarnessRegistry from "../pages/harness-engineering/HarnessRegistry.jsx"
import HarnessDesigner from "../pages/harness-engineering/HarnessDesigner.jsx"
import AIPlaybook from "../pages/ai-playbook/AIPlaybook.jsx"
import D2DIntegration from "../pages/d2d-integration/D2DIntegration.jsx"
import D2DDemandDetail from "../pages/d2d-integration/D2DDemandDetail.jsx"
import CopilotWorkforce from "../pages/copilot-workforce/CopilotWorkforce.jsx"
import WorkContributionLedger from "../pages/copilot-workforce/WorkContributionLedger.jsx"
import AgentPerformance from "../pages/performance/AgentPerformance.jsx"
import HumanPerformance from "../pages/performance/HumanPerformance.jsx"
import ValueRealization from "../pages/value-realization/ValueRealization.jsx"
import VRRecordDetail from "../pages/value-realization/VRRecordDetail.jsx"
import TokenEconomics from "../pages/token-economics/TokenEconomics.jsx"
import TransactionDetail from "../pages/token-economics/TransactionDetail.jsx"
import Observability from "../pages/observability/Observability.jsx"
import TraceDetail from "../pages/observability/TraceDetail.jsx"
import StrategicAlignment from "../pages/strategic-alignment/StrategicAlignment.jsx"
import AIRooms from "../pages/strategic-alignment/AIRooms.jsx"
import AIRoomDetail from "../pages/strategic-alignment/AIRoomDetail.jsx"

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

      { path: "harness-engineering", element: <HarnessRegistry /> },
      { path: "harness-engineering/:harnessId", element: <HarnessDesigner /> },

      // The static "example/d2d" segment is declared before the :scopeType/:scopeId
      // pattern for readability; react-router ranks static segments above dynamic
      // ones regardless of order, so the example route always wins.
      { path: "ai-playbook", element: <AIPlaybook /> },
      { path: "ai-playbook/example/d2d", element: <AIPlaybook exampleD2D /> },
      { path: "ai-playbook/:scopeType/:scopeId", element: <AIPlaybook /> },

      { path: "d2d-integration", element: <D2DIntegration /> },
      { path: "d2d-integration/demands/:demandId", element: <D2DDemandDetail /> },

      { path: "copilot-workforce", element: <CopilotWorkforce /> },
      { path: "copilot-workforce/ledger", element: <WorkContributionLedger /> },

      { path: "performance/agents", element: <AgentPerformance /> },
      { path: "performance/humans", element: <HumanPerformance /> },

      // "executive-analytics" is a static segment, so react-router ranks it
      // above the :vrId pattern regardless of declaration order.
      { path: "value-realization", element: <ValueRealization /> },
      { path: "value-realization/executive-analytics", element: <ValueRealization /> },
      { path: "value-realization/:vrId", element: <VRRecordDetail /> },

      { path: "token-economics", element: <TokenEconomics /> },
      { path: "token-economics/transactions/:txId", element: <TransactionDetail /> },

      { path: "observability", element: <Observability /> },
      { path: "observability/traces/:traceId", element: <TraceDetail /> },

      { path: "strategic-alignment", element: <StrategicAlignment /> },
      { path: "strategic-alignment/ai-rooms", element: <AIRooms /> },
      { path: "strategic-alignment/ai-rooms/:roomId", element: <AIRoomDetail /> },

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
