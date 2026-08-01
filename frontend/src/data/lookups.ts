// Small cross-module ID -> name lookups, shared by any page that needs to
// display a human-readable label for a foreign key. Kept separate from
// organizationAggregates.ts / processesAggregates.ts / etc. because these
// are genuinely generic (not scoped to one module's join logic) — grepped
// for before writing a duplicate in initiativesAggregates.ts/agentsAggregates.ts.
import { dataset } from './mockApi'
import type { ID } from './types'

export function employeeName(id: ID | undefined): string | null {
  if (!id) return null
  return dataset.employees.find((e) => e.id === id)?.name ?? null
}

export function processName(id: ID | undefined): string | null {
  if (!id) return null
  return dataset.processes.find((p) => p.id === id)?.name ?? null
}

export function positionTitle(id: ID | undefined): string | null {
  if (!id) return null
  return dataset.positions.find((p) => p.id === id)?.title ?? null
}

export function qpTitle(id: ID | undefined): string | null {
  if (!id) return null
  return dataset.qualityProcedures.find((q) => q.id === id)?.title ?? null
}

export function strategicObjectiveName(id: ID | undefined): string | null {
  if (!id) return null
  return dataset.strategicObjectives.find((o) => o.id === id)?.name ?? null
}

export function excellenceCriterionName(id: ID | undefined): string | null {
  if (!id) return null
  return dataset.excellenceCriteria.find((c) => c.id === id)?.name ?? null
}

export function d2dDemandTitle(id: ID | undefined): string | null {
  if (!id) return null
  return dataset.d2dDemands.find((d) => d.id === id)?.title ?? null
}
