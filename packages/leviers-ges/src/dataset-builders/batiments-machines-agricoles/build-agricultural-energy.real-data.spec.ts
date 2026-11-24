import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sum, toBig } from '../../domain/big-number.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildAgriculturalEnergy } from './build-agricultural-energy.ts'
import { readAgriculturalEnergySources } from './read-agricultural-energy-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = join(dataDirectory, 'batiments-machines-agricoles')
const dataSource = createCsvDataSource(dataDirectory)

function readCommitted(file: string): string {
  return readFileSync(join(folder, file), 'utf8')
}

function totalOf(rows: readonly Readonly<Record<string, string>>[], column: string): string {
  return sum(rows.map((row) => toBig(row[column] ?? ''))).toFixed()
}

const WORKBOOK_READING_TIMEOUT_MS = 30_000

describe('énergie de l’agriculture, classeurs régionaux et extraits locaux SDES 2024', { timeout: WORKBOOK_READING_TIMEOUT_MS }, () => {
  it('reconstruit regions, departements et epcis à l’identique', async () => {
    const sources = await readAgriculturalEnergySources(dataDirectory)
    const build = sources.andThen(buildAgriculturalEnergy)._unsafeUnwrap()
    expect({
      regions: build.regionsCsv === readCommitted('regions.csv'),
      departements: build.departementsCsv === readCommitted('departements.csv'),
      epcis: build.epcisCsv === readCommitted('epcis.csv'),
    }).toEqual({ regions: true, departements: true, epcis: true })
  })

  describe('lus par le chargeur CSV, empreintes et totaux de contrôle vérifiés', () => {
    const regions = dataSource.rows('batiments-machines-agricoles/regions')._unsafeUnwrap()
    const departements = dataSource
      .rows('batiments-machines-agricoles/departements')
      ._unsafeUnwrap()
    const epcis = dataSource.rows('batiments-machines-agricoles/epcis')._unsafeUnwrap()

    it('compte 13 régions, 96 départements et 1 232 EPCI de France métropolitaine', () => {
      expect({
        regions: regions.length,
        departements: departements.length,
        epcis: epcis.length,
      }).toEqual({ regions: 13, departements: 96, epcis: 1232 })
    })

    it('les 13 régions somment le total France métropolitaine du SDES', () => {
      expect({
        electricity: toBig(totalOf(regions, 'electricity_gwh')).decimalPlaces(2).toFixed(),
        naturalGas: toBig(totalOf(regions, 'natural_gas_gwh')).decimalPlaces(2).toFixed(),
        petroleumProducts: toBig(totalOf(regions, 'petroleum_products_gwh'))
          .decimalPlaces(2)
          .toFixed(),
        heat: toBig(totalOf(regions, 'heat_gwh')).decimalPlaces(2).toFixed(),
      }).toEqual({
        electricity: '7188.29',
        naturalGas: '1689.54',
        petroleumProducts: '43923.61',
        heat: '343.54',
      })
    })

    it('la Bretagne a 6 649,7 GWh de produits pétroliers, pêche comprise', () => {
      const brittany = regions.find((row) => row['code_region'] === '53')
      expect(toBig(brittany?.['petroleum_products_gwh'] ?? '').decimalPlaces(1).toFixed()).toBe(
        '6649.7',
      )
    })

    it('les départements de métropole somment l’électricité et le gaz IRIS sans les DROM', () => {
      expect({
        electricityMwh: totalOf(departements, 'electricity_mwh'),
        naturalGasMwh: totalOf(departements, 'natural_gas_mwh'),
      }).toEqual({ electricityMwh: '6807853.066', naturalGasMwh: '2002997.1945' })
    })

    it('les EPCI de métropole somment l’électricité et le gaz EPCI sans les DROM', () => {
      expect({
        electricityMwh: totalOf(epcis, 'electricity_mwh'),
        naturalGasMwh: totalOf(epcis, 'natural_gas_mwh'),
      }).toEqual({ electricityMwh: '7121830.495', naturalGasMwh: '2046428.89783' })
    })

    it('Paris regroupe les 87 lignes IRIS de ses arrondissements, absents de la géographie', () => {
      const paris = departements.find((row) => row['code_departement'] === '75')
      expect(paris).toEqual({
        code_departement: '75',
        electricity_mwh: '6989.976',
        natural_gas_mwh: '1713.80206',
      })
    })

    it('la Corse est lue sous les codes 2A et 2B', () => {
      const corsica = departements.filter((row) => ['2A', '2B'].includes(row['code_departement'] ?? ''))
      expect(corsica.map((row) => [row['code_departement'], row['electricity_mwh']])).toEqual([
        ['2A', '5359.085'],
        ['2B', '13107.028'],
      ])
    })
  })
})
