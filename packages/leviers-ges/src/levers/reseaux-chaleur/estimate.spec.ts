import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { EstimationError } from '../../application/estimate/estimation-error.ts'
import type { DataRow, DataSource } from '../../domain/data-source.ts'
import type { Level } from '../../domain/territory.ts'
import { dataSourceFromDatasets } from '../../testing/data-source-from-datasets.ts'
import { estimate as estimateReseauxChaleur } from './estimate.ts'
import {
  reseauxChaleurRequestSchema,
  type ReseauxChaleurRequest,
} from './reseaux-chaleur-request.ts'

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '69001', code_epci: '200000002', code_departement: '69', code_region: '84' },
  { code_commune: '75056', code_epci: '', code_departement: '75', code_region: '11' },
]

function network(commune: string, deliveredMwh: string, factor: string): DataRow {
  return {
    network_id: `${commune}-${deliveredMwh}`,
    commune_code: commune,
    delivered_mwh: deliveredMwh,
    emission_factor_kg_per_kwh: factor,
    emission_factor_source: 'fcu',
  }
}

const NETWORKS: readonly DataRow[] = [
  network('01001', '1000', '0.1'),
  network('01002', '2000', '0.05'),
  network('69001', '500', '0.2'),
  network('75056', '100', '0.3'),
  network('75112', '3783313', '0.1'),
]

type Estimator = (request: ReseauxChaleurRequest) => Result<EstimateResult, EstimationError>

function createEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (reseauxChaleurRequest) => estimateReseauxChaleur(reseauxChaleurRequest, context)
}

function request(level: Level, code: string, fraction = '1'): ReseauxChaleurRequest {
  return reseauxChaleurRequestSchema.parse({
    id: 'reseaux_chaleur',
    territory: { level, code },
    parameters: { emissionFactorReductionFraction: fraction },
  })
}

const estimate = createEstimator(
  dataSourceFromDatasets({ 'territoires/communes': COMMUNES, 'reseaux-chaleur/networks': NETWORKS }),
)

describe('estimate, reseaux_chaleur', () => {
  it.each([
    ['la région 84, à 100 %', request('region', '84'), '300'],
    ['la région 84, à 50 %', request('region', '84', '0.5'), '150'],
    ['la région 84, à 0 %', request('region', '84', '0'), '0'],
    ['la région 11', request('region', '11'), '30'],
    ['le département 01', request('departement', '01'), '200'],
    ['le département 69', request('departement', '69'), '100'],
    ['l’EPCI 200000001', request('epci', '200000001'), '200'],
    ['l’EPCI 200000002', request('epci', '200000002'), '100'],
  ])('évite pour %s : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('ignore un réseau dont la commune est absente de la géographie', () => {
    const paris = estimate(request('departement', '75'))._unsafeUnwrap().reduction.toFixed()
    expect(paris).toBe('30')
  })

  it('ignore une ligne illisible située hors du territoire demandé', () => {
    const partlyBroken = createEstimator(
      dataSourceFromDatasets({
        'territoires/communes': COMMUNES,
        'reseaux-chaleur/networks': [network('01001', '1000', '0.1'), network('75056', 'beaucoup', '0.3')],
      }),
    )
    expect(partlyBroken(request('region', '84'))._unsafeUnwrap().reduction.toFixed()).toBe('100')
  })

  it('refuse un territoire inconnu', () => {
    expect(estimate(request('region', '99'))._unsafeUnwrapErr()).toEqual({
      kind: 'unknown_territory',
      level: 'region',
      code: '99',
    })
  })

  it('refuse une valeur de livraison qui n’est pas un nombre', () => {
    const broken = createEstimator(
      dataSourceFromDatasets({
        'territoires/communes': COMMUNES,
        'reseaux-chaleur/networks': [network('01001', 'beaucoup', '0.1')],
      }),
    )
    expect(broken(request('region', '84'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'reseaux-chaleur/networks',
      reason: 'unreadable',
      detail: 'delivered_mwh=beaucoup is not a decimal number',
    })
  })

  it('refuse un réseau auquel il manque une colonne', () => {
    const broken = createEstimator(
      dataSourceFromDatasets({
        'territoires/communes': COMMUNES,
        'reseaux-chaleur/networks': [{ network_id: 'x', commune_code: '01001' }],
      }),
    )
    expect(broken(request('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'delivered_mwh',
    })
  })

  it('renvoie l’erreur de la source quand le jeu des réseaux est absent', () => {
    const broken = createEstimator(dataSourceFromDatasets({ 'territoires/communes': COMMUNES }))
    expect(broken(request('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'reseaux-chaleur/networks',
    })
  })

  it('renvoie l’erreur de la source quand les communes sont absentes', () => {
    const broken = createEstimator(dataSourceFromDatasets({ 'reseaux-chaleur/networks': NETWORKS }))
    expect(broken(request('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'territoires/communes',
    })
  })

  it('charge l’index des territoires une seule fois pour plusieurs estimations', () => {
    const loads: string[] = []
    const base = dataSourceFromDatasets({
      'territoires/communes': COMMUNES,
      'reseaux-chaleur/networks': NETWORKS,
    })
    const counting: DataSource = {
      ...base,
      rows: (dataset) => {
        loads.push(dataset)
        return base.rows(dataset)
      },
    }
    const counted = createEstimator(counting)
    counted(request('region', '84'))._unsafeUnwrap()
    counted(request('region', '11'))._unsafeUnwrap()
    expect(loads.filter((dataset) => dataset === 'territoires/communes')).toHaveLength(1)
  })
})
