// Positions, Job Descriptions, and Employees. 60 positions / 40 employees
// (Section 21). Every section gets a Section Manager position; the
// Demand-to-Delivery Section additionally gets the exact named roles this
// prototype's worked examples reference:
//   - POS-BA-D2D-01: Senior Business Analyst — Human + D2D Documentation Agent
//     (the required worked example, with the exact 6 activity percentages)
//   - IT Lead, DBE Manager, D2D Governance Lead — the manager/business-owner/
//     agent-manager roles AGT-D2D-DOC-01 and HAR-D2D-BRD-01 reference
//   - AI Platform Team Lead (AI Platform Section) and Information Security
//     Lead (Enterprise Risk Section) — technical/risk owner roles
import type { AreaOfActivity, Employee, JobDescription, Position, WorkforceType } from '../types'
import { nextEmployeeId, nextPositionId } from '../ids'
import { type Rng, bool, int, isoDate, pick } from '../rng'
import type { BuiltOrg } from './organization.seed'

const FIRST_NAMES = ['Ahmed', 'Fatima', 'Mohammed', 'Aisha', 'Omar', 'Mariam', 'Khalid', 'Noura', 'Saeed', 'Layla', 'Hassan', 'Reem', 'Yousef', 'Salma', 'Rashid', 'Huda', 'Tariq', 'Amina', 'Faisal', 'Dana', 'Sultan', 'Maha', 'Zayed', 'Alia', 'Nasser', 'Farah', 'Waleed', 'Sara', 'Majid', 'Lina', 'Karim', 'Nadia', 'Adel', 'Yasmin', 'Hamdan', 'Rania', 'Suhail', 'Iman', 'Marwan', 'Ghada']
const LAST_NAMES = ['Al Mazrouei', 'Al Falasi', 'Al Suwaidi', 'Al Marri', 'Al Shamsi', 'Al Nuaimi', 'Al Kaabi', 'Al Zaabi', 'Al Ali', 'Al Hashimi', 'Al Qassimi', 'Al Ketbi', 'Al Rashidi', 'Al Mheiri', 'Al Dhaheri']

