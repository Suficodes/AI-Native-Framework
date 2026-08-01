// Seeded PRNG — deterministic mock data (same seed → same output every run,
// so screenshots/tests/demos are reproducible) without a faker dependency.
// mulberry32: small, fast, good-enough distribution for mock data generation.
export function makeRng(seed: number) {
  let a = seed >>> 0
  return function rng(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof makeRng>

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

export function pickMany<T>(rng: Rng, items: readonly T[], count: number): T[] {
  const pool = [...items]
  const out: T[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function float(rng: Rng, min: number, max: number, decimals = 1): number {
  const v = rng() * (max - min) + min
  const p = 10 ** decimals
  return Math.round(v * p) / p
}

export function bool(rng: Rng, trueProbability = 0.5): boolean {
  return rng() < trueProbability
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Dates within the reporting horizon this prototype uses (2025-08 .. 2026-07).
export function isoDate(rng: Rng, startYear = 2025, startMonth = 8, spanDays = 365): string {
  const start = new Date(Date.UTC(startYear, startMonth - 1, 1)).getTime()
  const offsetMs = int(rng, 0, spanDays) * 86400000
  return new Date(start + offsetMs).toISOString().slice(0, 10)
}
