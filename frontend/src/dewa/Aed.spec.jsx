import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guard against a bug that shipped across twelve files: `<Aed usd={…}>`
 * multiplies by 3.6725 to convert USD to AED, but every figure in this
 * prototype's dataset is ALREADY in dirhams. Using it inflated money by 3.67x
 * in the Agents, Processes, D2D and AI Initiatives modules, so the same
 * underlying number rendered differently depending on which page you were on.
 *
 * There is no USD anywhere in this app, so the prop must never be used.
 */
function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return walk(path)
    return /\.(jsx?|tsx?)$/.test(entry) ? [path] : []
  })
}

describe('money rendering', () => {
  it('never converts from USD — every figure in this dataset is already in AED', () => {
    const offenders = walk(join(import.meta.dirname, '..'))
      .filter((file) => !file.endsWith('Aed.spec.jsx') && !file.endsWith('Aed.jsx'))
      .filter((file) => /<Aed\s+usd=/.test(readFileSync(file, 'utf8')))
    expect(offenders, `use <Aed aed={…}> instead:\n${offenders.join('\n')}`).toEqual([])
  })

  it('never hardcodes a currency string where the dirham glyph belongs', () => {
    const offenders = walk(join(import.meta.dirname, '..', '..', 'src', 'pages'))
      .filter((file) => /prefix="AED |prefix='AED /.test(readFileSync(file, 'utf8')))
    expect(offenders, `use <KpiCard currency> instead:\n${offenders.join('\n')}`).toEqual([])
  })
})
