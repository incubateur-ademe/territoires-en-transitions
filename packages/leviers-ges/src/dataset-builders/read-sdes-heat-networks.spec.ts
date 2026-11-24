import { describe, expect, it } from 'vitest'
import { readSdesHeatNetworks } from './read-sdes-heat-networks.ts'

const dataset = 'sdes-test'
const header = '"ID";"COMMUNE_CODE";"CONSOR";"CONSOTOT"'

function toCsv(...lines: string[]): string {
  return [header, ...lines].join('\n')
}

describe('readSdesHeatNetworks', () => {
  it('trie les réseaux par identifiant et rattache les arrondissements à leur commune', () => {
    const read = readSdesHeatNetworks({
      csv: toCsv('"B";"75101";"2";"5"', '"A";"01001";"1";"4"'),
      dataset,
      consumptionColumn: 'CONSOR',
    })._unsafeUnwrap()
    expect(read.networks.map(({ networkId, communeCode, deliveredMwh }) => [networkId, communeCode, deliveredMwh])).toEqual([
      ['A', '01001', '1'],
      ['B', '75056', '2'],
    ])
  })

  it('lit la colonne de livraisons demandée', () => {
    const read = readSdesHeatNetworks({
      csv: toCsv('"A";"01001";"1";"4"'),
      dataset,
      consumptionColumn: 'CONSOTOT',
    })._unsafeUnwrap()
    expect(read.networks.map(({ deliveredMwh }) => deliveredMwh)).toEqual(['4'])
  })

  it('écarte et compte les réseaux sous secret statistique', () => {
    const read = readSdesHeatNetworks({
      csv: toCsv('"A";"01001";"secret";"4"', '"B";"01002";"2";"5"'),
      dataset,
      consumptionColumn: 'CONSOR',
    })._unsafeUnwrap()
    expect({ ids: read.networks.map(({ networkId }) => networkId), secrets: read.secretNetworkCount }).toEqual({
      ids: ['B'],
      secrets: 1,
    })
  })

  it('refuse une colonne absente', () => {
    expect(
      readSdesHeatNetworks({
        csv: '"ID";"COMMUNE_CODE"\n"A";"01001"',
        dataset,
        consumptionColumn: 'CONSOR',
      })._unsafeUnwrapErr(),
    ).toMatchObject({ kind: 'invalid_dataset', dataset })
  })
})
