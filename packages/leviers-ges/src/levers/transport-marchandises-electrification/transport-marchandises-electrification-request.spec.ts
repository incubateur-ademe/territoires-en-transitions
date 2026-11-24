import { describe, expect, it } from 'vitest'
import { transportMarchandisesElectrificationRequestSchema } from './transport-marchandises-electrification-request.ts'

function issuesOf(parameters: unknown): readonly string[] {
  const result = transportMarchandisesElectrificationRequestSchema.safeParse({
    id: 'transport_marchandises_electrification',
    territory: { level: 'region', code: '84' },
    parameters,
  })
  if (result.success) return []
  return result.error.issues.map(({ path }) => path.join('.'))
}

describe('transportMarchandisesElectrificationRequestSchema', () => {
  it.each(['0', '0.2', '1'])('accepte la part %s', (additionalElectrifiedFleetFraction) => {
    expect(issuesOf({ additionalElectrifiedFleetFraction })).toEqual([])
  })

  it.each(['1.5', '-0.1', 'abc'])('refuse la part %j sans lever d’exception', (value) => {
    expect(issuesOf({ additionalElectrifiedFleetFraction: value })).toEqual([
      'parameters.additionalElectrifiedFleetFraction',
    ])
  })

  it('refuse un paramètre manquant et un paramètre en trop', () => {
    expect(issuesOf({}).length).toBeGreaterThan(0)
    expect(
      issuesOf({ additionalElectrifiedFleetFraction: '0.1', extra: '1' }).length,
    ).toBeGreaterThan(0)
  })
})
