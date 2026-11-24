import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import type { DataRow } from '../../domain/data-source.ts'
import type { Level } from '../../domain/territory.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import { reseauxChaleurRequestSchema } from './reseaux-chaleur-request.ts'

const dataSource = createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data'))
const context = createEstimationContext(dataSource)

const communes = dataSource.rows('territoires/communes')._unsafeUnwrap()
const networks = dataSource.rows('reseaux-chaleur/networks')._unsafeUnwrap()
const communeByCode = new Map(communes.map((row) => [row['code_commune'], row]))

const COLUMN_BY_LEVEL = {
  region: 'code_region',
  departement: 'code_departement',
  epci: 'code_epci',
} as const satisfies Record<Level, string>

function deliveredOf(rows: readonly DataRow[]): string {
  return sum(rows.map((row) => toBig(row['delivered_mwh'] ?? ''))).toFixed()
}

function emissionsOf(rows: readonly DataRow[]): string {
  const emissions = rows.map((row) =>
    toBig(row['delivered_mwh'] ?? '').times(toBig(row['emission_factor_kg_per_kwh'] ?? '')),
  )
  return sum(emissions).toFixed()
}

function networksInGeography(isInside: boolean): DataRow[] {
  return networks.filter((row) => communeByCode.has(row['commune_code']) === isInside)
}

function networksOf(level: Level, code: string): DataRow[] {
  const column = COLUMN_BY_LEVEL[level]
  return networks.filter((row) => communeByCode.get(row['commune_code'])?.[column] === code)
}

function reductionAtFull(level: Level, code: string): string {
  const request = reseauxChaleurRequestSchema.parse({
    id: 'reseaux_chaleur',
    territory: { level, code },
    parameters: { emissionFactorReductionFraction: '1' },
  })
  return estimate(request, context)._unsafeUnwrap().reduction.toFixed()
}

function expectedAtFull(level: Level, code: string): string {
  return toBig(emissionsOf(networksOf(level, code))).decimalPlaces(2).toFixed()
}

function codesOf(level: Level): string[] {
  const column = COLUMN_BY_LEVEL[level]
  const codes = communes.flatMap((row) => {
    const code = row[column]
    return code === undefined || code === '' ? [] : [code]
  })
  return [...new Set(codes)]
}

function sumOfEstimates(level: Level): string {
  return codesOf(level)
    .reduce((total, code) => total.plus(reductionAtFull(level, code)), toBig('0'))
    .toFixed()
}

describe('estimate reseaux_chaleur, réseaux SDES 2024 et géographie au 2026-10-07', () => {
  it('compte 852 réseaux aux livraisons connues, de 27 733 931,728493 MWh', () => {
    expect({ networks: networks.length, mwh: deliveredOf(networks) }).toEqual({
      networks: 852,
      mwh: '27733931.728493',
    })
  })

  it('le facteur moyen pondéré par les livraisons vaut 0,0842 kgCO2e/kWh', () => {
    const weightedFactor = toBig(emissionsOf(networks)).dividedBy(deliveredOf(networks))
    expect(weightedFactor.decimalPlaces(4).toFixed()).toBe('0.0842')
  })

  it('tous les réseaux sont rattachés à une commune connue, sauf 2515C à Goux-les-Usiers, sans émission', () => {
    const outside = networksInGeography(false)
    expect({
      networks: outside.map((row) => [row['network_id'], row['commune_code']]),
      tonnes: emissionsOf(outside),
    }).toEqual({ networks: [['2515C', '25282']], tonnes: '0' })
  })

  it('à 100 %, le national vaut 2 335 479,16 tCO2e sur 851 réseaux', () => {
    const inside = networksInGeography(true)
    expect({ networks: inside.length, tonnes: toBig(emissionsOf(inside)).decimalPlaces(2).toFixed() }).toEqual({
      networks: 851,
      tonnes: '2335479.16',
    })
  })

  it.each([
    ['region', 26],
    ['departement', 109],
    ['epci', 1255],
  ] as const)(
    'la somme des estimations par %s (%i territoires) retrouve le national, à 0,005 t près par territoire',
    (level, count) => {
      const national = emissionsOf(networksInGeography(true))
      const difference = toBig(sumOfEstimates(level)).minus(national).abs()
      expect(codesOf(level)).toHaveLength(count)
      expect(difference.isLessThanOrEqualTo(toBig('0.005').times(String(count)))).toBe(true)
    },
  )

  it.each(['region', 'departement', 'epci'] as const)(
    'chaque territoire de niveau %s donne la somme de ses réseaux, calculée sans l’index des territoires',
    (level) => {
      const mismatches = codesOf(level).flatMap((code) => {
        const actual = reductionAtFull(level, code)
        const expected = expectedAtFull(level, code)
        return actual === expected ? [] : [{ code, actual, expected }]
      })
      expect(mismatches).toEqual([])
    },
  )

  it.each([
    ['region', '84', '249184.94'],
    ['region', '11', '1209445.92'],
    ['region', '94', '0'],
    ['departement', '01', '4600.1'],
    ['departement', '75', '564296.56'],
    ['epci', '200054781', '943808.57'],
  ] as const)('à 100 %%, le niveau %s %s évite %s tCO2e', (level, code, expected) => {
    expect(reductionAtFull(level, code)).toBe(expected)
  })

  it('le réseau 7501C, rattaché à Paris 12e, compte dans Paris : 3 783 313 MWh', () => {
    const paris = networksOf('departement', '75')
    expect({
      network: paris.some((row) => row['network_id'] === '7501C' && row['commune_code'] === '75056'),
      mwh: deliveredOf(paris),
    }).toEqual({ network: true, mwh: '3787199.12' })
  })
})
