import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import { toBig } from '../../domain/big-number.ts'
import type { Level } from '../../domain/territory.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import {
  batimentsMachinesAgricolesRequestSchema,
  type BatimentsMachinesAgricolesRequest,
  type BatimentsMachinesAgricolesRequestInput,
} from './batiments-machines-agricoles-request.ts'
import { estimate } from './estimate.ts'

type Reductions = BatimentsMachinesAgricolesRequestInput['parameters']

const dataSource = createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data'))
const context = createEstimationContext(dataSource)

const regions = dataSource.rows('batiments-machines-agricoles/regions')._unsafeUnwrap()
const departements = dataSource.rows('batiments-machines-agricoles/departements')._unsafeUnwrap()

const FULL = {
  electricityReductionFraction: '1',
  naturalGasReductionFraction: '1',
  petroleumProductsReductionFraction: '1',
  heatReductionFraction: '1',
}

const PETROLEUM_ONLY = {
  electricityReductionFraction: '0',
  naturalGasReductionFraction: '0',
  petroleumProductsReductionFraction: '1',
  heatReductionFraction: '0',
}

// Source : 74,52 kg CO2/GJ × 0,0036 GJ/kWh = 0,268272 kgCO2e/kWh, soit 0,268272 tCO2e par MWh (OMINEA, gazole des engins agricoles)
const PETROLEUM_PRODUCTS_TONNES_PER_MWH = '0.268272'

const MEGAWATT_HOURS_PER_GIGAWATT_HOUR = '1000'

const SLOW_TEST_TIMEOUT_MS = 60_000

function toRequest({
  level,
  code,
  parameters,
}: {
  level: Level
  code: string
  parameters: Reductions
}): BatimentsMachinesAgricolesRequest {
  return batimentsMachinesAgricolesRequestSchema.parse({
    id: 'batiments_machines_agricoles',
    territory: { level, code },
    parameters,
  })
}

function reduction(target: { level: Level; code: string; parameters: Reductions }): string {
  return estimate(toRequest(target), context)._unsafeUnwrap().reduction.toFixed()
}

describe('estimate batiments_machines_agricoles, énergie SDES 2024 et SAU 2020', { timeout: SLOW_TEST_TIMEOUT_MS }, () => {
  it.each(regions.map((row) => [row['code_region'] ?? '', row['petroleum_products_gwh'] ?? ''] as const))(
    'la région %s évite ses %s GWh de produits pétroliers à 0,268272 tCO2e par MWh',
    (region, gigawattHours) => {
      const expected = toBig(gigawattHours)
        .times(MEGAWATT_HOURS_PER_GIGAWATT_HOUR)
        .times(PETROLEUM_PRODUCTS_TONNES_PER_MWH)
        .decimalPlaces(2)
        .toFixed()
      expect(reduction({ level: 'region', code: region, parameters: PETROLEUM_ONLY })).toBe(expected)
    },
  )

  it(
    'les 96 départements de métropole retrouvent les produits pétroliers des 13 régions, à 0,005 t près par département',
    () => {
      const nationalPetroleum = regions
        .map((row) =>
          toBig(row['petroleum_products_gwh'] ?? '')
            .times(MEGAWATT_HOURS_PER_GIGAWATT_HOUR)
            .times(PETROLEUM_PRODUCTS_TONNES_PER_MWH),
        )
        .reduce((total, tonnes) => total.plus(tonnes), toBig('0'))
      const sumOfDepartements = departements
        .map((row) =>
          reduction({ level: 'departement', code: row['code_departement'] ?? '', parameters: PETROLEUM_ONLY }),
        )
        .reduce((total, tonnes) => total.plus(tonnes), toBig('0'))
      const difference = sumOfDepartements.minus(nationalPetroleum).abs()
      expect(departements).toHaveLength(96)
      expect(difference.isLessThanOrEqualTo(toBig('0.005').times('96'))).toBe(true)
    },
  )

  it.each([
    ['region', '84', '919124.85'],
    ['region', '53', '1918102.2'],
    ['region', '94', '44034.39'],
    ['departement', '01', '78982.65'],
    ['departement', '35', '514448.28'],
    ['departement', '75', '589.57'],
    ['epci', '200054781', '3576.25'],
    ['epci', '200000172', '1130.03'],
  ] as const)('à 100 %% sur les quatre vecteurs, le niveau %s %s évite %s tCO2e', (level, code, expected) => {
    expect(reduction({ level, code, parameters: FULL })).toBe(expected)
  })

  it('toutes les communes de la SAU sont dans la géographie : aucune n’est écartée des parts', () => {
    const geography = new Set(
      dataSource.rows('territoires/communes')._unsafeUnwrap().map((row) => row['code_commune']),
    )
    const absent = dataSource
      .rows('surface-agricole-utile/communes')
      ._unsafeUnwrap()
      .filter((row) => !geography.has(row['code_commune']))
    expect(absent).toHaveLength(0)
  })

  it.each([
    ['region', '01'],
    ['departement', '971'],
  ] as const)('refuse %s %s, outre-mer absent des données énergétiques', (level, code) => {
    const request = toRequest({ level, code, parameters: FULL })
    expect(estimate(request, context)._unsafeUnwrapErr()).toMatchObject({ kind: 'missing_data' })
  })
})
