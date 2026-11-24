import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import { produitsBoisRequestSchema, type ProduitsBoisRequest } from './produits-bois-request.ts'

const dataSource = createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data'))
const context = createEstimationContext(dataSource)

const regions = dataSource.rows('produits-bois/regions')._unsafeUnwrap()
const departements = dataSource.rows('produits-bois/departements')._unsafeUnwrap()
const epciForests = dataSource.rows('produits-bois/foret-epci-departement')._unsafeUnwrap()

function toRequest({
  level,
  code,
  increase,
}: {
  level: ComputedLevels<'produits_bois'>
  code: string
  increase: string
}): ProduitsBoisRequest {
  const parsed = produitsBoisRequestSchema.parse({
    id: 'produits_bois',
    territory: { level, code },
    parameters: { woodProductionIncrease: increase },
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function storageAtFullIncrease(level: ComputedLevels<'produits_bois'>, code: string): string {
  return estimate(toRequest({ level, code, increase: '1' }), context)
    ._unsafeUnwrap()
    .reduction.toFixed()
}

function sumOfStorages(level: ComputedLevels<'produits_bois'>, codes: readonly string[]): string {
  return sum(codes.map((code) => toBig(storageAtFullIncrease(level, code)))).toFixed()
}

describe('estimate produits_bois, récolte Agreste 2022 et produits bois OMINEA 2026', () => {
  it('à +100 %, la France entière stockerait (1 706 703 + 2 234 630) × 44/12 = 14 451 554,33 tCO2e', () => {
    const regionCodes = regions.map((row) => row['code_region'] ?? '')
    const difference = toBig(sumOfStorages('region', regionCodes)).minus('14451554.33').abs()
    expect(regionCodes).toHaveLength(13)
    expect(difference.isLessThanOrEqualTo(toBig('0.005').times('13'))).toBe(true)
  })

  it('à +100 %, les 96 départements stockent 14 450 110,24 tCO2e, 1 444 de moins que la France entière', () => {
    const departementCodes = departements.map((row) => row['code_departement'] ?? '')
    const difference = toBig(sumOfStorages('departement', departementCodes)).minus('14450110.24').abs()
    expect(departementCodes).toHaveLength(96)
    expect(difference.isLessThanOrEqualTo(toBig('0.005').times('96'))).toBe(true)
  })

  it.each([
    ['region', '84', '1790587.59'],
    ['region', '53', '279226.76'],
    ['region', '94', '1566.44'],
    ['departement', '01', '101856.04'],
    ['departement', '35', '54473.07'],
    ['departement', '2A', '1566.44'],
    ['departement', '75', '0'],
    ['epci', '200000172', '2818.43'],
    ['epci', '200046977', '12256.43'],
    ['epci', '200054781', '3430.94'],
  ] as const)('à +100 %%, le niveau %s %s stocke %s tCO2e', (level, code, expected) => {
    expect(storageAtFullIncrease(level, code)).toBe(expected)
  })

  it('à +100 %, les EPCI stockent 14 449 897,70 tCO2e, 212,55 de moins que les départements (forêt des communes sans EPCI)', () => {
    const epciCodes = [...new Set(epciForests.map((row) => row['code_epci'] ?? ''))]
    const difference = toBig(sumOfStorages('epci', epciCodes)).minus('14449897.70').abs()
    expect(epciCodes).toHaveLength(1241)
    expect(difference.isLessThanOrEqualTo(toBig('0.005').times('1241'))).toBe(true)
  })

  it.each([
    ['region', '01'],
    ['departement', '971'],
  ] as const)('refuse %s %s, outre-mer absent de la récolte', (level, code) => {
    const request = toRequest({ level, code, increase: '1' })
    expect(estimate(request, context)._unsafeUnwrapErr()).toMatchObject({ kind: 'missing_data' })
  })
})
