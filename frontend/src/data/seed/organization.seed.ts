// Organization hierarchy: Enterprise -> Division -> SuperDepartment ->
// Department -> Section. Hand-authored (not procedurally generated) because
// coherent, plausible DEWA-style names matter more here than volume — the
// requirement is exactly 4 divisions / 8 super departments / 16 departments /
// 25 sections (Section 21 of the requirements doc).
//
// SEC-17 "Demand-to-Delivery Section" is the home of this prototype's two
// required worked examples (POS-BA-D2D-01, AGT-D2D-DOC-01 / HAR-D2D-BRD-01).
import type { OrgNode } from '../types'

interface SectionSeed { name: string; mandate: string }
interface DeptSeed { name: string; sections: SectionSeed[] }
interface SuperDeptSeed { name: string; departments: DeptSeed[] }
interface DivisionSeed { name: string; superDepartments: SuperDeptSeed[] }

export const ORG_TREE: DivisionSeed[] = [
  {
    name: 'Generation & Production Division',
    superDepartments: [
      {
        name: 'Power Generation Super Department',
        departments: [
          {
            name: 'Power Plant Operations Department',
            sections: [
              { name: 'Plant Performance Section', mandate: 'Monitor and optimize generation unit performance and availability.' },
              { name: 'Fuel & Efficiency Section', mandate: 'Manage fuel supply planning and thermal efficiency programs.' },
            ],
          },
          {
            name: 'Generation Engineering Department',
            sections: [
              { name: 'Generation Asset Engineering Section', mandate: 'Engineering standards and lifecycle planning for generation assets.' },
            ],
          },
        ],
      },
      {
        name: 'Renewable Energy Super Department',
        departments: [
          {
            name: 'Solar & Clean Energy Department',
            sections: [
              { name: 'Solar Park Operations Section', mandate: 'Operate and maintain utility-scale solar generation assets.' },
              { name: 'Clean Energy Planning Section', mandate: 'Plan renewable capacity expansion against clean-energy targets.' },
            ],
          },
          {
            name: 'Sustainability Department',
            sections: [
              { name: 'Sustainability Reporting Section', mandate: 'Track and report enterprise sustainability and emissions KPIs.' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Transmission & Distribution Division',
    superDepartments: [
      {
        name: 'Transmission Super Department',
        departments: [
          {
            name: 'Transmission Operations Department',
            sections: [
              { name: 'Grid Control Section', mandate: 'Real-time transmission grid monitoring and dispatch control.' },
              { name: 'Transmission Maintenance Section', mandate: 'Preventive and corrective maintenance of transmission assets.' },
            ],
          },
          {
            name: 'Transmission Planning Department',
            sections: [
              { name: 'Network Planning Section', mandate: 'Long-term transmission network capacity and reliability planning.' },
            ],
          },
        ],
      },
      {
        name: 'Distribution Super Department',
        departments: [
          {
            name: 'Distribution Operations Department',
            sections: [
              { name: 'Field Services Section', mandate: 'Field crew dispatch, site visits, and distribution service delivery.' },
              { name: 'Distribution Maintenance Section', mandate: 'Distribution network inspection and maintenance programs.' },
            ],
          },
          {
            name: 'Asset Management Department',
            sections: [
              { name: 'Asset Reliability Section', mandate: 'Asset condition monitoring and reliability-centered maintenance.' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Customer & Digital Services Division',
    superDepartments: [
      {
        name: 'Customer Services Super Department',
        departments: [
          {
            name: 'Billing & Revenue Department',
            sections: [
              { name: 'Billing Operations Section', mandate: 'Meter-to-bill processing, exception handling, and billing accuracy.' },
              { name: 'Revenue Assurance Section', mandate: 'Detect and reduce revenue leakage and unbilled consumption.' },
            ],
          },
          {
            name: 'Customer Experience Department',
            sections: [
              { name: 'Customer Happiness Section', mandate: 'Customer satisfaction programs and service-quality standards.' },
              { name: 'Contact Center Section', mandate: 'Inbound customer service, complaints, and service requests.' },
            ],
          },
        ],
      },
      {
        name: 'Digital & Innovation Super Department',
        departments: [
          {
            name: 'Innovation & Technology Function Department',
            sections: [
              { name: 'Demand-to-Delivery Section', mandate: 'Own the D2D intake-to-delivery pipeline for all enterprise demand: classification, shaping, BRD preparation, build, and go-live for SAP, non-SAP, AI, and automation initiatives.' },
              { name: 'Digital Products Section', mandate: 'Product ownership for customer-facing and internal digital applications.' },
            ],
          },
          {
            name: 'Data & AI Department',
            sections: [
              { name: 'Enterprise Data Section', mandate: 'Enterprise data platform, governance, and data product delivery.' },
              { name: 'AI Platform Section', mandate: 'AI/agent platform engineering, harness standards, and model operations.' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Corporate Services Division',
    superDepartments: [
      {
        name: 'Business Support Super Department',
        departments: [
          {
            name: 'Finance Department',
            sections: [
              { name: 'Financial Planning Section', mandate: 'Budgeting, forecasting, and cost/benefit validation for enterprise initiatives.' },
            ],
          },
          {
            name: 'Human Resources Department',
            sections: [
              { name: 'Talent & Workforce Section', mandate: 'Workforce planning across human, human+agent, and agent-only roles.' },
            ],
          },
        ],
      },
      {
        name: 'Governance & Risk Super Department',
        departments: [
          {
            name: 'Procurement Department',
            sections: [
              { name: 'Vendor Management Section', mandate: 'Vendor onboarding, contract management, and procurement compliance.' },
            ],
          },
          {
            name: 'Risk & Compliance Department',
            sections: [
              { name: 'Enterprise Risk Section', mandate: 'Enterprise and AI risk assessment, controls, and incident response.' },
              { name: 'Regulatory Compliance Section', mandate: 'Regulatory adherence, audit readiness, and policy compliance.' },
            ],
          },
        ],
      },
    ],
  },
]

export interface BuiltOrg {
  orgNodes: OrgNode[]
  sectionIdByName: Record<string, string>
  divisionIdByName: Record<string, string>
}

export function buildOrganization(): BuiltOrg {
  const orgNodes: OrgNode[] = []
  const sectionIdByName: Record<string, string> = {}
  const divisionIdByName: Record<string, string> = {}
  let divN = 0, sdN = 0, dptN = 0, secN = 0

  const enterpriseId = 'ENT-00'
  orgNodes.push({
    id: enterpriseId, level: 'Enterprise', name: 'DEWA', parentId: null, divisionId: null,
    mandate: 'Dubai Electricity & Water Authority — enterprise root.',
    headcountHuman: 0, headcountAgent: 0, strategicObjectiveIds: [],
  })

  for (const div of ORG_TREE) {
    divN++
    const divisionId = `DIV-${String(divN).padStart(2, '0')}`
    divisionIdByName[div.name] = divisionId
    orgNodes.push({
      id: divisionId, level: 'Division', name: div.name, parentId: enterpriseId, divisionId,
      headcountHuman: 0, headcountAgent: 0, strategicObjectiveIds: [],
    })

    for (const sd of div.superDepartments) {
      sdN++
      const superDeptId = `SD-${String(sdN).padStart(2, '0')}`
      orgNodes.push({
        id: superDeptId, level: 'SuperDepartment', name: sd.name, parentId: divisionId, divisionId,
        headcountHuman: 0, headcountAgent: 0, strategicObjectiveIds: [],
      })

      for (const dpt of sd.departments) {
        dptN++
        const deptId = `DPT-${String(dptN).padStart(2, '0')}`
        orgNodes.push({
          id: deptId, level: 'Department', name: dpt.name, parentId: superDeptId, divisionId,
          headcountHuman: 0, headcountAgent: 0, strategicObjectiveIds: [],
        })

        for (const sec of dpt.sections) {
          secN++
          const sectionId = `SEC-${String(secN).padStart(2, '0')}`
          sectionIdByName[sec.name] = sectionId
          orgNodes.push({
            id: sectionId, level: 'Section', name: sec.name, parentId: deptId, divisionId,
            mandate: sec.mandate,
            headcountHuman: 0, headcountAgent: 0, strategicObjectiveIds: [],
          })
        }
      }
    }
  }

  return { orgNodes, sectionIdByName, divisionIdByName }
}
