// Dev-only smoke test for the mock dataset: verifies Section 21 volumes,
// zero dangling foreign keys, and full fidelity of the two required worked
// examples. Run with: npx tsx scripts/smoke-data.ts
// Not part of the build — delete once CI-based data tests exist (see
// CONVENTIONS.md "Testing").
import { buildDataset } from '../src/data/dataset'
import { aiWorkCoverage, qualityAdjustedAiCoverage, acceptanceRate, accuracyRate, verifiedCapacityReleasedHours } from '../src/lib/calc'

const ds = buildDataset()
let failures = 0

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${label}`)
  } else {
    failures++
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('\n=== Section 21 volumes ===')
check('4 divisions', ds.orgNodes.filter((n) => n.level === 'Division').length === 4, String(ds.orgNodes.filter((n) => n.level === 'Division').length))
check('8 super departments', ds.orgNodes.filter((n) => n.level === 'SuperDepartment').length === 8, String(ds.orgNodes.filter((n) => n.level === 'SuperDepartment').length))
check('16 departments', ds.orgNodes.filter((n) => n.level === 'Department').length === 16, String(ds.orgNodes.filter((n) => n.level === 'Department').length))
check('25 sections', ds.orgNodes.filter((n) => n.level === 'Section').length === 25, String(ds.orgNodes.filter((n) => n.level === 'Section').length))
check('60 positions', ds.positions.length === 60, String(ds.positions.length))
check('40 employees', ds.employees.length === 40, String(ds.employees.length))
check('15 agents', ds.agents.length === 15, String(ds.agents.length))
check('20 processes', ds.processes.length === 20, String(ds.processes.length))
check('15 quality procedures', ds.qualityProcedures.length === 15, String(ds.qualityProcedures.length))
check('20 AI initiatives', ds.aiInitiatives.length === 20, String(ds.aiInitiatives.length))
check('15 harnesses', ds.harnesses.length === 15, String(ds.harnesses.length))
check('15 VR records', ds.vrRecords.length === 15, String(ds.vrRecords.length))

console.log('\n=== Foreign key integrity ===')
const positionIds = new Set(ds.positions.map((p) => p.id))
const employeeIds = new Set(ds.employees.map((e) => e.id))
const sectionIds = new Set(ds.orgNodes.filter((n) => n.level === 'Section').map((n) => n.id))
const agentIds = new Set(ds.agents.map((a) => a.id))
const processIds = new Set(ds.processes.map((p) => p.id))
const harnessIds = new Set(ds.harnesses.map((h) => h.id))
const qpIds = new Set(ds.qualityProcedures.map((q) => q.id))
const soIds = new Set(ds.strategicObjectives.map((s) => s.id))
const initiativeIds = new Set(ds.aiInitiatives.map((i) => i.id))

check('every Employee.positionId resolves', ds.employees.every((e) => positionIds.has(e.positionId)))
check('every Employee.sectionId resolves', ds.employees.every((e) => sectionIds.has(e.sectionId)))
check('every Position.sectionId resolves', ds.positions.every((p) => sectionIds.has(p.sectionId)))
check('every Position.assignedEmployeeId (non-null) resolves', ds.positions.every((p) => !p.assignedEmployeeId || employeeIds.has(p.assignedEmployeeId)))
check('every Agent.managerEmployeeId resolves', ds.agents.every((a) => employeeIds.has(a.managerEmployeeId)))
check('every Agent.businessOwnerEmployeeId resolves', ds.agents.every((a) => employeeIds.has(a.businessOwnerEmployeeId)))
check('every Agent.technicalOwnerEmployeeId resolves', ds.agents.every((a) => employeeIds.has(a.technicalOwnerEmployeeId)))
check('every Agent.riskOwnerEmployeeId resolves', ds.agents.every((a) => employeeIds.has(a.riskOwnerEmployeeId)))
check('every Agent.harnessId (non-null) resolves', ds.agents.every((a) => !a.harnessId || harnessIds.has(a.harnessId)))
check('every Harness.assignedAgentId resolves', ds.harnesses.every((h) => agentIds.has(h.assignedAgentId)))
check('every Harness.businessOwnerId resolves', ds.harnesses.every((h) => employeeIds.has(h.businessOwnerId)))
check('every Harness.technicalOwnerId resolves', ds.harnesses.every((h) => employeeIds.has(h.technicalOwnerId)))
check('every ProcessStep.processId resolves', ds.processSteps.every((s) => processIds.has(s.processId)))
check('every QualityProcedure.relatedProcessId resolves', ds.qualityProcedures.every((q) => processIds.has(q.relatedProcessId)))
check('every AIInitiative.strategicObjectiveId resolves', ds.aiInitiatives.every((i) => soIds.has(i.strategicObjectiveId)))
check('every AIInitiative.businessOwnerId resolves', ds.aiInitiatives.every((i) => employeeIds.has(i.businessOwnerId)))
check('every VRRecord.aiInitiativeId resolves', ds.vrRecords.every((v) => initiativeIds.has(v.aiInitiativeId)))
check('every VRRecord.financeValidatorId resolves', ds.vrRecords.every((v) => employeeIds.has(v.financeValidatorId)))
check('every WorkContributionRecord.employeeId resolves', ds.workContribution.every((w) => employeeIds.has(w.employeeId)))
check('every D2DDemand.submitterEmployeeId resolves', ds.d2dDemands.every((d) => employeeIds.has(d.submitterEmployeeId)))
check('every AgentPerformanceRecord.agentId resolves', ds.agentPerformance.every((p) => agentIds.has(p.agentId)))
check('every AgentRunEvent.agentId resolves', ds.agentRuns.every((r) => agentIds.has(r.agentId)))
check('every Trace.agentId resolves', ds.traces.every((t) => agentIds.has(t.agentId)))
check('every AIRoom.sponsorId resolves', ds.aiRooms.every((r) => employeeIds.has(r.sponsorId)))
check('every AIRoom.agentIds[] resolves', ds.aiRooms.every((r) => r.agentIds.every((id) => agentIds.has(id))))
check('every AIRoom.priorityProcessIds[] resolves', ds.aiRooms.every((r) => r.priorityProcessIds.every((id) => processIds.has(id))))

console.log('\n=== Worked example: POS-BA-D2D-01 (Senior Business Analyst) ===')
const ba = ds.positions.find((p) => p.id === 'POS-BA-D2D-01')
check('position exists', !!ba)
if (ba) {
  check('workforceType is HumanPlusAgent', ba.workforceType === 'HumanPlusAgent')
  const jd = ds.jobDescriptions.find((j) => j.id === ba.jobDescriptionId)
  check('job description exists', !!jd)
  const activities = jd?.activities ?? []
  check('6 activities', activities.length === 6, String(activities.length))
  const expected: Record<string, number> = {
    'Requirement documentation': 70, 'Process analysis': 40, 'Stakeholder meetings': 10,
    'Duplicate demand checking': 95, 'BRD formatting': 100, 'Final approval': 0,
  }
  for (const [name, pct] of Object.entries(expected)) {
    const a = activities.find((x) => x.name === name)
    check(`activity "${name}" = ${pct}%`, a?.aiContributionPct === pct, `got ${a?.aiContributionPct}`)
  }
}

console.log('\n=== Worked example: AGT-D2D-DOC-01 / HAR-D2D-BRD-01 ===')
const agent = ds.agents.find((a) => a.id === 'AGT-D2D-DOC-01')
check('agent exists', !!agent)
check('agent.harnessId is HAR-D2D-BRD-01', agent?.harnessId === 'HAR-D2D-BRD-01')
const harness = ds.harnesses.find((h) => h.id === 'HAR-D2D-BRD-01')
check('harness exists', !!harness)
check('10 guardrails', harness?.guardrails.length === 10, String(harness?.guardrails.length))
check('9 evaluation criteria', harness?.evaluationSuite.length === 9, String(harness?.evaluationSuite.length))
check('11-block workflow', harness?.workflowStages.length === 11, String(harness?.workflowStages.length))
const workedTrace = ds.traces.find((t) => t.id === 'TRACE-001')
check('worked trace exists', !!workedTrace)
check('worked trace has 13 steps', workedTrace?.steps.length === 13, String(workedTrace?.steps.length))

console.log('\n=== Formulas (Copilot & Workforce Ledger) ===')
const coverage = aiWorkCoverage(ds.workContribution)
const acc = acceptanceRate(ds.workContribution)
const accu = accuracyRate(ds.workContribution)
const qac = qualityAdjustedAiCoverage(coverage, acc, accu)
const released = verifiedCapacityReleasedHours(ds.workContribution)
console.log(`  AI Work Coverage: ${coverage.toFixed(1)}%`)
console.log(`  Acceptance rate: ${(acc * 100).toFixed(1)}%`)
console.log(`  Accuracy rate: ${(accu * 100).toFixed(1)}%`)
console.log(`  Quality-Adjusted AI Coverage: ${qac.toFixed(1)}%`)
console.log(`  Verified capacity released: ${released.toFixed(0)}h`)
check('coverage is a plausible % (10-70)', coverage > 10 && coverage < 70)
check('quality-adjusted <= coverage', qac <= coverage)

console.log(`\n${failures === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`)
process.exit(failures === 0 ? 0 : 1)
