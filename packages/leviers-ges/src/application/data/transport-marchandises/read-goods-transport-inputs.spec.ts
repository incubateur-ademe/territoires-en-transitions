import { describe, expect, it } from 'vitest'
import type { DataRow } from '../../../domain/data-source.ts'
import { territoryCodeSchema } from '../../../domain/territory.ts'
import { createTemporaryCsvDataSource } from '../../../testing/temporary-csv-data-source.ts'
import { getGoodsTransport } from './get-goods-transport.ts'

const REGION_ROW: DataRow = {
  code_region: '84',
  billion_tonne_kilometres: '31.26297',
  heavy_vehicle_fleet: '1000',
  zero_emission_heavy_vehicle_fleet: '10',
  diesel_emission_factor_g_per_vehicle_km: '810',
  diesel_unclassified_share: '0.09',
}

function dataSourceOf(row: DataRow) {
  return createTemporaryCsvDataSource({
    'transport-marchandises/regions': { keyColumn: 'code_region', level: 'region', rows: [row] },
  })
}

function territory(code: string) {
  return { level: 'region' as const, code: territoryCodeSchema.parse(code) }
}

describe('getGoodsTransport', () => {
  it('convertit les milliards de t.km et les grammes, et calcule les facteurs', () => {
    const { inputs, emissionFactors } = getGoodsTransport({
      dataSource: dataSourceOf(REGION_ROW),
      territory: territory('84'),
    })._unsafeUnwrap()
    expect({
      tonneKilometres: inputs.tonneKilometres.toFixed(),
      diesel: inputs.dieselEmissionFactor.toFixed(),
      unclassified: inputs.dieselUnclassifiedShare.toFixed(),
      thermal: emissionFactors.thermal.toFixed(),
      share: emissionFactors.zeroEmissionShare.toFixed(),
    }).toEqual({
      tonneKilometres: '31262970000',
      diesel: '0.81',
      unclassified: '0.09',
      thermal: '0.1',
      share: '0.01',
    })
  })

  it('refuse une région absente du jeu', () => {
    expect(
      getGoodsTransport({ dataSource: dataSourceOf(REGION_ROW), territory: territory('11') })._unsafeUnwrapErr(),
    ).toEqual({ kind: 'missing_data', dataset: 'transport-marchandises/regions', key: '11' })
  })

  it('refuse une colonne qui n’est pas un nombre', () => {
    expect(
      getGoodsTransport({
        dataSource: dataSourceOf({ ...REGION_ROW, heavy_vehicle_fleet: 'beaucoup' }),
        territory: territory('84'),
      })._unsafeUnwrapErr(),
    ).toMatchObject({ kind: 'invalid_dataset', reason: 'unreadable' })
  })
})