function makeName(rng: Rng, used: Set<string>): string {
  let name = ''
  do {
    name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`
  } while (used.has(name))
  used.add(name)
  return name
}

const ROLE_POOLS: Record<string, string[]> = {
  operations: ['Operations Engineer', 'Field Supervisor', 'Shift Operator', 'Operations Analyst', 'Maintenance Technician'],
  engineering: ['Asset Engineer', 'Reliability Engineer', 'Design Engineer', 'Engineering Analyst'],
  customer: ['Customer Service Specialist', 'Billing Analyst', 'Revenue Analyst', 'Customer Experience Specialist', 'Contact Center Agent'],
  digital: ['Product Analyst', 'Solutions Analyst', 'Integration Specialist', 'UX Designer'],
  corporate: ['Financial Analyst', 'HR Business Partner', 'Procurement Specialist', 'Compliance Officer', 'Risk Analyst'],
}
const SECTION_CATEGORY: Record<string, keyof typeof ROLE_POOLS> = {
  'Plant Performance Section': 'operations', 'Fuel & Efficiency Section': 'operations',
  'Generation Asset Engineering Section': 'engineering',
  'Solar Park Operations Section': 'operations', 'Clean Energy Planning Section': 'engineering',
  'Sustainability Reporting Section': 'corporate',
  'Grid Control Section': 'operations', 'Transmission Maintenance Section': 'operations',
  'Network Planning Section': 'engineering',
  'Field Services Section': 'operations', 'Distribution Maintenance Section': 'operations',
  'Asset Reliability Section': 'engineering',
  'Billing Operations Section': 'customer', 'Revenue Assurance Section': 'customer',
  'Customer Happiness Section': 'customer', 'Contact Center Section': 'customer',
  'Demand-to-Delivery Section': 'digital', 'Digital Products Section': 'digital',
  'Enterprise Data Section': 'digital', 'AI Platform Section': 'digital',
  'Financial Planning Section': 'corporate', 'Talent & Workforce Section': 'corporate',
  'Vendor Management Section': 'corporate', 'Enterprise Risk Section': 'corporate',
  'Regulatory Compliance Section': 'corporate',
}

function jd(positionId: string, summary: string, responsibilities: string[], competencies: string[], activities: AreaOfActivity[]): JobDescription {
  return { id: `JD-${positionId}`, positionId, summary, keyResponsibilities: responsibilities, competencies, activities }
}

export interface BuiltPositions {
  positions: Position[]
  jobDescriptions: JobDescription[]
  employees: Employee[]
  positionIdByTitleSection: Record<string, string>
}

export function buildPositions(rng: Rng, org: BuiltOrg): BuiltPositions {
  const positions: Position[] = []
  const jobDescriptions: JobDescription[] = []
  const employees: Employee[] = []
  const positionIdByTitleSection: Record<string, string> = {}
  const usedNames = new Set<string>()

  function addPosition(opts: {
    id?: string
    title: string
    sectionName: string
    workforceType: WorkforceType
    jobDescription: Omit<JobDescription, 'id' | 'positionId'>
    hireEmployee: boolean
    copilotLicensed?: boolean
  }): Position {
    const sectionId = org.sectionIdByName[opts.sectionName]
    const divisionId = org.orgNodes.find((n) => n.id === sectionId)!.divisionId!
    const positionId = opts.id ?? nextPositionId()
    const jobDescriptionId = `JD-${positionId}`
    jobDescriptions.push(jd(positionId, opts.jobDescription.summary, opts.jobDescription.keyResponsibilities, opts.jobDescription.competencies, opts.jobDescription.activities))

    let assignedEmployeeId: string | null = null
    if (opts.hireEmployee) {
      const empId = nextEmployeeId()
      employees.push({
        id: empId, name: makeName(rng, usedNames), positionId, sectionId, divisionId,
        managerId: null, copilotLicensed: opts.copilotLicensed ?? bool(rng, 0.55),
        hireDate: isoDate(rng, 2018, 1, 2500),
      })
      assignedEmployeeId = empId
    }

    const avgActivityAi = opts.jobDescription.activities.length
      ? opts.jobDescription.activities.reduce((s, a) => s + a.aiContributionPct, 0) / opts.jobDescription.activities.length
      : 0

    const position: Position = {
      id: positionId, title: opts.title, sectionId, divisionId,
      workforceType: opts.workforceType, jobDescriptionId,
      assignedEmployeeId, assignedAgentIds: [],
      aiWorkCoveragePct: Math.round(avgActivityAi),
      humanContributionPct: Math.round(100 - avgActivityAi * 0.7),
      agentContributionPct: Math.round(avgActivityAi * 0.7),
      qualityAdjustedAiCoveragePct: Math.round(avgActivityAi * 0.84),
      verifiedCapacityReleasedHours: { value: int(rng, 0, 400), tag: opts.workforceType === 'Human' ? 'Estimated' : 'Observed' },
      performanceKpiIds: [],
      relatedProcessIds: [],
      relatedQpIds: [],
    }
    positions.push(position)
    positionIdByTitleSection[`${opts.title}::${opts.sectionName}`] = positionId
    return position
  }

  // ── The required worked example ────────────────────────────────────────
  addPosition({
    id: 'POS-BA-D2D-01',
    title: 'Senior Business Analyst',
    sectionName: 'Demand-to-Delivery Section',
    workforceType: 'HumanPlusAgent',
    hireEmployee: true,
    copilotLicensed: true,
    jobDescription: {
      summary: 'Owns demand intake, requirement documentation, and BRD preparation for the D2D pipeline, working alongside the D2D Documentation Agent.',
      keyResponsibilities: ['Requirement gathering and documentation', 'Process and impact analysis', 'Stakeholder coordination', 'BRD preparation and quality review', 'Duplicate demand screening'],
      competencies: ['Business analysis', 'Process modeling', 'Stakeholder management', 'AI-assisted documentation review'],
      activities: [
        { id: 'AOA-BA-1', name: 'Requirement documentation', aiContributionPct: 70, contributionType: 'AgentSupported' },
        { id: 'AOA-BA-2', name: 'Process analysis', aiContributionPct: 40, contributionType: 'AgentSupported' },
        { id: 'AOA-BA-3', name: 'Stakeholder meetings', aiContributionPct: 10, contributionType: 'AgentSupported' },
        { id: 'AOA-BA-4', name: 'Duplicate demand checking', aiContributionPct: 95, contributionType: 'AgentSupported' },
        { id: 'AOA-BA-5', name: 'BRD formatting', aiContributionPct: 100, contributionType: 'AgentExecuted' },
        { id: 'AOA-BA-6', name: 'Final approval', aiContributionPct: 0, contributionType: 'HumanOnly' },
      ],
    },
  })

  // ── Named roles the D2D Documentation Agent / BRD Harness reference ────
  addPosition({
    id: 'POS-IT-LEAD-01', title: 'IT Lead', sectionName: 'Demand-to-Delivery Section',
    workforceType: 'HumanPlusCopilot', hireEmployee: true,
    jobDescription: {
      summary: 'Technical delivery lead for the D2D pipeline; manages the D2D Documentation Agent.',
      keyResponsibilities: ['D2D technical delivery', 'Agent manager for D2D agents', 'Release coordination'],
      competencies: ['Solution architecture', 'Agile delivery', 'Agent oversight'],
      activities: [],
    },
  })
  addPosition({
    id: 'POS-DBE-MGR-01', title: 'DBE Manager', sectionName: 'Digital Products Section',
    workforceType: 'HumanPlusCopilot', hireEmployee: true,
    jobDescription: {
      summary: 'Digital Business Enablement Manager — business owner for D2D digital initiatives.',
      keyResponsibilities: ['Business case ownership', 'Value realization sign-off', 'Digital product prioritization'],
      competencies: ['Product ownership', 'Business case development'],
      activities: [],
    },
  })
  addPosition({
    id: 'POS-D2D-GOV-01', title: 'D2D Governance Lead', sectionName: 'Demand-to-Delivery Section',
    workforceType: 'Human', hireEmployee: true,
    jobDescription: {
      summary: 'Governs the D2D intake process, agent manager for D2D agents day-to-day performance.',
      keyResponsibilities: ['D2D governance', 'Agent performance review', 'Exception handling'],
      competencies: ['Process governance', 'Agent management'],
      activities: [],
    },
  })
  addPosition({
    id: 'POS-AI-PLATFORM-01', title: 'AI Platform Team Lead', sectionName: 'AI Platform Section',
    workforceType: 'HumanPlusAgent', hireEmployee: true,
    jobDescription: {
      summary: 'Technical owner for enterprise agent platform, harness engineering standards, and model operations.',
      keyResponsibilities: ['Harness engineering standards', 'Model routing and cost controls', 'Agent platform reliability'],
      competencies: ['MLOps', 'Platform engineering', 'Harness design'],
      activities: [],
    },
  })
  addPosition({
    id: 'POS-INFOSEC-01', title: 'Information Security Lead', sectionName: 'Enterprise Risk Section',
    workforceType: 'Human', hireEmployee: true,
    jobDescription: {
      summary: 'Risk owner for AI/agent initiatives — security review, access control, and incident response.',
      keyResponsibilities: ['AI risk assessment', 'Security review of agents/harnesses', 'Incident response'],
      competencies: ['Cybersecurity', 'Risk assessment', 'AI governance'],
      activities: [],
    },
  })
  addPosition({
    id: 'POS-EA-01', title: 'Enterprise Architect', sectionName: 'Digital Products Section',
    workforceType: 'HumanPlusCopilot', hireEmployee: true,
    jobDescription: {
      summary: 'Architecture and integration review authority for D2D initiatives.',
      keyResponsibilities: ['Architecture review', 'Integration standards', 'Technology assessment'],
      competencies: ['Enterprise architecture', 'Integration design'],
      activities: [],
    },
  })
  addPosition({
    id: 'POS-BPI-01', title: 'BPI Validator', sectionName: 'Financial Planning Section',
    workforceType: 'Human', hireEmployee: true,
    jobDescription: {
      summary: 'Business Process Improvement validation for realized benefits across the initiative portfolio.',
      keyResponsibilities: ['Benefit validation', 'Process improvement assessment'],
      competencies: ['Process improvement', 'Financial validation'],
      activities: [],
    },
  })
  addPosition({
    id: 'POS-FIN-VAL-01', title: 'Finance Validator', sectionName: 'Financial Planning Section',
    workforceType: 'Human', hireEmployee: true,
    jobDescription: {
      summary: 'Validates cost, savings, and ROI for Value Realization records.',
      keyResponsibilities: ['Cost validation', 'ROI review', 'Budget reconciliation'],
      competencies: ['Financial analysis', 'Cost accounting'],
      activities: [],
    },
  })
  addPosition({
    id: 'POS-PMO-01', title: 'PMO Lead', sectionName: 'Financial Planning Section',
    workforceType: 'HumanPlusCopilot', hireEmployee: true,
    jobDescription: {
      summary: 'Portfolio governance and cross-initiative tracking for the AI/D2D initiative portfolio.',
      keyResponsibilities: ['Portfolio tracking', 'Governance reporting', 'Cross-initiative coordination'],
      competencies: ['Portfolio management', 'Governance'],
      activities: [],
    },
  })

  // ── One Section Manager per section (25) ────────────────────────────────
  for (const sectionName of Object.keys(org.sectionIdByName)) {
    addPosition({
      title: `${sectionName.replace(' Section', '')} Manager`,
      sectionName,
      workforceType: pick(rng, ['Human', 'Human', 'HumanPlusCopilot'] as WorkforceType[]),
      hireEmployee: true,
      jobDescription: {
        summary: `Manages the ${sectionName.toLowerCase()} and its team, budget, and delivery commitments.`,
        keyResponsibilities: ['Section leadership', 'Budget ownership', 'Performance management'],
        competencies: ['People management', 'Domain expertise'],
        activities: [],
      },
    })
  }

  // ── Fill remaining sections with domain-appropriate specialist roles
  //    until we reach exactly 60 positions total. ──────────────────────────
  const sectionNames = Object.keys(org.sectionIdByName)
  let i = 0
  while (positions.length < 60) {
    const sectionName = sectionNames[i % sectionNames.length]
    const category = SECTION_CATEGORY[sectionName] ?? 'corporate'
    const title = pick(rng, ROLE_POOLS[category])
    const wf = pick(rng, ['Human', 'Human', 'HumanPlusCopilot', 'HumanPlusCopilot', 'HumanPlusAgent', 'AgentOnly'] as WorkforceType[])
    addPosition({
      title,
      sectionName,
      workforceType: wf,
      hireEmployee: wf !== 'AgentOnly' && employees.length < 40,
      jobDescription: {
        summary: `${title} supporting ${sectionName.toLowerCase()} operations.`,
        keyResponsibilities: ['Day-to-day execution', 'Reporting and analysis', 'Process adherence'],
        competencies: ['Domain expertise', 'Data literacy'],
        activities: wf === 'Human' ? [] : [
          { id: `AOA-${positions.length}-1`, name: 'Routine documentation', aiContributionPct: int(rng, 30, 80), contributionType: 'AgentSupported' },
          { id: `AOA-${positions.length}-2`, name: 'Exception handling', aiContributionPct: int(rng, 0, 30), contributionType: 'HumanOnly' },
        ],
      },
    })
    i++
  }

  return { positions, jobDescriptions, employees, positionIdByTitleSection }
}
