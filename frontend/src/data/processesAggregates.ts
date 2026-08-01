// Derived data for the Processes & Quality Procedures module (requirements
// doc Section 6). Mirrors the data/executiveAggregates.ts and
// data/organizationAggregates.ts pattern: joins/rollups computed once here,
// never hand-computed inline in a page component.
import { dataset } from './mockApi'
import type { ID, QpStatus, QpIndicator, QualityProcedure } from './types'

export function qpsForProcess(processId: ID): QualityProcedure[] {
  return dataset.qualityProcedures.filter((q) => q.relatedProcessId === processId)
}

export function divisionName(divisionId: ID): string {
  return dataset.orgNodes.find((n) => n.id === divisionId)?.name ?? 'Unknown division'
}

export function sectionName(sectionId: ID): string {
  return dataset.orgNodes.find((n) => n.id === sectionId)?.name ?? 'Unknown section'
}

export function qpStatusBreakdown(): Record<QpStatus, number> {
  const counts: Record<QpStatus, number> = { Draft: 0, Active: 0, UnderReview: 0, Expired: 0, Retired: 0 }
  for (const q of dataset.qualityProcedures) counts[q.status]++
  return counts
}

export function qpIndicatorBreakdown(): Record<QpIndicator, number> {
  const counts: Record<QpIndicator, number> = { H: 0, 'H+A': 0, 'A+H': 0, A: 0, C: 0, E: 0 }
  for (const q of dataset.qualityProcedures) counts[q.indicator]++
  return counts
}

export function overdueQps(referenceDate: Date = new Date()): QualityProcedure[] {
  return dataset.qualityProcedures.filter((q) => new Date(q.reviewDate) < referenceDate && q.status !== 'Retired')
}

export function avgQpCoverage(): { current: number; target: number } {
  const qps = dataset.qualityProcedures
  if (qps.length === 0) return { current: 0, target: 0 }
  return {
    current: qps.reduce((s, q) => s + q.currentAiCoveragePct, 0) / qps.length,
    target: qps.reduce((s, q) => s + q.targetAiCoveragePct, 0) / qps.length,
  }
}

export function agentName(agentId: ID | undefined): string | null {
  if (!agentId) return null
  return dataset.agents.find((a) => a.id === agentId)?.name ?? null
}

export function harnessName(harnessId: ID | undefined): string | null {
  if (!harnessId) return null
  return dataset.harnesses.find((h) => h.id === harnessId)?.name ?? null
}
