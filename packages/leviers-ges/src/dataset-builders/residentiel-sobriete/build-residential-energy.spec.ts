import { describe, expect, it } from 'vitest'
import {
  buildResidentialEnergy,
  type ResidentialEnergySources,
} from './build-residential-energy.ts'

const BILAN_HEADER =
  'fichier,code,territoire,CR1_residentiel_gwh,CR2_produits_petroliers_gwh_pci,CR3_gaz_gwh_pcs,CR4_gaz_gwh_pci,CR5_electricite_gwh,CR7_enr_dechets_gwh,CR8_chaleur_commercialisee_gwh'
const SALES_HEADER = 'DEPARTEMENT_CODE;REGION_CODE;ANNEE;FOD;GPL'
const IRIS_HEADER = 'code_departement,conso_mwh_hors_secret'
const HEAT_HEADER = 'ID;COMMUNE_CODE;CONSOR;CONTENU_EN_CO2'
const CEREN_ROWS = [
  ['Énergie', 'Usage', undefined, '2024'],
  ['Total Fioul', undefined, undefined, '32'],
  ['Total GPL', undefined, undefined, '8'],
]

const SALES_LINES = ['01;84;2024;1;3', '07;84;2024;3;1', '75;11;2024;5;5', '75;11;2023;999;999'].join(
  '\n',
)

const SOURCES: ResidentialEnergySources = {
  regionalBilanCsv: [
    BILAN_HEADER,
    'f.xlsx,10,Métropole,0,1400,0,300,800,0,50',
    'f.xlsx,11,Île-de-France,0,1000,0,200,300,0,40',
    'f.xlsx,84,Auvergne-Rhône-Alpes,0,400,0,100,500,0,10',
  ].join('\n'),
  cerenRows: CEREN_ROWS,
  irisElectricityCsv: [IRIS_HEADER, '01,10', '07,20', '75,30', '971,99'].join('\n'),
  irisGasCsv: [IRIS_HEADER, '01,1', '75,3'].join('\n'),
  oilSalesCsv: [SALES_HEADER, SALES_LINES].join('\n'),
  heatCsv: [HEAT_HEADER, 'B;01001;100;0.2', 'A;75101;50;0.1', 'S;01002;secret;secret'].join('\n'),
}

describe('buildResidentialEnergy', () => {
  it('répartit les produits pétroliers de chaque région entre fioul et GPL selon le CEREN national', () => {
    const build = buildResidentialEnergy(SOURCES)._unsafeUnwrap()
    expect(build.regionsCsv).toBe(
      [
        'code_region,electricity_gwh,natural_gas_gwh,fuel_oil_gwh,lpg_gwh,heat_gwh',
        '11,300,200,800,200,40',
        '84,500,100,320,80,10',
        '',
      ].join('\n'),
    )
  })

  it('répartit le fioul et le GPL de la région entre ses départements au prorata des ventes', () => {
    const build = buildResidentialEnergy(SOURCES)._unsafeUnwrap()
    expect(build.departementsCsv).toBe(
      [
        'code_departement,electricity_mwh,natural_gas_mwh,fuel_oil_mwh,lpg_mwh',
        '01,10,1,80000,60000',
        '07,20,0,240000,20000',
        '75,30,3,800000,200000',
        '',
      ].join('\n'),
    )
  })

  it('compte pour 0 un département absent de l’extrait de gaz et ignore les départements sans ventes', () => {
    const build = buildResidentialEnergy(SOURCES)._unsafeUnwrap()
    const lines = build.departementsCsv.split('\n')
    expect({ withoutGas: lines.includes('07,20,0,240000,20000'), outsideSales: lines.some((line) => line.startsWith('971')) }).toEqual({
      withoutGas: true,
      outsideSales: false,
    })
  })

  it('joint le jeu des réseaux de chaleur et compte les réseaux sous secret', () => {
    const build = buildResidentialEnergy(SOURCES)._unsafeUnwrap()
    expect({ csv: build.heatNetworksCsv, secret: build.secretNetworkCount }).toEqual({
      csv: [
        'network_id,commune_code,delivered_mwh,emission_factor_kg_per_kwh',
        'A,75056,50,0.1',
        'B,01001,100,0.2',
        '',
      ].join('\n'),
      secret: 1,
    })
  })

  it('totalise chaque colonne de chaque jeu pour le manifeste', () => {
    const build = buildResidentialEnergy(SOURCES)._unsafeUnwrap()
    expect(build.controlTotals).toEqual({
      regions: {
        electricity_gwh: '800',
        natural_gas_gwh: '300',
        fuel_oil_gwh: '1120',
        lpg_gwh: '280',
        heat_gwh: '50',
      },
      departements: {
        electricity_mwh: '60',
        natural_gas_mwh: '4',
        fuel_oil_mwh: '1120000',
        lpg_mwh: '280000',
      },
      heatNetworks: { delivered_mwh: '150' },
    })
  })

  it('compte pour 0 un département absent de l’extrait d’électricité', () => {
    const irisElectricityCsv = [IRIS_HEADER, '01,10'].join('\n')
    const build = buildResidentialEnergy({ ...SOURCES, irisElectricityCsv })._unsafeUnwrap()
    expect(build.departementsCsv.split('\n')).toContain('07,0,0,240000,20000')
  })

  it('refuse un CEREN dont le fioul et le GPL somment 0', () => {
    const cerenRows = [CEREN_ROWS[0] ?? [], ['Total Fioul', undefined, undefined, '0'], ['Total GPL', undefined, undefined, '0']]
    expect(buildResidentialEnergy({ ...SOURCES, cerenRows })._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'residentiel-sobriete/sources/ceren-donnees-energie-residentiel-1990-2024.xlsx',
      reason: 'empty_dataset',
      detail: 'CEREN fuel oil and LPG consumption sum to 0',
    })
  })

  it('refuse un département dont la région n’a pas de bilan', () => {
    const oilSalesCsv = [SALES_HEADER, SALES_LINES, '29;53;2024;1;1'].join('\n')
    expect(buildResidentialEnergy({ ...SOURCES, oilSalesCsv })._unsafeUnwrapErr()).toMatchObject({
      reason: 'missing_key_column',
      detail: 'region 53',
    })
  })

  it.each([
    ['d’électricité', 'irisElectricityCsv'],
    ['de gaz', 'irisGasCsv'],
  ] as const)('refuse un département métropolitain avec une consommation %s mais sans ventes', (_label, source) => {
    const csv = [IRIS_HEADER, '01,10', '33,5'].join('\n')
    expect(buildResidentialEnergy({ ...SOURCES, [source]: csv })._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'residentiel-sobriete/departements.csv',
      reason: 'missing_key_column',
      detail: 'department 33 has consumption but no oil sales',
    })
  })

  it('refuse une région du bilan sans aucune vente de produits pétroliers', () => {
    const oilSalesCsv = [SALES_HEADER, '01;84;2024;1;3'].join('\n')
    const irisCsv = [IRIS_HEADER, '01,10'].join('\n')
    const sources = {
      ...SOURCES,
      oilSalesCsv,
      irisElectricityCsv: irisCsv,
      irisGasCsv: irisCsv,
    }
    expect(buildResidentialEnergy(sources)._unsafeUnwrapErr()).toMatchObject({
      reason: 'empty_dataset',
      detail: 'no oil sales in region 11',
    })
  })

  it('remonte l’erreur d’une source illisible', () => {
    expect(
      buildResidentialEnergy({ ...SOURCES, irisGasCsv: 'code_departement\n01' })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch', detail: 'conso_mwh_hors_secret' })
  })
})
