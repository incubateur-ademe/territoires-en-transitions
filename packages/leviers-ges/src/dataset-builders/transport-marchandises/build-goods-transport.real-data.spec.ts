import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildGoodsTransport } from './build-goods-transport.ts'
import { readGoodsTransportSources } from './read-goods-transport-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

describe('buildGoodsTransport, sources versionnées SDES et OMINEA 2024', () => {
  const goodsTransport = readGoodsTransportSources(dataDirectory)
    .andThen(buildGoodsTransport)
    ._unsafeUnwrap()

  it('reconstruit regions.csv à l’identique', () => {
    expect(goodsTransport.csv).toBe(
      readFileSync(join(dataDirectory, 'transport-marchandises', 'regions.csv'), 'utf8'),
    )
  })

  it('compte 13 régions, 239,965514 milliards de t.km, 614 131 poids lourds dont 907 zéro émission', () => {
    expect({ regions: goodsTransport.regionCount, totals: goodsTransport.totals }).toEqual({
      regions: 13,
      totals: {
        billion_tonne_kilometres: '239.965514',
        heavy_vehicle_fleet: '614131',
        zero_emission_heavy_vehicle_fleet: '907',
      },
    })
  })

  it('ne laisse aucune région hors de la géographie', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    const regions = new Set(
      dataSource
        .rows('territoires/communes')
        ._unsafeUnwrap()
        .map((row) => row['code_region']),
    )
    const unknown = dataSource
      .rows('transport-marchandises/regions')
      ._unsafeUnwrap()
      .filter((row) => !regions.has(row['code_region']))
    expect(unknown).toEqual([])
  })
})
