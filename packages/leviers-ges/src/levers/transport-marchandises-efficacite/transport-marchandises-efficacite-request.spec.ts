import { describe, expect, it } from 'vitest'
import { transportMarchandisesEfficaciteRequestSchema } from './transport-marchandises-efficacite-request.ts'

function issuesOf(parameters: unknown): readonly string[] {
  const result = transportMarchandisesEfficaciteRequestSchema.safeParse({
    id: 'transport_marchandises_efficacite',
    territory: { level: 'region', code: '84' },
    parameters,
  })
  if (result.success) return []
  return result.error.issues.map(({ path }) => path.join('.'))
}

describe('transportMarchandisesEfficaciteRequestSchema', () => {
  it('accepte une application de l’écoconduite et une hausse du chargement', () => {
    expect(issuesOf({ ecodrivingApplicationFraction: '0.5', loadFactorIncrease: '0.2' })).toEqual([])
  })

  it('accepte une hausse du chargement supérieure à 100 %', () => {
    expect(issuesOf({ ecodrivingApplicationFraction: '0', loadFactorIncrease: '2' })).toEqual([])
  })

  it.each([
    ['une application hors de 0 à 1', { ecodrivingApplicationFraction: '1.5', loadFactorIncrease: '0' }, 'ecodrivingApplicationFraction'],
    ['une application textuelle', { ecodrivingApplicationFraction: 'abc', loadFactorIncrease: '0' }, 'ecodrivingApplicationFraction'],
    ['une hausse négative', { ecodrivingApplicationFraction: '0', loadFactorIncrease: '-0.1' }, 'loadFactorIncrease'],
    ['une hausse textuelle', { ecodrivingApplicationFraction: '0', loadFactorIncrease: 'abc' }, 'loadFactorIncrease'],
  ])('refuse %s sans lever d’exception', (_label, parameters, field) => {
    expect(issuesOf(parameters)).toEqual([`parameters.${field}`])
  })

  it('refuse un paramètre manquant et un paramètre en trop', () => {
    expect(issuesOf({ ecodrivingApplicationFraction: '0.5' }).length).toBeGreaterThan(0)
    expect(
      issuesOf({ ecodrivingApplicationFraction: '0', loadFactorIncrease: '0', extra: '1' }).length,
    ).toBeGreaterThan(0)
  })
})
