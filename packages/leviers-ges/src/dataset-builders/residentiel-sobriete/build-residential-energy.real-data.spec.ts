import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sum, toBig } from '../../domain/big-number.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildResidentialEnergy } from './build-residential-energy.ts'
import { readResidentialEnergySources } from './read-residential-energy-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')
const folder = join(dataDirectory, 'residentiel-sobriete')
const dataSource = createCsvDataSource(dataDirectory)

function readCommitted(file: string): string {
  return readFileSync(join(folder, file), 'utf8')
}

function totalOf(rows: readonly Readonly<Record<string, string>>[], column: string): string {
  return sum(rows.map((row) => toBig(row[column] ?? ''))).toFixed()
}

describe('énergie du résidentiel, bilan régional, extraits locaux, ventes et réseaux de chaleur SDES 2024, CEREN 2024', () => {
  it('reconstruit regions, departements et heat-networks à l’identique', async () => {
    const sources = await readResidentialEnergySources(dataDirectory)
    const build = sources.andThen(buildResidentialEnergy)._unsafeUnwrap()
    expect({
      regions: build.regionsCsv === readCommitted('regions.csv'),
      departements: build.departementsCsv === readCommitted('departements.csv'),
      heatNetworks: build.heatNetworksCsv === readCommitted('heat-networks.csv'),
    }).toEqual({ regions: true, departements: true, heatNetworks: true })
  })

  describe('lus par le chargeur CSV, empreintes et totaux de contrôle vérifiés', () => {
    const regions = dataSource.rows('residentiel-sobriete/regions')._unsafeUnwrap()
    const departements = dataSource.rows('residentiel-sobriete/departements')._unsafeUnwrap()
    const heatNetworks = dataSource.rows('residentiel-sobriete/heat-networks')._unsafeUnwrap()

    it('compte 13 régions, 96 départements et 852 réseaux hors secret', () => {
      expect({
        regions: regions.length,
        departements: departements.length,
        heatNetworks: heatNetworks.length,
      }).toEqual({ regions: 13, departements: 96, heatNetworks: 852 })
    })

    it('les 13 régions somment le total France métropolitaine du bilan SDES', () => {
      const petroleumProductsGwh = toBig(totalOf(regions, 'fuel_oil_gwh')).plus(
        toBig(totalOf(regions, 'lpg_gwh')),
      )
      expect({
        electricity: toBig(totalOf(regions, 'electricity_gwh')).decimalPlaces(2).toFixed(),
        naturalGas: toBig(totalOf(regions, 'natural_gas_gwh')).decimalPlaces(2).toFixed(),
        petroleumProducts: petroleumProductsGwh.decimalPlaces(2).toFixed(),
        heat: toBig(totalOf(regions, 'heat_gwh')).decimalPlaces(2).toFixed(),
      }).toEqual({
        electricity: '147777.76',
        naturalGas: '100237.25',
        petroleumProducts: '38376.95',
        heat: '14708.66',
      })
    })

    it('le fioul et le GPL se répartissent à 80 % et 20 % des produits pétroliers de chaque région', () => {
      const brittany = regions.find((row) => row['code_region'] === '53')
      expect({
        fuelOil: toBig(brittany?.['fuel_oil_gwh'] ?? '').decimalPlaces(3).toFixed(),
        lpg: toBig(brittany?.['lpg_gwh'] ?? '').decimalPlaces(3).toFixed(),
      }).toEqual({ fuelOil: '2110.566', lpg: '527.641' })
    })

    it('la somme des départements retrouve le fioul et le GPL des régions', () => {
      const regionalFuelOilMwh = toBig(totalOf(regions, 'fuel_oil_gwh')).times(1000)
      const regionalLpgMwh = toBig(totalOf(regions, 'lpg_gwh')).times(1000)
      expect({
        fuelOil: toBig(totalOf(departements, 'fuel_oil_mwh')).minus(regionalFuelOilMwh).abs().isLessThan('0.001'),
        lpg: toBig(totalOf(departements, 'lpg_mwh')).minus(regionalLpgMwh).abs().isLessThan('0.001'),
      }).toEqual({ fuelOil: true, lpg: true })
    })

    it('les départements de métropole somment l’électricité et le gaz IRIS résidentiels sans les DROM', () => {
      expect({
        electricityMwh: totalOf(departements, 'electricity_mwh'),
        naturalGasMwh: totalOf(departements, 'natural_gas_mwh'),
      }).toEqual({ electricityMwh: '152941795.664', naturalGasMwh: '101713707.057' })
    })

    it('la Corse et la Lozère n’ont pas de gaz, la Corse est lue sous les codes 2A et 2B', () => {
      const withoutGas = departements.filter((row) => ['2A', '2B', '48'].includes(row['code_departement'] ?? ''))
      expect(withoutGas.map((row) => [row['code_departement'], row['natural_gas_mwh']])).toEqual([
        ['2A', '0'],
        ['2B', '0'],
        ['48', '0'],
      ])
    })

    it('les réseaux livrent 13 738 204,98 MWh au résidentiel, hors secret statistique', () => {
      expect(toBig(totalOf(heatNetworks, 'delivered_mwh')).decimalPlaces(2).toFixed()).toBe(
        '13738204.98',
      )
    })

    it('les deux réseaux de Paris sont rapportés à la commune 75056, sans arrondissement', () => {
      const parisCommunes = heatNetworks.map((row) => row['commune_code'] ?? '')
      expect({
        paris: parisCommunes.filter((commune) => commune === '75056').length,
        districts: parisCommunes.filter((commune) => commune.startsWith('751')).length,
      }).toEqual({ paris: 2, districts: 0 })
    })
  })
})
