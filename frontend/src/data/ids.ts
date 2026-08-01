// ID generators — stable, human-readable, prefix-per-entity (see CONVENTIONS.md
// "Naming"). Each counter is independent so re-seeding is deterministic.
const counters: Record<string, number> = {}

function next(prefix: string, pad = 2): string {
  counters[prefix] = (counters[prefix] ?? 0) + 1
  return `${prefix}-${String(counters[prefix]).padStart(pad, '0')}`
}

export const nextDivisionId = () => next('DIV')
export const nextSuperDeptId = () => next('SD')
export const nextDeptId = () => next('DPT')
export const nextSectionId = () => next('SEC')
export const nextPositionId = () => next('POS', 3)
export const nextEmployeeId = () => next('EMP', 3)
export const nextAgentId = () => next('AGT', 3)
export const nextProcessId = () => next('PROC')
export const nextProcessStepId = () => next('PSTEP', 3)
export const nextQpId = () => next('QP')
export const nextInitiativeId = () => next('INIT')
export const nextHarnessId = () => next('HAR')
export const nextDemandId = (year = 2026) => {
  counters[`DEM-${year}`] = (counters[`DEM-${year}`] ?? 0) + 1
  return `DEM-${year}-${String(counters[`DEM-${year}`]).padStart(4, '0')}`
}
export const nextVrId = () => next('VR')
export const nextSoId = () => next('SO')
export const nextEcId = () => next('EC')
export const nextRoomId = () => next('ROOM')
export const nextSkillId = () => next('SKILL')
export const nextLessonId = () => next('LES')
export const nextWorkItemId = () => next('WI', 4)
export const nextCopilotUsageId = () => next('CU', 3)
export const nextPerfId = () => next('PERF', 3)
export const nextTokenUsageId = () => next('TU', 5)
export const nextTxId = () => next('TX', 6)
export const nextAgentRunId = () => next('RUN', 5)
export const nextTraceId = () => next('TRACE', 3)
export const nextIncidentId = () => next('INC', 3)
export const nextAlertRuleId = () => next('ALERT', 2)

// Reset all counters — used only by dev/test smoke scripts that re-seed.
export function resetIdCounters() {
  for (const k of Object.keys(counters)) delete counters[k]
}
