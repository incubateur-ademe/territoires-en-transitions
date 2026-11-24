import { describe, expect, expectTypeOf, it } from 'vitest'
import { computedStatusOf, ensureLevelComputed } from './ensure-level-computed.ts'

describe('ensureLevelComputed', () => {
  it.each(['region', 'departement', 'epci'] as const)(
    'accepte reseaux_chaleur au niveau %s et rend ce niveau',
    (level) => {
      expect(ensureLevelComputed({ lever: 'reseaux_chaleur', level })._unsafeUnwrap()).toBe(level)
    },
  )

  it('accepte un niveau avec contournement : fertilisation azotée au département', () => {
    expect(
      ensureLevelComputed({ lever: 'fertilisation_azotee', level: 'departement' })._unsafeUnwrap(),
    ).toBe('departement')
  })

  it.each([
    ['elevage_durable', 'epci'],
    ['transport_marchandises_report_modal', 'departement'],
    ['transport_marchandises_efficacite', 'epci'],
  ] as const)('refuse %s au niveau %s', (lever, level) => {
    expect(ensureLevelComputed({ lever, level })._unsafeUnwrapErr()).toEqual({
      kind: 'level_not_computed',
      lever,
      level,
    })
  })

  it('le niveau rendu exclut les niveaux non calculés du levier', () => {
    const computed = ensureLevelComputed({ lever: 'elevage_durable', level: 'region' })
    expectTypeOf(computed._unsafeUnwrap()).toEqualTypeOf<'region' | 'departement'>()
  })
})

describe('computedStatusOf', () => {
  it.each([
    ['reseaux_chaleur', 'epci', 'no_open_question'],
    ['residentiel_renovation', 'departement', 'workaround'],
  ] as const)('%s au niveau %s : %s', (lever, level, status) => {
    expect(computedStatusOf({ lever, level })._unsafeUnwrap()).toBe(status)
  })

  it('refuse un niveau non calculé', () => {
    expect(computedStatusOf({ lever: 'elevage_durable', level: 'epci' })._unsafeUnwrapErr()).toEqual({
      kind: 'level_not_computed',
      lever: 'elevage_durable',
      level: 'epci',
    })
  })
})
