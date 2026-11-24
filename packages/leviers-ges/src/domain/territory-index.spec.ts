import { describe, expect, it } from 'vitest'
import { territoryCodeSchema, type Level, type Territory } from './territory.ts'
import { buildTerritoryIndex, type Commune } from './territory-index.ts'

const COMMUNES: readonly Commune[] = [
  { code: '01001', epci: '200069193', departement: '01', region: '84' },
  { code: '01002', epci: '200069193', departement: '01', region: '84' },
  { code: '69001', epci: '200069193', departement: '69', region: '84' },
  { code: '69002', epci: '246900740', departement: '69', region: '84' },
  { code: '2A004', epci: undefined, departement: '2A', region: '94' },
  { code: '2B033', epci: undefined, departement: '2B', region: '94' },
]

function territory<L extends Level>(level: L, code: string): Territory<L> {
  return { level, code: territoryCodeSchema.parse(code) }
}

const index = buildTerritoryIndex(COMMUNES)

describe('buildTerritoryIndex', () => {
  it.each([
    ['region', '84', ['01001', '01002', '69001', '69002']],
    ['region', '94', ['2A004', '2B033']],
    ['departement', '69', ['69001', '69002']],
    ['departement', '2A', ['2A004']],
    ['epci', '200069193', ['01001', '01002', '69001']],
    ['epci', '246900740', ['69002']],
  ] as const)('les communes du niveau %s %s', (level, code, expected) => {
    expect(index.communesOf(territory(level, code))._unsafeUnwrap()).toEqual(expected)
  })

  it('un EPCI à cheval couvre ses départements, triés et sans doublon', () => {
    expect(index.departementsOf(territory('epci', '200069193'))._unsafeUnwrap()).toEqual(['01', '69'])
  })

  it('un EPCI dans un seul département couvre ce département', () => {
    expect(index.departementsOf(territory('epci', '246900740'))._unsafeUnwrap()).toEqual(['69'])
  })

  it.each([
    ['region', '99'],
    ['departement', 'ZZ'],
    ['epci', '000000000'],
  ] as const)('refuse le territoire inconnu %s %s', (level, code) => {
    expect(index.communesOf(territory(level, code))._unsafeUnwrapErr()).toEqual({
      kind: 'unknown_territory',
      level,
      code,
    })
  })

  it('refuse l’EPCI inconnu pour ses départements', () => {
    expect(index.departementsOf(territory('epci', '000000000'))._unsafeUnwrapErr()).toEqual({
      kind: 'unknown_territory',
      level: 'epci',
      code: '000000000',
    })
  })

  it('les communes sans EPCI n’apparaissent dans aucun EPCI : 4 communes sur 6 ont un EPCI', () => {
    const everyEpciCommune = ['200069193', '246900740'].flatMap((code) =>
      index.communesOf(territory('epci', code))._unsafeUnwrap(),
    )
    expect(everyEpciCommune.toSorted()).toEqual(['01001', '01002', '69001', '69002'])
  })

  it.each([
    ['01001', '84'],
    ['69002', '84'],
    ['2B033', '94'],
  ])('la commune %s est dans la région %s', (commune, region) => {
    expect(index.regionOf(commune)).toBe(region)
  })

  it('ne donne pas de région à une commune absente de la géographie', () => {
    expect(index.regionOf('99999')).toBeUndefined()
  })

  it('trie les communes par code quel que soit l’ordre d’entrée', () => {
    const shuffled = buildTerritoryIndex(COMMUNES.toReversed())
    expect(shuffled.communesOf(territory('region', '84'))._unsafeUnwrap()).toEqual([
      '01001',
      '01002',
      '69001',
      '69002',
    ])
  })
})
