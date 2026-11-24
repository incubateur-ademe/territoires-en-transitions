import { describe, expect, it } from 'vitest'
import { buildEpciConsumption } from './build-epci-consumption.ts'

const HEADER = 'operateur,code_epci,conso_mwh,points_livraison'

function extract(...lines: readonly string[]): string {
  return `${[HEADER, ...lines].join('\n')}\n`
}

const ELECTRICITY_CSV = extract(
  'Enedis,200000002,10.5,3',
  'Enedis,200000001,100,4',
  'Régie,200000001,0.25,1',
  'Enedis,200000003,secret,2',
)

const GAS_CSV = extract('GRDF,200000001,40,2', 'GRDF,200000004,1e1,1', 'Régie,200000004,secret,1')

describe('buildEpciConsumption', () => {
  const built = buildEpciConsumption({
    epciElectricityCsv: ELECTRICITY_CSV,
    epciGasCsv: GAS_CSV,
  })._unsafeUnwrap()

  it('somme les opérateurs de chaque EPCI, triés par code', () => {
    expect(built.csv).toBe(
      [
        'code_epci,electricity_mwh,natural_gas_mwh',
        '200000001,100.25,40',
        '200000002,10.5,0',
        '200000003,0,0',
        '200000004,0,10',
        '',
      ].join('\n'),
    )
  })

  it('compte les EPCI, les lignes sous secret et totalise les MWh', () => {
    expect({
      epciCount: built.epciCount,
      electricityMwh: built.electricityMwh,
      naturalGasMwh: built.naturalGasMwh,
      secretElectricityLineCount: built.secretElectricityLineCount,
      secretGasLineCount: built.secretGasLineCount,
    }).toEqual({
      epciCount: 4,
      electricityMwh: '110.75',
      naturalGasMwh: '50',
      secretElectricityLineCount: 1,
      secretGasLineCount: 1,
    })
  })

  it('refuse une consommation qui n’est pas un nombre décimal', () => {
    expect(
      buildEpciConsumption({
        epciElectricityCsv: extract('Enedis,200000001,abc,1'),
        epciGasCsv: GAS_CSV,
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'residentiel-sobriete/sources/sdes-electricite-epci-2024-residentiel.csv',
      reason: 'unreadable',
      detail: 'conso_mwh=abc is not a decimal number',
    })
  })

  it('refuse un extrait de gaz sans colonne de consommation', () => {
    expect(
      buildEpciConsumption({
        epciElectricityCsv: ELECTRICITY_CSV,
        epciGasCsv: 'operateur,code_epci\nGRDF,200000001\n',
      })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'residentiel-sobriete/sources/sdes-gaz-epci-2024-residentiel.csv',
      reason: 'columns_mismatch',
      detail: 'conso_mwh',
    })
  })

  it('refuse d’écrire un code EPCI qui exigerait un guillemet CSV', () => {
    expect(
      buildEpciConsumption({
        epciElectricityCsv: extract('Enedis,"20,1",1,1'),
        epciGasCsv: GAS_CSV,
      })._unsafeUnwrapErr(),
    ).toMatchObject({ dataset: 'residentiel-sobriete/epcis.csv', reason: 'malformed_csv' })
  })
})
