import type { Result } from 'neverthrow'
import { describe, expect, expectTypeOf, it } from 'vitest'
import type { z } from 'zod'
import type { EstimationError } from '../application/estimate/estimation-error.ts'
import type { TonnesCo2ePerYear } from '../domain/units.ts'
import { dataSourceFromDatasets } from '../testing/data-source-from-datasets.ts'
import { createTemporaryCsvDataSource } from '../testing/temporary-csv-data-source.ts'
import { createEstimator, type Estimate, type RequestInput } from './estimate.ts'
import type { requestSchema } from './parse-request.ts'

type HaiesRequestInput = Extract<RequestInput, { id: 'haies' }>
type PratiquesStockantesRequestInput = Extract<RequestInput, { id: 'pratiques_stockantes' }>

const estimate = createEstimator(dataSourceFromDatasets({}))

function haiesRequest(hedgeKmCreatedPerYear: string | number): HaiesRequestInput {
  return {
    id: 'haies',
    parameters: { hedgeKmCreatedPerYear },
  }
}

function pratiquesStockantesRequest(
  overrides: Partial<PratiquesStockantesRequestInput['parameters']> = {},
): PratiquesStockantesRequestInput {
  return {
    id: 'pratiques_stockantes',
    parameters: {
      intermediateCropsHectares: '0',
      permanentVineyardGrassingHectares: '0',
      winterIntercropVineyardHectares: '0',
      agroforestryHectares: '0',
      temporaryGrasslandExtensionHectares: '0',
      ...overrides,
    },
  }
}

