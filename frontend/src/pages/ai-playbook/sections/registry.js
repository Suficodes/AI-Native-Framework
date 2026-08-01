// The 15 playbook sections of requirements doc Section 10, in the doc's order.
// One list drives both the rail and the document body, so they can never drift
// apart and adding a section is a single edit.
import { VisionSection } from './VisionSection.jsx'
import { OperatingModelSection } from './OperatingModelSection.jsx'
import { TransformationGuidanceSection } from './TransformationGuidanceSection.jsx'
import { QuickWinsSection } from './QuickWinsSection.jsx'
import { AgenticityRoadmapSection } from './AgenticityRoadmapSection.jsx'
import { RecommendedAgentsSection } from './RecommendedAgentsSection.jsx'
import { SourcingSection } from './SourcingSection.jsx'
import { RequiredDataSection } from './RequiredDataSection.jsx'
import { HarnessRequirementsSection } from './HarnessRequirementsSection.jsx'
import { GovernanceSection } from './GovernanceSection.jsx'
import { ValueOpportunitySection } from './ValueOpportunitySection.jsx'
import { TokenBudgetSection } from './TokenBudgetSection.jsx'
import { ImplementationRoadmapSection } from './ImplementationRoadmapSection.jsx'
import { LessonsLearnedSection } from './LessonsLearnedSection.jsx'
import { ReusableSkillsSection } from './ReusableSkillsSection.jsx'

export const PLAYBOOK_SECTIONS = [
  { id: 'vision', title: 'AI-native vision', purpose: 'What AI-native means here, and where this scope stands against it today.', Component: VisionSection },
  { id: 'operating-model', title: 'Human–agent operating model', purpose: 'Who does what, and which control points stay human.', Component: OperatingModelSection },
  { id: 'transformation', title: 'Department transformation guidance', purpose: 'The from-state, the to-state, and the moves that close the gap.', Component: TransformationGuidanceSection },
  { id: 'quick-wins', title: 'Quick wins', purpose: 'Highest value per unit of effort, available now.', Component: QuickWinsSection },
  { id: 'agenticity-roadmap', title: 'Process-agenticity roadmap', purpose: 'Every process in scope, sequenced by readiness and risk.', Component: AgenticityRoadmapSection },
  { id: 'recommended-agents', title: 'Recommended copilots and agents', purpose: 'What to build or adopt, with the controls each one needs.', Component: RecommendedAgentsSection },
  { id: 'sourcing', title: 'Buy, configure, or build', purpose: 'How each recommendation should be delivered, and why.', Component: SourcingSection },
  { id: 'required-data', title: 'Required data', purpose: 'The data and knowledge these agents depend on, and how ready it is.', Component: RequiredDataSection },
  { id: 'harness-requirements', title: 'Harness requirements', purpose: 'The baseline every harness in this scope must meet.', Component: HarnessRequirementsSection },
  { id: 'governance', title: 'Governance', purpose: 'Rules, approval gates, accountable roles, and open risk.', Component: GovernanceSection },
  { id: 'value-opportunity', title: 'Value opportunity', purpose: 'Estimated opportunity, pipeline value, and validated benefit — kept apart.', Component: ValueOpportunitySection },
  { id: 'token-budget', title: 'Token budget', purpose: 'What the digital workforce in this scope costs, against what it releases.', Component: TokenBudgetSection },
  { id: 'implementation-roadmap', title: 'Implementation roadmap', purpose: 'Delivery sequence and the dependencies that gate it.', Component: ImplementationRoadmapSection },
  { id: 'lessons-learned', title: 'Lessons learned', purpose: 'What earlier delivery in this scope already proved.', Component: LessonsLearnedSection },
  { id: 'reusable-skills', title: 'Approved reusable skills', purpose: 'Check here before designing a new harness block.', Component: ReusableSkillsSection },
]
