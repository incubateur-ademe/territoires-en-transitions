import { describe, expect, it } from 'vitest'
import { elevageDurableRequestSchema } from './elevage-durable-request.ts'

const CURRENT_DAIRY_COW_SHARES = { liquid: '0.41', solid: '0.2', pasture: '0.39', anaerobicDigestion: '0' }

function requestWith(animals: unknown) {
  return elevageDurableRequestSchema.safeParse({
    id: 'elevage_durable',
    territory: { level: 'region', code: '84' },
    parameters: { animals },
  })
}

function dairyCows(overrides: Record<string, unknown> = {}) {
  return {
    dairyCows: {
      headcountReductionFraction: '0.1',
      targetManureShares: CURRENT_DAIRY_COW_SHARES,
      ...overrides,
    },
  }
}

function issuesOf(animals: unknown): readonly { path: string; message: string }[] {
  const result = requestWith(animals)
  if (result.success) return []
  return result.error.issues.map(({ path, message }) => ({ path: path.join('.'), message }))
}

describe('elevageDurableRequestSchema', () => {
  it('accepte un animal avec ses trois paramètres', () => {
    expect(requestWith(dairyCows({ entericEmissionReductionFraction: '0.05' })).success).toBe(true)
  })

  it('accepte un animal sans baisse du facteur entérique', () => {
    expect(requestWith(dairyCows()).success).toBe(true)
  })

  it('accepte des parts de 100 % exactement, décimales comprises', () => {
    const targetManureShares = { liquid: '0.1', solid: '0.2', pasture: '0.3', anaerobicDigestion: '0.4' }
    expect(requestWith(dairyCows({ targetManureShares })).success).toBe(true)
  })

  it('refuse des parts dont la somme n’est pas 100 %', () => {
    const targetManureShares = { liquid: '0.5', solid: '0.2', pasture: '0.2', anaerobicDigestion: '0' }
    expect(issuesOf(dairyCows({ targetManureShares }))).toEqual([
      { path: 'parameters.animals.dairyCows.targetManureShares', message: 'must add up to 100%' },
    ])
  })

  it('refuse le lisier pour des ovins, sans facteur de conversion', () => {
    const sheep = {
      sheep: {
        headcountReductionFraction: '0',
        targetManureShares: { liquid: '0.5', solid: '0.5', pasture: '0', anaerobicDigestion: '0' },
      },
    }
    expect(issuesOf(sheep)).toEqual([
      {
        path: 'parameters.animals.sheep.targetManureShares.liquid',
        message: 'liquid manure is not an available management mode for sheep',
      },
    ])
  })

  it('refuse la méthanisation pour des poules, sans facteur', () => {
    const layingHens = {
      layingHens: {
        headcountReductionFraction: '0',
        targetManureShares: { liquid: '0', solid: '0.5', pasture: '0', anaerobicDigestion: '0.5' },
      },
    }
    expect(issuesOf(layingHens)).toEqual([
      {
        path: 'parameters.animals.layingHens.targetManureShares.anaerobicDigestion',
        message: 'anaerobic digestion has no emission factor for layingHens',
      },
    ])
  })

  it('accepte le lisier et la méthanisation pour des bovins et des porcins', () => {
    const shares = { liquid: '0.5', solid: '0', pasture: '0', anaerobicDigestion: '0.5' }
    const animals = Object.fromEntries(
      ['dairyCows', 'otherCattle', 'sows', 'otherPigs'].map((animal) => [
        animal,
        { headcountReductionFraction: '0', targetManureShares: shares },
      ]),
    )
    expect(requestWith(animals).success).toBe(true)
  })

  it('refuse une requête qui ne change aucun animal', () => {
    expect(issuesOf({})).toEqual([
      { path: 'parameters.animals', message: 'must change at least one animal type' },
    ])
  })

  it.each([
    ['une fraction hors de 0 à 1', dairyCows({ headcountReductionFraction: '1.5' }), 'headcountReductionFraction'],
    ['un texte', dairyCows({ entericEmissionReductionFraction: 'abc' }), 'entericEmissionReductionFraction'],
  ])('refuse %s sans lever d’exception', (_label, animals, field) => {
    expect(issuesOf(animals).map(({ path }) => path)).toEqual([`parameters.animals.dairyCows.${field}`])
  })

  it('refuse une part qui n’est pas un nombre sans lever d’exception', () => {
    const targetManureShares = { ...CURRENT_DAIRY_COW_SHARES, liquid: 'abc' }
    expect(issuesOf(dairyCows({ targetManureShares })).map(({ path }) => path)).toEqual([
      'parameters.animals.dairyCows.targetManureShares.liquid',
    ])
  })

  it('refuse un type d’animal inconnu et un paramètre manquant', () => {
    expect(issuesOf({ cows: {} }).length).toBeGreaterThan(0)
    expect(issuesOf({ dairyCows: { headcountReductionFraction: '0.1' } }).length).toBeGreaterThan(0)
  })
})