describe('estimate', () => {
  describe('pratiques_stockantes', () => {
    it.each([
      [{}, '0'],
      [{ intermediateCropsHectares: '1000', agroforestryHectares: 200 }, '1568.6'],
      [
        {
          intermediateCropsHectares: '1',
          permanentVineyardGrassingHectares: '1',
          winterIntercropVineyardHectares: '1',
          agroforestryHectares: '1',
          temporaryGrasslandExtensionHectares: '1',
        },
        '8.36',
      ],
    ])('%j hectares donnent %s tCO2e par an', (parameters, expected) => {
      const estimation = estimate(pratiquesStockantesRequest(parameters))._unsafeUnwrap()
      expect(estimation.reduction.toFixed()).toBe(expected)
    })

    it('annonce l’absence de borne sur les surfaces', () => {
      const assumptions = estimate(pratiquesStockantesRequest())._unsafeUnwrap().appliedAssumptions
      expect(Object.keys(assumptions)).toEqual(['applicationSurfaceBounds'])
    })

    it('refuse une surface négative', () => {
      const result = estimate(pratiquesStockantesRequest({ agroforestryHectares: '-1' }))
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.agroforestryHectares', message: 'must not be negative' }],
      })
    })

    it('refuse un texte qui n’est pas un nombre d’hectares', () => {
      const result = estimate(pratiquesStockantesRequest({ intermediateCropsHectares: 'abc' }))
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.intermediateCropsHectares', message: 'must be a decimal number' }],
      })
    })

    it('refuse un territoire, que son résultat n’utilise pas', () => {
      const result = estimate({
        ...pratiquesStockantesRequest(),
        territory: { level: 'region', code: '53' },
      } as unknown as RequestInput)
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'territory', message: 'Unrecognized key: "territory"' }],
      })
    })
  })

  describe('haies', () => {
    it.each([
      ['1', '1.17'],
      [1, '1.17'],
      ['0', '0'],
      ['-2', '-2.34'],
      ['0.005', '0.01'],
      ['1000000', '1170000'],
      [1e21, '1170000000000000000000'],
      [5e-7, '0'],
    ])('%j km créés par an donnent %s tCO2e par an', (kilometres, expected) => {
      const estimation = estimate(haiesRequest(kilometres))._unsafeUnwrap()
      expect(estimation.reduction.toFixed()).toBe(expected)
    })

    it('admet des kilomètres négatifs : un arrachage net donne une réduction négative', () => {
      const estimation = estimate(haiesRequest('-10'))._unsafeUnwrap()
      expect(estimation.reduction.toFixed()).toBe('-11.7')
    })

    it('n’annonce aucune hypothèse appliquée', () => {
      expect(estimate(haiesRequest('1'))._unsafeUnwrap().appliedAssumptions).toEqual({})
    })

    it('annonce la limite des rabais régionaux absents', () => {
      expect(estimate(haiesRequest('1'))._unsafeUnwrap().limits).toEqual([
        {
          limit: 'Rabais régionaux absents',
          effect:
            'hors Grand-Ouest, le stockage est surestimé (rabais de 5 à 50 %, plus 10 % de risque de non-permanence)',
        },
      ])
    })

    it('n’annonce aucun jeu de données : le calcul n’en lit pas', () => {
      expect(estimate(haiesRequest('1'))._unsafeUnwrap().datasets).toEqual([])
    })

    it('annonce le statut du levier : sans question ouverte', () => {
      expect(estimate(haiesRequest('1'))._unsafeUnwrap().status).toBe('no_open_question')
    })

    it('refuse un territoire, que son résultat n’utilise pas', () => {
      const result = estimate({
        id: 'haies',
        territory: { level: 'region', code: '53' },
        parameters: { hedgeKmCreatedPerYear: '1' },
      } as unknown as RequestInput)
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'territory', message: 'Unrecognized key: "territory"' }],
      })
    })
  })

  describe('reseaux_chaleur', () => {
    const withNetworks = createEstimator(
      dataSourceFromDatasets({
        'territoires/communes': [
          { code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' },
        ],
        'reseaux-chaleur/networks': [
          {
            network_id: 'A',
            commune_code: '01001',
            delivered_mwh: '100',
            emission_factor_kg_per_kwh: '0.1',
            emission_factor_source: 'fcu',
          },
        ],
      }),
    )

    function reseauxChaleurRequest({
      code = '84',
      fraction = '0.5',
    }: {
      code?: string
      fraction?: string | number
    }): RequestInput {
      return {
        id: 'reseaux_chaleur',
        territory: { level: 'region', code },
        parameters: { emissionFactorReductionFraction: fraction },
      }
    }

    it('aiguille la requête vers son levier avec la source de données', () => {
      const result = withNetworks(reseauxChaleurRequest({}))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('5')
    })

    it('annonce les jeux lus, sans le référentiel des communes', () => {
      const result = withNetworks(reseauxChaleurRequest({}))
      expect(result._unsafeUnwrap().datasets).toEqual([
        {
          dataset: 'reseaux-chaleur/networks',
          source: 'Jeu de test',
          vintage: '2024',
          retrievedOn: '2026-10-08',
        },
      ])
    })

    it('annonce les mêmes jeux à la deuxième requête, malgré le référentiel en cache', () => {
      withNetworks(reseauxChaleurRequest({}))
      const second = withNetworks(reseauxChaleurRequest({}))
      expect(second._unsafeUnwrap().datasets.map(({ dataset }) => dataset)).toEqual([
        'reseaux-chaleur/networks',
      ])
    })

    it('accepte une fraction en nombre', () => {
      const result = withNetworks(reseauxChaleurRequest({ fraction: 0.5 }))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('5')
    })

    it('accepte un code de territoire entouré d’espaces', () => {
      const result = withNetworks(reseauxChaleurRequest({ code: ' 84 ', fraction: '1' }))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('10')
    })

    it.each(['-0.1', '1.01', '100'])('refuse la fraction %s hors de 0 à 1', (fraction) => {
      expect(estimate(reseauxChaleurRequest({ fraction }))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [
          {
            parameter: 'parameters.emissionFactorReductionFraction',
            message: 'must be between 0 and 1',
          },
        ],
      })
    })

    it.each([null, 'abc'])('refuse la fraction %j qui n’est pas un nombre', (fraction) => {
      const request = reseauxChaleurRequest({ fraction: fraction as unknown as string })
      expect(estimate(request)._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.emissionFactorReductionFraction' }],
      })
    })

    it('refuse un niveau de territoire inconnu et un code vide', () => {
      const request = {
        ...reseauxChaleurRequest({}),
        territory: { level: 'commune', code: '' },
      } as unknown as RequestInput
      expect(estimate(request)._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [
          { parameter: 'territory.level', message: expect.stringContaining('Invalid') as string },
          { parameter: 'territory.code', message: 'must not be empty' },
        ],
      })
    })

    it('refuse un code de territoire fait seulement d’espaces', () => {
      expect(estimate(reseauxChaleurRequest({ code: '  ' }))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'territory.code', message: 'must not be empty' }],
      })
    })
  })

  describe('batiments_machines_agricoles', () => {
    const withEnergy = createEstimator(
      dataSourceFromDatasets({
        'territoires/communes': [
          { code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' },
        ],
        'batiments-machines-agricoles/regions': [
          {
            code_region: '84',
            electricity_gwh: '0',
            natural_gas_gwh: '0',
            petroleum_products_gwh: '1',
            heat_gwh: '0',
          },
        ],
        'surface-agricole-utile/communes': [{ code_commune: '01001', agricultural_area_ha: '10' }],
        'reseaux-chaleur/networks': [],
      }),
    )

    it('aiguille la requête vers son levier avec le contexte d’estimation', () => {
      const result = withEnergy({
        id: 'batiments_machines_agricoles',
        territory: { level: 'region', code: '84' },
        parameters: {
          electricityReductionFraction: '0',
          naturalGasReductionFraction: '0',
          petroleumProductsReductionFraction: '1',
          heatReductionFraction: '0',
        },
      })
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('268.27')
    })

    function batimentsMachinesAgricolesRequest(parameters: object): RequestInput {
      return {
        id: 'batiments_machines_agricoles',
        territory: { level: 'region', code: '84' },
        parameters: {
          electricityReductionFraction: '1',
          naturalGasReductionFraction: '1',
          petroleumProductsReductionFraction: '1',
          heatReductionFraction: '1',
          ...parameters,
        },
      }
    }

    it('accepte une fraction en nombre', () => {
      const request = batimentsMachinesAgricolesRequest({
        electricityReductionFraction: '0',
        naturalGasReductionFraction: '0',
        petroleumProductsReductionFraction: 0.5,
        heatReductionFraction: '0',
      })
      expect(withEnergy(request)._unsafeUnwrap().reduction.toFixed()).toBe('134.14')
    })

    it.each([
      ['electricityReductionFraction'],
      ['naturalGasReductionFraction'],
      ['petroleumProductsReductionFraction'],
      ['heatReductionFraction'],
    ] as const)('refuse %s hors de 0 à 1', (parameter) => {
      const request = batimentsMachinesAgricolesRequest({ [parameter]: '1.01' })
      expect(estimate(request)._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: `parameters.${parameter}`, message: 'must be between 0 and 1' }],
      })
    })

    it('refuse une requête à laquelle il manque un vecteur', () => {
      const request = batimentsMachinesAgricolesRequest({ heatReductionFraction: undefined })
      expect(estimate(request)._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.heatReductionFraction' }],
      })
    })

    it('refuse un paramètre inconnu', () => {
      const request = batimentsMachinesAgricolesRequest({ wood: '1' })
      expect(estimate(request)._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.wood' }],
      })
    })
  })

  describe('produits_bois', () => {
    const withWood = createEstimator(
      createTemporaryCsvDataSource({
        'produits-bois/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [{ code_region: '84', logs_thousand_m3: '400', industrial_wood_thousand_m3: '100' }],
        },
        'produits-bois/constants': {
          keyColumn: 'name',
          rows: [
            { name: 'national_logs_thousand_m3', value: '1000' },
            { name: 'national_industrial_wood_thousand_m3', value: '500' },
            { name: 'timber_products_carbon_tc', value: '1000' },
            { name: 'industrial_products_carbon_tc', value: '2000' },
          ],
        },
      }),
    )

    function produitsBoisRequest({
      level = 'region',
      increase = '0.12',
    }: {
      level?: string
      increase?: string | number
    }): RequestInput {
      return {
        id: 'produits_bois',
        territory: { level, code: '84' },
        parameters: { woodProductionIncrease: increase },
      } as RequestInput
    }

    it('aiguille l’EPCI vers son levier, qui lit les surfaces de forêt', () => {
      expect(withWood(produitsBoisRequest({ level: 'epci' }))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'produits-bois/foret-epci-departement',
        reason: 'unknown_dataset',
        detail: 'foret-epci-departement.csv',
      })
    })

    it('aiguille la région vers son levier : 40 % des grumes et 20 % du bois d’industrie à +12 %', () => {
      expect(withWood(produitsBoisRequest({}))._unsafeUnwrap().reduction.toFixed()).toBe('352')
    })

    it.each([
      [0.5, '1466.67'],
      ['2', '5866.67'],
      ['-0.3', '-880'],
    ])('accepte la hausse %j, sans borne : %s tCO2e', (increase, expected) => {
      const result = withWood(produitsBoisRequest({ increase }))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe(expected)
    })

    it('refuse une hausse qui n’est pas un nombre', () => {
      expect(withWood(produitsBoisRequest({ increase: 'beaucoup' }))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.woodProductionIncrease', message: 'must be a decimal number' }],
      })
    })
  })

  describe('statut du niveau', () => {
    it('annonce un contournement pour pratiques_stockantes, sans territoire', () => {
      expect(estimate(pratiquesStockantesRequest())._unsafeUnwrap().status).toBe('workaround')
    })
  })

  describe('residentiel_renovation', () => {
    const withHousing = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'residentiel-sobriete/departements': {
          keyColumn: 'code_departement',
          level: 'departement',
          rows: [
            {
              code_departement: '01',
              electricity_mwh: '0',
              natural_gas_mwh: '1000',
              fuel_oil_mwh: '0',
              lpg_mwh: '0',
            },
          ],
        },
        'residentiel-sobriete/heat-networks': {
          keyColumn: 'network_id',
          rows: [
            {
              network_id: 'A',
              commune_code: '01001',
              delivered_mwh: '1',
              emission_factor_kg_per_kwh: '0',
            },
          ],
        },
        'residentiel-logements/logements-departement': {
          keyColumn: 'code_departement',
          level: 'departement',
          rows: [
            {
              code_departement: '01',
              ...Object.fromEntries(
                ['electricity', 'natural_gas', 'fuel_oil', 'lpg', 'heat_network'].flatMap((fuel) =>
                  ['house', 'private_apartment', 'social_apartment'].flatMap((type) =>
                    ['before_1971', '1971_to_2005', 'after_2005'].map((period): [string, string] => [
                      `housing_m2_${type}_${fuel}_${period}`,
                      fuel === 'natural_gas' && type === 'house' && period === 'before_1971' ? '10' : '0',
                    ]),
                  ),
                ),
              ),
            },
          ],
        },
      }),
    )

    it('aiguille le département vers son levier : 1 000 MWh de gaz, 92,6 % de chauffage et d’ECS, tout éligible, 35 %', () => {
      const result = withHousing({
        id: 'residentiel_renovation',
        territory: { level: 'departement', code: '01' },
        parameters: { renovatedParcFraction: '1' },
      })
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('65.2')
    })

    it('annonce le contournement du niveau', () => {
      const renovation = withHousing({
        id: 'residentiel_renovation',
        territory: { level: 'departement', code: '01' },
        parameters: { renovatedParcFraction: '1' },
      })
      expect(renovation._unsafeUnwrap().status).toBe('workaround')
    })
  })

  describe('residentiel_changement_systeme_chauffage', () => {
    const withResidentialEnergy = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'residentiel-sobriete/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              electricity_gwh: '0',
              natural_gas_gwh: '0',
              fuel_oil_gwh: '1',
              lpg_gwh: '0',
              heat_gwh: '0',
            },
          ],
        },
        'residentiel-sobriete/heat-networks': {
          keyColumn: 'network_id',
          rows: [
            {
              network_id: 'A',
              commune_code: '01001',
              delivered_mwh: '100',
              emission_factor_kg_per_kwh: '0.1',
            },
          ],
        },
      }),
    )

    it('aiguille la région vers son levier : 1 GWh de fioul passe au gaz', () => {
      const result = withResidentialEnergy({
        id: 'residentiel_changement_systeme_chauffage',
        territory: { level: 'region', code: '84' },
        parameters: {
          targetElectricityShareFraction: '0',
          targetNaturalGasShareFraction: '1',
          targetFuelOilShareFraction: '0',
          targetWoodShareFraction: '0',
          targetHeatNetworkShareFraction: '0',
        },
      })
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('100.63')
    })
  })

  describe('residentiel_sobriete', () => {
    const withResidentialEnergy = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'residentiel-sobriete/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              electricity_gwh: '10',
              natural_gas_gwh: '0',
              fuel_oil_gwh: '0',
              lpg_gwh: '0',
              heat_gwh: '0',
            },
          ],
        },
        'residentiel-sobriete/heat-networks': {
          keyColumn: 'network_id',
          rows: [
            {
              network_id: 'A',
              commune_code: '01001',
              delivered_mwh: '100',
              emission_factor_kg_per_kwh: '0.1',
            },
          ],
        },
      }),
    )

    function residentielSobrieteRequest({
      level = 'region',
      consumptionReduction = '1',
    }: {
      level?: string
      consumptionReduction?: string | number
    }): RequestInput {
      return {
        id: 'residentiel_sobriete',
        territory: { level, code: '84' },
        parameters: {
          householdsApplyingSobrietyFraction: '1',
          consumptionReductionFraction: consumptionReduction,
        },
      } as RequestInput
    }

    it('aiguille l’EPCI vers son levier : un EPCI inconnu de la géographie est refusé', () => {
      expect(withResidentialEnergy(residentielSobrieteRequest({ level: 'epci' }))._unsafeUnwrapErr()).toMatchObject({
        kind: 'unknown_territory',
      })
    })

    it('aiguille la région vers son levier : 10 GWh d’électricité à 0,0349806 kgCO2e/kWh', () => {
      const result = withResidentialEnergy(residentielSobrieteRequest({}))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('349.81')
    })

    it('accepte la baisse en nombre', () => {
      const result = withResidentialEnergy(residentielSobrieteRequest({ consumptionReduction: 0.5 }))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('174.9')
    })

    it.each(['-0.1', '1.01'])('refuse la baisse %s hors de 0 à 1', (consumptionReduction) => {
      expect(
        withResidentialEnergy(residentielSobrieteRequest({ consumptionReduction }))._unsafeUnwrapErr(),
      ).toEqual({
        kind: 'invalid_request',
        issues: [
          { parameter: 'parameters.consumptionReductionFraction', message: 'must be between 0 and 1' },
        ],
      })
    })
  })

  describe('transport_personnes_efficacite', () => {
    const withTransport = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'transport-personnes/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              car_weekly_passenger_km: '1000000',
              public_transport_weekly_passenger_km: '0',
              car_emission_factor_kg_per_km: '0.1165',
              bus_emission_factor_kg_per_km: '0.8',
              car_fleet_unclassified_share: '0',
              bus_fleet_unclassified_share: '0',
              car_fleet_classified: '100',
              bus_fleet_classified: '100',
            },
          ],
        },
      }),
    )

    function transportPersonnesEfficaciteRequest({
      passengerIncrease = '0',
    }: {
      passengerIncrease?: string | number
    }): RequestInput {
      return {
        id: 'transport_personnes_efficacite',
        territory: { level: 'region', code: '84' },
        parameters: {
          carEcodrivingApplicationFraction: '1',
          busEcodrivingApplicationFraction: '1',
          carPassengerIncrease: passengerIncrease,
          busPassengerIncrease: '0',
        },
      }
    }

    it('aiguille la région vers son levier : 1 000 000 passagers.km par semaine avec 100 % d’écoconduite', () => {
      const result = withTransport(transportPersonnesEfficaciteRequest({}))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('433.88')
    })

    it('accepte une hausse de passagers supérieure à 100 %, mais pas négative', () => {
      expect(
        withTransport(transportPersonnesEfficaciteRequest({ passengerIncrease: 2 }))._unsafeUnwrap()
          .reduction.toFixed(),
      ).toBe('3037.15')
      expect(
        withTransport(transportPersonnesEfficaciteRequest({ passengerIncrease: '-0.1' }))._unsafeUnwrapErr(),
      ).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.carPassengerIncrease', message: 'must be 0 or more' }],
      })
    })
  })

  describe('transport_personnes_electrification', () => {
    const withTransport = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'transport-personnes/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              car_weekly_passenger_km: '1000',
              public_transport_weekly_passenger_km: '0',
              car_emission_factor_kg_per_km: '0.1165',
              bus_emission_factor_kg_per_km: '0.8',
              car_fleet_unclassified_share: '0',
              bus_fleet_unclassified_share: '0',
              car_fleet_classified: '100',
              bus_fleet_classified: '100',
              car_thermal_emission_factor_kg_per_km: '0.1165',
              bus_thermal_emission_factor_kg_per_km: '0.8',
              car_thermal_fleet_share: '1',
              bus_thermal_fleet_share: '1',
            },
          ],
        },
      }),
    )

    function transportPersonnesElectrificationRequest(carElectrificationFraction: string): RequestInput {
      return {
        id: 'transport_personnes_electrification',
        territory: { level: 'region', code: '84' },
        parameters: { carElectrificationFraction, busElectrificationFraction: '0' },
      }
    }

    it('aiguille la région vers son levier : 1 000 passagers.km par semaine électrifiés évitent 3,84 tCO2e', () => {
      const result = withTransport(transportPersonnesElectrificationRequest('1'))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('3.84')
    })

    it('refuse une part électrifiée hors de 0 à 1', () => {
      expect(withTransport(transportPersonnesElectrificationRequest('1.5'))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [
          { parameter: 'parameters.carElectrificationFraction', message: 'must be between 0 and 1' },
        ],
      })
    })
  })

  describe('transport_personnes_report_modal', () => {
    const withTransport = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'transport-personnes/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              car_weekly_passenger_km: '1000',
              public_transport_weekly_passenger_km: '0',
              car_emission_factor_kg_per_km: '0.1165',
              bus_emission_factor_kg_per_km: '0.8',
              car_fleet_unclassified_share: '0',
              bus_fleet_unclassified_share: '0',
              car_fleet_classified: '100',
              bus_fleet_classified: '100',
              car_thermal_emission_factor_kg_per_km: '0.1165',
              bus_thermal_emission_factor_kg_per_km: '0.8',
              car_thermal_fleet_share: '1',
              bus_thermal_fleet_share: '1',
            },
          ],
        },
      }),
    )

    function transportPersonnesReportModalRequest({
      toPublicTransport,
      toActiveModes,
    }: {
      toPublicTransport: string
      toActiveModes: string
    }): RequestInput {
      return {
        id: 'transport_personnes_report_modal',
        territory: { level: 'region', code: '84' },
        parameters: {
          carToPublicTransportFraction: toPublicTransport,
          carToActiveModesFraction: toActiveModes,
          publicTransportToActiveModesFraction: '0',
        },
      }
    }

    it('aiguille la région vers son levier : 1 000 passagers.km par semaine reportés vers les modes actifs évitent 4,34 tCO2e', () => {
      const result = withTransport(
        transportPersonnesReportModalRequest({ toPublicTransport: '0', toActiveModes: '1' }),
      )
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('4.34')
    })

    it.each(['abc', ''])('refuse le report %j qui n’est pas un nombre, sans lever', (toPublicTransport) => {
      expect(
        withTransport(transportPersonnesReportModalRequest({ toPublicTransport, toActiveModes: '0.1' }))
          ._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.carToPublicTransportFraction' }],
      })
    })

    it('refuse des reports qui dépassent 100 % ensemble', () => {
      expect(
        withTransport(
          transportPersonnesReportModalRequest({ toPublicTransport: '0.7', toActiveModes: '0.4' }),
        )._unsafeUnwrapErr(),
      ).toEqual({
        kind: 'invalid_request',
        issues: [
          {
            parameter: 'parameters.carToActiveModesFraction',
            message: 'must be at most 100% together with carToPublicTransportFraction',
          },
        ],
      })
    })
  })

  describe('transport_personnes_sobriete_deplacements', () => {
    const withTransport = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'transport-personnes/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              car_weekly_passenger_km: '1000',
              public_transport_weekly_passenger_km: '0',
              car_emission_factor_kg_per_km: '0.1165',
              bus_emission_factor_kg_per_km: '0.8',
              car_fleet_unclassified_share: '0',
              bus_fleet_unclassified_share: '0',
              car_fleet_classified: '100',
              bus_fleet_classified: '100',
              car_thermal_emission_factor_kg_per_km: '0.1165',
              bus_thermal_emission_factor_kg_per_km: '0.8',
              car_thermal_fleet_share: '1',
              bus_thermal_fleet_share: '1',
            },
          ],
        },
      }),
    )

    function transportPersonnesSobrieteDeplacementsRequest(
      commutingDistanceReductionFraction: string,
    ): RequestInput {
      return {
        id: 'transport_personnes_sobriete_deplacements',
        territory: { level: 'region', code: '84' },
        parameters: { commutingDistanceReductionFraction },
      }
    }

    it('aiguille la région vers son levier : 1 000 passagers.km par semaine en voiture, tous supprimés, évitent 4,34 tCO2e', () => {
      const result = withTransport(transportPersonnesSobrieteDeplacementsRequest('1'))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('4.34')
    })

    it.each(['abc', '1.5'])('refuse la réduction %j', (reduction) => {
      expect(
        withTransport(transportPersonnesSobrieteDeplacementsRequest(reduction))._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.commutingDistanceReductionFraction' }],
      })
    })
  })

  describe('dechets_mode_de_traitement', () => {
    const withDechets = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'dechets/treatment-flows': {
          keyColumn: 'flow_id',
          rows: [
            {
              flow_id: '01001:20 03 01:storage',
              commune_code: '01001',
              waste_code: '20 03 01',
              treatment_mode: 'storage',
              tonnes_per_year: '100',
            },
          ],
        },
        'dechets/emission-factors': {
          keyColumn: 'waste_code',
          rows: [
            {
              waste_code: '20 03 01',
              storage_emission_factor_kg_per_tonne: '400',
              incineration_emission_factor_kg_per_tonne: '100',
            },
          ],
        },
      }),
    )

    function dechetsModeDeTraitementRequest({
      storageToIncineration,
      storageToMaterialRecovery,
    }: {
      storageToIncineration: string
      storageToMaterialRecovery: string
    }): RequestInput {
      return {
        id: 'dechets_mode_de_traitement',
        territory: { level: 'region', code: '84' },
        parameters: {
          storageToIncinerationFraction: storageToIncineration,
          storageToMaterialRecoveryFraction: storageToMaterialRecovery,
          incinerationToMaterialRecoveryFraction: '0',
        },
      }
    }

    it('aiguille la région vers son levier : 100 t stockées, tout vers l’incinération, évitent 30 tCO2e', () => {
      const result = withDechets(
        dechetsModeDeTraitementRequest({ storageToIncineration: '1', storageToMaterialRecovery: '0' }),
      )
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('30')
    })

    it.each(['abc', '1.5'])('refuse la part %j', (storageToIncineration) => {
      expect(
        withDechets(
          dechetsModeDeTraitementRequest({ storageToIncineration, storageToMaterialRecovery: '0' }),
        )._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.storageToIncinerationFraction' }],
      })
    })

    it('refuse de déplacer plus de 100 % du stockage', () => {
      expect(
        withDechets(
          dechetsModeDeTraitementRequest({
            storageToIncineration: '0.7',
            storageToMaterialRecovery: '0.4',
          }),
        )._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.storageToMaterialRecoveryFraction' }],
      })
    })
  })

  describe('dechets_sobriete', () => {
    const withDechetsSobriete = createEstimator(
      createTemporaryCsvDataSource({
        'territoires/communes': {
          keyColumn: 'code_commune',
          rows: [{ code_commune: '01001', code_epci: '', code_departement: '01', code_region: '84' }],
        },
        'dechets/treatment-flows': {
          keyColumn: 'flow_id',
          rows: [
            {
              flow_id: '01001:20 03 01:storage',
              commune_code: '01001',
              waste_code: '20 03 01',
              treatment_mode: 'storage',
              tonnes_per_year: '100',
            },
          ],
        },
        'dechets/emission-factors': {
          keyColumn: 'waste_code',
          rows: [
            {
              waste_code: '20 03 01',
              storage_emission_factor_kg_per_tonne: '400',
              incineration_emission_factor_kg_per_tonne: '100',
            },
          ],
        },
      }),
    )

    function dechetsSobrieteRequest(storageReductionFraction: string): RequestInput {
      return {
        id: 'dechets_sobriete',
        territory: { level: 'region', code: '84' },
        parameters: { storageReductionFraction, incinerationReductionFraction: '0' },
      }
    }

    it('aiguille la région vers son levier : 100 t stockées, toutes supprimées, évitent 40 tCO2e', () => {
      const result = withDechetsSobriete(dechetsSobrieteRequest('1'))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('40')
    })

    it.each(['abc', '1.5'])('refuse la réduction %j', (reduction) => {
      expect(withDechetsSobriete(dechetsSobrieteRequest(reduction))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.storageReductionFraction' }],
      })
    })
  })

  describe('fertilisation_azotee', () => {
    const withNitrogen = createEstimator(
      createTemporaryCsvDataSource({
        'fertilisation-azotee/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              nitrogen_delivered_tonnes_2022_2023: '1000',
              nitrogen_delivered_tonnes_2023_2024: '1000',
            },
          ],
        },
      }),
    )

    function fertilisationAzoteeRequest(nitrogenReductionFraction: string): RequestInput {
      return {
        id: 'fertilisation_azotee',
        territory: { level: 'region', code: '84' },
        parameters: { nitrogenReductionFraction },
      }
    }

    it('aiguille la région vers son levier : 1 000 t d’azote, toutes supprimées, évitent 5 733 tCO2e', () => {
      const result = withNitrogen(fertilisationAzoteeRequest('1'))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('5733')
    })

    it('aiguille l’EPCI vers son levier, qui lit les communes et les surfaces', () => {
      const result = withNitrogen({
        id: 'fertilisation_azotee',
        territory: { level: 'epci', code: '200000001' },
        parameters: { nitrogenReductionFraction: '0.1' },
      })
      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_dataset',
        reason: 'unknown_dataset',
      })
    })

    it.each(['abc', '1.5'])('refuse la réduction %j', (reduction) => {
      expect(withNitrogen(fertilisationAzoteeRequest(reduction))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.nitrogenReductionFraction' }],
      })
    })
  })

  describe('occupation_des_sols', () => {
    const AREAS = {
      code_epci: '200000001',
      cropland_ha: '100',
      wooded_grassland_ha: '10',
      herbaceous_grassland_ha: '30',
      shrub_grassland_ha: '60',
      artificial_shrub_ha: '40',
      artificial_wooded_ha: '60',
      forest_mixed_ha: '100',
      forest_broadleaf_ha: '300',
      forest_conifer_ha: '600',
      forest_poplar_ha: '0',
    }
    const FACTORS: Record<string, string> = Object.fromEntries([
      ['code_epci', '200000001'],
      ...['wooded', 'herbaceous', 'shrub'].flatMap((grassland) =>
        ['mixed', 'broadleaf', 'conifer', 'poplar'].map((forest): [string, string] => [
          `${grassland}_grassland_to_forest_${forest}`,
          '10',
        ]),
      ),
      ['cropland_to_wetland', '10'],
      ['wooded_grassland_to_wetland', '10'],
      ['herbaceous_grassland_to_wetland', '10'],
      ['shrub_grassland_to_wetland', '10'],
      ['impervious_to_artificial_shrub', '10'],
      ['impervious_to_artificial_wooded', '10'],
    ])
    const withOccupation = createEstimator(
      createTemporaryCsvDataSource({
        'occupation-des-sols/epcis-surfaces': { keyColumn: 'code_epci', level: 'epci', rows: [AREAS] },
        'occupation-des-sols/epcis-facteurs': { keyColumn: 'code_epci', level: 'epci', rows: [FACTORS] },
        'occupation-des-sols/departements-surfaces': {
          keyColumn: 'code_departement',
          level: 'departement',
          rows: [{ ...AREAS, code_departement: '01' }],
        },
        'occupation-des-sols/departements-facteurs': {
          keyColumn: 'code_departement',
          level: 'departement',
          rows: [{ ...FACTORS, code_departement: '01' }],
        },
        'occupation-des-sols/regions-surfaces': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [{ ...AREAS, code_region: '84' }],
        },
        'occupation-des-sols/regions-facteurs': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [{ ...FACTORS, code_region: '84' }],
        },
      }),
    )

    function occupationDesSolsRequest({
      level = 'epci',
      parameters = {},
    }: {
      level?: string
      parameters?: Record<string, string | number>
    }): RequestInput {
      return {
        id: 'occupation_des_sols',
        territory: { level, code: '200000001' },
        parameters: {
          afforestationHectaresPerYear: '2',
          wetlandDevelopmentHectaresPerYear: '3',
          desealingHectaresPerYear: '1',
          horizonYears: '10',
          ...parameters,
        },
      } as RequestInput
    }

    it('aiguille l’EPCI vers son levier : facteurs de 10 partout, (2 × 10 + 3 × 10) × 10 + 1 × 10 = 510 tCO2e', () => {
      expect(withOccupation(occupationDesSolsRequest({}))._unsafeUnwrap().reduction.toFixed()).toBe(
        '510',
      )
    })

    it.each([
      ['region', '84'],
      ['departement', '01'],
    ])('aiguille le niveau %s vers son levier : mêmes facteurs, 510 tCO2e', (level, code) => {
      const input = { ...occupationDesSolsRequest({ level }), territory: { level, code } } as RequestInput
      const result = withOccupation(input)._unsafeUnwrap()
      expect(result.reduction.toFixed()).toBe('510')
      expect(Object.keys(result.appliedAssumptions)).toContain('territoryFactors')
    })

    it.each([
      ['afforestationHectaresPerYear', '-1', 'must not be negative'],
      ['wetlandDevelopmentHectaresPerYear', '-0.5', 'must not be negative'],
      ['desealingHectaresPerYear', '-2', 'must not be negative'],
      ['horizonYears', '0', 'must be greater than 0'],
      ['horizonYears', '-5', 'must be greater than 0'],
    ])('refuse %s à %s', (parameter, value, message) => {
      expect(
        withOccupation(occupationDesSolsRequest({ parameters: { [parameter]: value } }))._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: `parameters.${parameter}`, message }],
      })
    })

    it('exige les quatre paramètres et nomme ceux qui manquent', () => {
      const incomplete = {
        id: 'occupation_des_sols',
        territory: { level: 'epci', code: '200000001' },
        parameters: { afforestationHectaresPerYear: '1' },
      } as RequestInput
      const parameters = withOccupation(incomplete)._unsafeUnwrapErr()
      expect(parameters).toMatchObject({
        kind: 'invalid_request',
        issues: [
          { parameter: 'parameters.wetlandDevelopmentHectaresPerYear' },
          { parameter: 'parameters.desealingHectaresPerYear' },
          { parameter: 'parameters.horizonYears' },
        ],
      })
    })

    it('refuse un paramètre inconnu', () => {
      const extra = occupationDesSolsRequest({ parameters: { unknownParameter: '1' } })
      expect(withOccupation(extra)._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.unknownParameter' }],
      })
    })

    it('accepte des rythmes nuls et un horizon fractionnaire : (0 + 0) × 0,5 + 1 × 10 = 10 tCO2e', () => {
      const zeroRates = occupationDesSolsRequest({
        parameters: {
          afforestationHectaresPerYear: '0',
          wetlandDevelopmentHectaresPerYear: 0,
          horizonYears: '0.5',
        },
      })
      expect(withOccupation(zeroRates)._unsafeUnwrap().reduction.toFixed()).toBe('10')
    })
  })

  describe('elevage_durable', () => {
    const withLivestock = createEstimator(
      createTemporaryCsvDataSource({
        'elevage-durable/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              dairy_cows: '1000',
              other_cattle: '0',
              sows: '0',
              other_pigs: '0',
              goats: '0',
              sheep: '0',
              horses: '0',
              mules_and_donkeys: '0',
              laying_hens: '0',
              broilers: '0',
              other_poultry: '0',
            },
          ],
        },
      }),
    )

    function elevageDurableRequest(headcountReductionFraction: string): RequestInput {
      return {
        id: 'elevage_durable',
        territory: { level: 'region', code: '84' },
        parameters: {
          animals: {
            dairyCows: {
              headcountReductionFraction,
              targetManureShares: { liquid: '0.41', solid: '0.2', pasture: '0.39', anaerobicDigestion: '0' },
            },
          },
        },
      }
    }

    it('aiguille la région vers son levier : 1 000 vaches laitières supprimées évitent 5 008,45 tCO2e', () => {
      const result = withLivestock(elevageDurableRequest('1'))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('5008.45')
    })

    it('refuse un EPCI, niveau non calculé', () => {
      const result = withLivestock({
        ...elevageDurableRequest('1'),
        territory: { level: 'epci', code: '200000001' },
      })
      expect(result._unsafeUnwrapErr()).toMatchObject({ kind: 'level_not_computed' })
    })

    it.each(['abc', '1.5'])('refuse la baisse %j', (reduction) => {
      expect(withLivestock(elevageDurableRequest(reduction))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.animals.dairyCows.headcountReductionFraction' }],
      })
    })
  })

  describe('transport_marchandises_sobriete_logistique', () => {
    const withGoods = createEstimator(
      createTemporaryCsvDataSource({
        'transport-marchandises/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              billion_tonne_kilometres: '30',
              heavy_vehicle_fleet: '1000',
              zero_emission_heavy_vehicle_fleet: '0',
              diesel_emission_factor_g_per_vehicle_km: '810',
              diesel_unclassified_share: '0',
            },
          ],
        },
      }),
    )

    function transportMarchandisesSobrieteLogistiqueRequest(
      roadFreightReductionFraction: string,
      level = 'region',
    ): RequestInput {
      return {
        id: 'transport_marchandises_sobriete_logistique',
        territory: { level, code: '84' },
        parameters: { roadFreightReductionFraction },
      } as RequestInput
    }

    it('aiguille la région vers son levier : 30 milliards de t.km à 0,1 kgCO2e/t.km, tout supprimé, évitent 3 000 000 tCO2e', () => {
      const result = withGoods(transportMarchandisesSobrieteLogistiqueRequest('1'))
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('3000000')
    })

    it.each(['departement', 'epci'])('refuse le niveau %s, non calculé', (level) => {
      expect(
        withGoods(transportMarchandisesSobrieteLogistiqueRequest('1', level))._unsafeUnwrapErr(),
      ).toMatchObject({ kind: 'level_not_computed' })
    })

    it.each(['abc', '1.5'])('refuse la réduction %j', (reduction) => {
      expect(
        withGoods(transportMarchandisesSobrieteLogistiqueRequest(reduction))._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.roadFreightReductionFraction' }],
      })
    })
  })

  describe('transport_marchandises_report_modal', () => {
    const withGoods = createEstimator(
      createTemporaryCsvDataSource({
        'transport-marchandises/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              billion_tonne_kilometres: '0.001',
              heavy_vehicle_fleet: '1000',
              zero_emission_heavy_vehicle_fleet: '0',
              diesel_emission_factor_g_per_vehicle_km: '648',
              diesel_unclassified_share: '0',
            },
          ],
        },
      }),
    )

    function transportMarchandisesReportModalRequest({
      roadToRailFraction,
      roadToWaterwayFraction,
      level = 'region',
    }: {
      roadToRailFraction: string
      roadToWaterwayFraction: string
      level?: string
    }): RequestInput {
      return {
        id: 'transport_marchandises_report_modal',
        territory: { level, code: '84' },
        parameters: { roadToRailFraction, roadToWaterwayFraction },
      } as RequestInput
    }

    it('aiguille la région vers son levier : 1 000 000 t.km, tout ferroviaire, évitent 57,11 tCO2e', () => {
      const result = withGoods(
        transportMarchandisesReportModalRequest({ roadToRailFraction: '1', roadToWaterwayFraction: '0' }),
      )
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('57.11')
    })

    it.each(['departement', 'epci'])('refuse le niveau %s, non calculé', (level) => {
      expect(
        withGoods(
          transportMarchandisesReportModalRequest({
            roadToRailFraction: '1',
            roadToWaterwayFraction: '0',
            level,
          }),
        )._unsafeUnwrapErr(),
      ).toMatchObject({ kind: 'level_not_computed' })
    })

    it('refuse un report total de plus de 100 %', () => {
      expect(
        withGoods(
          transportMarchandisesReportModalRequest({
            roadToRailFraction: '0.7',
            roadToWaterwayFraction: '0.4',
          }),
        )._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.roadToWaterwayFraction' }],
      })
    })

    it.each(['abc', '1.5'])('refuse le report %j', (roadToRailFraction) => {
      expect(
        withGoods(
          transportMarchandisesReportModalRequest({ roadToRailFraction, roadToWaterwayFraction: '0' }),
        )._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.roadToRailFraction' }],
      })
    })
  })

  describe('transport_marchandises_efficacite', () => {
    const withGoods = createEstimator(
      createTemporaryCsvDataSource({
        'transport-marchandises/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              billion_tonne_kilometres: '0.001',
              heavy_vehicle_fleet: '1000',
              zero_emission_heavy_vehicle_fleet: '0',
              diesel_emission_factor_g_per_vehicle_km: '648',
              diesel_unclassified_share: '0',
            },
          ],
        },
      }),
    )

    function transportMarchandisesEfficaciteRequest({
      ecodrivingApplicationFraction,
      loadFactorIncrease,
      level = 'region',
    }: {
      ecodrivingApplicationFraction: string
      loadFactorIncrease: string
      level?: string
    }): RequestInput {
      return {
        id: 'transport_marchandises_efficacite',
        territory: { level, code: '84' },
        parameters: { ecodrivingApplicationFraction, loadFactorIncrease },
      } as RequestInput
    }

    it('aiguille la région vers son levier : 100 % d’écoconduite évitent 8 tCO2e pour 1 000 000 t.km à 0,08', () => {
      const result = withGoods(
        transportMarchandisesEfficaciteRequest({
          ecodrivingApplicationFraction: '1',
          loadFactorIncrease: '0',
        }),
      )
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('8')
    })

    it.each(['departement', 'epci'])('refuse le niveau %s, non calculé', (level) => {
      expect(
        withGoods(
          transportMarchandisesEfficaciteRequest({
            ecodrivingApplicationFraction: '1',
            loadFactorIncrease: '0',
            level,
          }),
        )._unsafeUnwrapErr(),
      ).toMatchObject({ kind: 'level_not_computed' })
    })

    it.each([
      ['ecodrivingApplicationFraction', { ecodrivingApplicationFraction: '1.5', loadFactorIncrease: '0' }],
      ['loadFactorIncrease', { ecodrivingApplicationFraction: '0', loadFactorIncrease: '-1' }],
    ])('refuse le paramètre %s hors bornes', (parameter, parameters) => {
      expect(withGoods(transportMarchandisesEfficaciteRequest(parameters))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: `parameters.${parameter}` }],
      })
    })
  })

  describe('transport_marchandises_electrification', () => {
    const withGoods = createEstimator(
      createTemporaryCsvDataSource({
        'transport-marchandises/regions': {
          keyColumn: 'code_region',
          level: 'region',
          rows: [
            {
              code_region: '84',
              billion_tonne_kilometres: '0.001',
              heavy_vehicle_fleet: '1000',
              zero_emission_heavy_vehicle_fleet: '0',
              diesel_emission_factor_g_per_vehicle_km: '648',
              diesel_unclassified_share: '0',
            },
          ],
        },
      }),
    )

    function transportMarchandisesElectrificationRequest({
      additionalElectrifiedFleetFraction,
      level = 'region',
    }: {
      additionalElectrifiedFleetFraction: string
      level?: string
    }): RequestInput {
      return {
        id: 'transport_marchandises_electrification',
        territory: { level, code: '84' },
        parameters: { additionalElectrifiedFleetFraction },
      } as RequestInput
    }

    it('aiguille la région vers son levier : tout le parc électrifié évite 33,3 tCO2e pour 1 000 000 t.km', () => {
      const result = withGoods(
        transportMarchandisesElectrificationRequest({ additionalElectrifiedFleetFraction: '1' }),
      )
      expect(result._unsafeUnwrap().reduction.toFixed()).toBe('33.3')
    })

    it.each(['departement', 'epci'])('refuse le niveau %s, non calculé', (level) => {
      expect(
        withGoods(
          transportMarchandisesElectrificationRequest({
            additionalElectrifiedFleetFraction: '1',
            level,
          }),
        )._unsafeUnwrapErr(),
      ).toMatchObject({ kind: 'level_not_computed' })
    })

    it.each(['abc', '1.5'])('refuse la part %j', (additionalElectrifiedFleetFraction) => {
      expect(
        withGoods(
          transportMarchandisesElectrificationRequest({ additionalElectrifiedFleetFraction }),
        )._unsafeUnwrapErr(),
      ).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.additionalElectrifiedFleetFraction' }],
      })
    })
  })

  describe('entrée invalide', () => {
    it.each([{ id: 'inconnu' }, { id: 3 }, {}])('refuse l’entrée %j sans levier connu', (input) => {
      const result = estimate(input as unknown as RequestInput)
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'id', message: 'unknown lever' }],
      })
    })

    it('rapporte toutes les erreurs de la requête, dans l’ordre des champs', () => {
      const request = {
        id: 'reseaux_chaleur',
        territory: { level: 'region', code: '' },
        parameters: { emissionFactorReductionFraction: '2', wood: '1' },
      } as unknown as RequestInput
      expect(estimate(request)._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [
          { parameter: 'territory.code', message: 'must not be empty' },
          { parameter: 'parameters.emissionFactorReductionFraction', message: 'must be between 0 and 1' },
          { parameter: 'parameters.wood', message: expect.stringContaining('Unrecognized') as string },
        ],
      })
    })

    it.each(['abc', '1e3', '0x10', 'NaN', ''])(
      'refuse le texte %j comme nombre de kilomètres',
      (kilometres) => {
        expect(estimate(haiesRequest(kilometres))._unsafeUnwrapErr()).toEqual({
          kind: 'invalid_request',
          issues: [
            { parameter: 'parameters.hedgeKmCreatedPerYear', message: 'must be a decimal number' },
          ],
        })
      },
    )

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'refuse le nombre non fini %s',
      (kilometres) => {
        expect(estimate(haiesRequest(kilometres))._unsafeUnwrapErr()).toMatchObject({
          kind: 'invalid_request',
          issues: [{ parameter: 'parameters.hedgeKmCreatedPerYear' }],
        })
      },
    )

    it('refuse un paramètre qui n’appartient pas au levier', () => {
      const result = estimate({
        id: 'haies',
        parameters: { hedgeKmCreatedPerYear: '1', railShift: '0.1' },
      } as unknown as RequestInput)
      expect(result._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_request',
        issues: [{ parameter: 'parameters.railShift' }],
      })
    })

    it.each([null, undefined, [], 'haies', 3])('refuse l’entrée %j qui n’est pas un objet', (input) => {
      const result = estimate(input as unknown as RequestInput)
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_request',
        issues: [{ parameter: 'request', message: 'expected an object' }],
      })
    })
  })

  describe('types', () => {
    it('la réduction est en tonnes de CO2e par an, typée par levier', () => {
      const result = estimate(haiesRequest('1'))
      expectTypeOf(result).toEqualTypeOf<Result<Estimate<'haies'>, EstimationError>>()
      expectTypeOf<Estimate<'haies'>['reduction']>().toEqualTypeOf<TonnesCo2ePerYear>()
    })

    it('les paramètres d’un autre levier ne compilent pas pour haies', () => {
      expectTypeOf<{
        id: 'haies'
        parameters: { railShift: string }
      }>().not.toExtend<RequestInput>()
    })

    it('l’union écrite des entrées est celle des schémas de requête', () => {
      expectTypeOf<z.input<typeof requestSchema>>().toEqualTypeOf<RequestInput>()
    })

    it('un levier absent de l’union ne compile pas', () => {
      expectTypeOf<{
        id: 'levier_inexistant'
        territory: { level: 'region'; code: string }
        parameters: { hedgeKmCreatedPerYear: string }
      }>().not.toExtend<RequestInput>()
    })
  })
})
