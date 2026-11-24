import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LEVER_LIMITS } from '../../domain/lever-limits.ts'
import { buildLeverLimitsSource } from './build-lever-limits-source.ts'
import { readMethodologies } from './read-methodologies.ts'

const generatedFile = join(import.meta.dirname, '..', '..', 'domain', 'lever-limits.ts')

describe('lever-limits', () => {
  it('le fichier généré reprend les tableaux Limites des methodology.md (pnpm build:limits)', () => {
    expect(readFileSync(generatedFile, 'utf8')).toBe(buildLeverLimitsSource(readMethodologies()))
  })

  it.each(Object.entries(LEVER_LIMITS))('%s a au moins une limite', (_lever, limits) => {
    expect(limits.length).toBeGreaterThan(0)
  })

  it.each(Object.entries(LEVER_LIMITS))('%s : chaque limite et chaque effet sont renseignés', (_lever, limits) => {
    limits.forEach(({ limit, effect }) => {
      expect({ limit: limit.length > 0, effect: effect.length > 0 }).toEqual({
        limit: true,
        effect: true,
      })
    })
  })
})
