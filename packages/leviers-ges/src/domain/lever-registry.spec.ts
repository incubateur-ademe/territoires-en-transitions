import { describe, expect, expectTypeOf, it } from 'vitest'
import { getStatus, isComputed, LEVERS, type ComputedLevels, type Status } from './lever-registry.ts'
import type { Level } from './territory.ts'

const levers = Object.entries(LEVERS)
const statuses = levers.flatMap(([, byLevel]) => Object.values<Status>(byLevel))

function countOf(status: Status): number {
  return statuses.filter((candidate) => candidate === status).length
}

describe('lever-registry', () => {
  it('compte 21 leviers et 63 statuts', () => {
    expect(levers).toHaveLength(21)
    expect(statuses).toHaveLength(63)
  })

  it('chaque levier a un statut aux trois niveaux', () => {
    const expectedLevels: Level[] = ['departement', 'epci', 'region']
    levers.forEach(([, byLevel]) => {
      expect(Object.keys(byLevel).sort()).toEqual(expectedLevels)
    })
  })

  it.each(['haies', 'pratiques_stockantes'] as const)(
    '%s, sans territoire, a le même statut aux trois niveaux',
    (lever) => {
      expect(new Set(Object.values(LEVERS[lever]))).toHaveProperty('size', 1)
    },
  )

  it('compte 17 no_open_question, 37 workaround et 9 not_computed', () => {
    expect({
      noOpenQuestion: countOf('no_open_question'),
      workaround: countOf('workaround'),
      notComputed: countOf('not_computed'),
    }).toEqual({ noOpenQuestion: 17, workaround: 37, notComputed: 9 })
  })

  it('compte 21 leviers calculables sur au moins un niveau', () => {
    const computable = levers.filter(([, byLevel]) => Object.values<Status>(byLevel).some(isComputed))
    expect(computable).toHaveLength(21)
  })

  it('aucun levier n’est exclu : chacun est calculé à un niveau au moins', () => {
    const excluded = levers.filter(([, byLevel]) => !Object.values<Status>(byLevel).some(isComputed))
    expect(excluded).toEqual([])
  })

  it('donne le statut d’un levier à un niveau', () => {
    expect(getStatus({ lever: 'elevage_durable', level: 'epci' })).toBe('not_computed')
    expect(getStatus({ lever: 'haies', level: 'epci' })).toBe('no_open_question')
    expect(getStatus({ lever: 'transport_marchandises_efficacite', level: 'region' })).toBe('workaround')
  })

  it('les niveaux calculés sont typés par levier', () => {
    expectTypeOf<ComputedLevels<'haies'>>().toEqualTypeOf<Level>()
    expectTypeOf<ComputedLevels<'elevage_durable'>>().toEqualTypeOf<'region' | 'departement'>()
    expectTypeOf<ComputedLevels<'transport_marchandises_report_modal'>>().toEqualTypeOf<'region'>()
    expectTypeOf<ComputedLevels<'occupation_des_sols'>>().toEqualTypeOf<Level>()
  })
})
