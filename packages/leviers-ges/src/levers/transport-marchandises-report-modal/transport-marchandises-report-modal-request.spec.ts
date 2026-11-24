import { describe, expect, it } from 'vitest'
import { transportMarchandisesReportModalRequestSchema } from './transport-marchandises-report-modal-request.ts'

function parametersOf(parameters: unknown) {
  return transportMarchandisesReportModalRequestSchema.safeParse({
    id: 'transport_marchandises_report_modal',
    territory: { level: 'region', code: '84' },
    parameters,
  })
}

function issuesOf(parameters: unknown): readonly string[] {
  const result = parametersOf(parameters)
  if (result.success) return []
  return result.error.issues.map(({ path }) => path.join('.'))
}

describe('transportMarchandisesReportModalRequestSchema', () => {
  it('accepte deux reports sans cyclologistique', () => {
    expect(parametersOf({ roadToRailFraction: '0.1', roadToWaterwayFraction: '0.05' }).success).toBe(true)
  })

  it('accepte des t.km de cyclologistique', () => {
    expect(
      parametersOf({
        roadToRailFraction: '0.1',
        roadToWaterwayFraction: '0.05',
        cyclologisticTonneKilometres: '1000000',
      }).success,
    ).toBe(true)
  })

  it('accepte un report total de 100 % exactement', () => {
    expect(parametersOf({ roadToRailFraction: '0.6', roadToWaterwayFraction: '0.4' }).success).toBe(true)
  })

  it('refuse un report total de plus de 100 %', () => {
    expect(issuesOf({ roadToRailFraction: '0.7', roadToWaterwayFraction: '0.4' })).toEqual([
      'parameters.roadToWaterwayFraction',
    ])
  })

  it.each([
    ['des t.km négatives', { roadToRailFraction: '0', roadToWaterwayFraction: '0', cyclologisticTonneKilometres: '-1' }, 'cyclologisticTonneKilometres'],
    ['un texte pour les t.km', { roadToRailFraction: '0', roadToWaterwayFraction: '0', cyclologisticTonneKilometres: 'abc' }, 'cyclologisticTonneKilometres'],
    ['une fraction hors de 0 à 1', { roadToRailFraction: '1.5', roadToWaterwayFraction: '0' }, 'roadToRailFraction'],
    ['une fraction textuelle', { roadToRailFraction: 'abc', roadToWaterwayFraction: '0' }, 'roadToRailFraction'],
  ])('refuse %s sans lever d’exception', (_label, parameters, field) => {
    expect(issuesOf(parameters)).toEqual([`parameters.${field}`])
  })

  it('refuse un report manquant et un paramètre en trop', () => {
    expect(issuesOf({ roadToRailFraction: '0.1' }).length).toBeGreaterThan(0)
    expect(issuesOf({ roadToRailFraction: '0', roadToWaterwayFraction: '0', extra: '1' }).length).toBeGreaterThan(0)
  })
})
