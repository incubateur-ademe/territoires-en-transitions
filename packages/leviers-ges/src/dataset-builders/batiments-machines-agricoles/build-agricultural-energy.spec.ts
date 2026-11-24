import { describe, expect, it } from 'vitest'
import type { DataRow } from '../../domain/data-source.ts'
import { toRegionalSheet } from '../../testing/to-regional-sheet.ts'
import {
  buildAgriculturalEnergy,
  type AgriculturalEnergySources,
} from './build-agricultural-energy.ts'

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '69001', code_epci: '200000002', code_departement: '69', code_region: '84' },
  { code_commune: '75056', code_epci: '', code_departement: '75', code_region: '11' },
  { code_commune: '2A004', code_epci: '200000003', code_departement: '2A', code_region: '94' },
  { code_commune: '97101', code_epci: '200000099', code_departement: '971', code_region: '01' },
]

const IRIS_ELECTRICITY = [
  'CODE_IRIS_CODE;CONSO',
  '010010101;1.5',
  '010020101;secret',
  '690010101;2',
  '751010101;3',
  '751200101;4',
  '2A0040101;5',
  '971010101;7',
].join('\n')

const IRIS_GAS = ['CODE_IRIS_CODE;CONSO', '010010101;10'].join('\n')

const EPCI_ELECTRICITY = [
  'CODE_EPCI_CODE;CONSO',
  '200000001;100',
  '200000001;50',
  '200000002;secret',
  '200000099;999',
].join('\n')

const EPCI_GAS = ['CODE_EPCI_CODE;CONSO', '200000003;8'].join('\n')

function toSources(overrides: Partial<AgriculturalEnergySources> = {}): AgriculturalEnergySources {
  return {
    regionalSheets: [
      {
        name: 'region-84',
        rows: toRegionalSheet({
          code: '84',
          values: { ca2: '1000', ca4: '10', ca5: '100', ca8: '5' },
        }),
      },
      {
        name: 'region-11',
        rows: toRegionalSheet({
          code: '11',
          values: { ca2: '500', ca4: '5', ca5: '50', ca8: '0' },
        }),
      },
      {
        name: 'region-94',
        rows: toRegionalSheet({
          code: '94',
          values: { ca2: '100', ca4: '1', ca5: '10', ca8: '0' },
        }),
      },
    ],
    nationalSheet: {
      name: 'national',
      rows: toRegionalSheet({
        code: '10',
        values: { ca2: '1600', ca4: '16', ca5: '160', ca8: '5' },
      }),
    },
    communes: COMMUNES,
    irisElectricityCsv: IRIS_ELECTRICITY,
    irisGasCsv: IRIS_GAS,
    epciElectricityCsv: EPCI_ELECTRICITY,
    epciGasCsv: EPCI_GAS,
    ...overrides,
  }
}

describe('buildAgriculturalEnergy', () => {
  const build = buildAgriculturalEnergy(toSources())._unsafeUnwrap()

  it('écrit une ligne par région couverte, triée par code, en GWh', () => {
    expect(build.regionsCsv).toBe(
      [
        'code_region,electricity_gwh,natural_gas_gwh,petroleum_products_gwh,heat_gwh',
        '11,50,5,500,0',
        '84,100,10,1000,5',
        '94,10,1,100,0',
        '',
      ].join('\n'),
    )
  })

  it('range les lignes IRIS par département et ignore les départements hors périmètre', () => {
    expect(build.departementsCsv).toBe(
      [
        'code_departement,electricity_mwh,natural_gas_mwh',
        '01,1.5,10',
        '2A,5,0',
        '69,2,0',
        '75,7,0',
        '',
      ].join('\n'),
    )
  })

  it('somme les lignes de chaque EPCI et ignore les EPCI hors périmètre', () => {
    expect(build.epcisCsv).toBe(
      [
        'code_epci,electricity_mwh,natural_gas_mwh',
        '200000001,150,0',
        '200000002,0,0',
        '200000003,0,8',
        '',
      ].join('\n'),
    )
  })

  it('donne le total de chaque colonne', () => {
    expect(build.controlTotals).toEqual({
      regions: {
        electricity_gwh: '160',
        natural_gas_gwh: '16',
        petroleum_products_gwh: '1600',
        heat_gwh: '5',
      },
      departements: { electricity_mwh: '15.5', natural_gas_mwh: '10' },
      epcis: { electricity_mwh: '150', natural_gas_mwh: '8' },
    })
  })

  it('n’écrit aucune ligne d’EPCI vide pour une commune qui n’en a pas', () => {
    const linesWithoutCode = build.epcisCsv.split('\n').filter((line) => line.startsWith(','))
    expect(linesWithoutCode).toEqual([])
  })

  it('dénombre les lignes sous secret, comptées pour 0, de chacun des quatre fichiers', () => {
    expect(build.secretLineCounts).toEqual({
      irisElectricity: 1,
      irisGas: 0,
      epciElectricity: 1,
      epciGas: 0,
    })
  })

  describe('erreurs', () => {
    it('refuse des régions dont la somme s’écarte du total métropolitain', () => {
      const result = buildAgriculturalEnergy(
        toSources({
          nationalSheet: {
            name: 'national',
            rows: toRegionalSheet({
              code: '10',
              values: { ca2: '1600', ca4: '16', ca5: '161', ca8: '5' },
            }),
          },
        }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'sdes-energie-regional',
        reason: 'control_total_mismatch',
        detail: 'electricityGwh: the regions differ from the national workbook by -1',
      })
    })

    it('refuse un écart juste au-dessus du seuil de 10⁻⁹ GWh', () => {
      const result = buildAgriculturalEnergy(
        toSources({
          nationalSheet: {
            name: 'national',
            rows: toRegionalSheet({
              code: '10',
              values: { ca2: '1600.000000002', ca4: '16', ca5: '160', ca8: '5' },
            }),
          },
        }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        reason: 'control_total_mismatch',
        detail: expect.stringContaining('petroleumProductsGwh') as string,
      })
    })

    it('refuse un classeur régional en double, que la somme des régions révèle', () => {
      const [first] = toSources().regionalSheets
      const result = buildAgriculturalEnergy(
        toSources({ regionalSheets: [...toSources().regionalSheets, ...(first ? [first] : [])] }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({ reason: 'control_total_mismatch' })
    })

    it('refuse un préfixe de code IRIS qui n’est aucun département de la géographie', () => {
      const result = buildAgriculturalEnergy(
        toSources({ irisGasCsv: ['CODE_IRIS_CODE;CONSO', '999990101;3'].join('\n') }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'batiments-machines-agricoles/sources/sdes-gaz-iris-2024-agriculture.csv',
        reason: 'columns_mismatch',
        detail: 'key 99 is not in territoires/communes',
      })
    })

    it('refuse un EPCI qui n’est dans aucune commune de la géographie', () => {
      const result = buildAgriculturalEnergy(
        toSources({ epciGasCsv: ['CODE_EPCI_CODE;CONSO', '299999999;3'].join('\n') }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'batiments-machines-agricoles/sources/sdes-gaz-epci-2024-agriculture.csv',
        reason: 'columns_mismatch',
        detail: 'key 299999999 is not in territoires/communes',
      })
    })

    it('accepte un écart de flottant sous le seuil', () => {
      const result = buildAgriculturalEnergy(
        toSources({
          nationalSheet: {
            name: 'national',
            rows: toRegionalSheet({
              code: '10',
              values: { ca2: '1600.00000000001', ca4: '16', ca5: '160', ca8: '5' },
            }),
          },
        }),
      )
      expect(result.isOk()).toBe(true)
    })

    it('refuse une région absente de la géographie', () => {
      const result = buildAgriculturalEnergy(
        toSources({
          regionalSheets: [
            {
              name: 'region-99',
              rows: toRegionalSheet({
                code: '99',
                values: { ca2: '1600', ca4: '16', ca5: '160', ca8: '5' },
              }),
            },
          ],
        }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'sdes-energie-regional',
        reason: 'columns_mismatch',
        detail: 'region 99 is not in territoires/communes',
      })
    })

    it('renvoie l’erreur d’un classeur régional illisible, en nommant le classeur', () => {
      const result = buildAgriculturalEnergy(
        toSources({ regionalSheets: [{ name: 'region-84', rows: [] }] }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'region-84',
        reason: 'columns_mismatch',
      })
    })

    it('renvoie l’erreur du classeur métropolitain illisible', () => {
      const result = buildAgriculturalEnergy(
        toSources({ nationalSheet: { name: 'national', rows: [] } }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'national',
        reason: 'columns_mismatch',
      })
    })

    it.each([
      ['une commune sans région', { code_commune: '1', code_epci: '' , code_departement: '01' }],
      ['une commune sans département', { code_commune: '1', code_epci: '', code_region: '84' }],
      ['une commune sans colonne EPCI', { code_commune: '1', code_departement: '01', code_region: '84' }],
    ])('refuse %s', (_label, row) => {
      const result = buildAgriculturalEnergy(toSources({ communes: [row] }))
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'territoires/communes',
        reason: 'columns_mismatch',
      })
    })

    it.each([
      ['irisElectricityCsv', 'batiments-machines-agricoles/sources/sdes-electricite-iris-2024-agriculture.csv'],
      ['irisGasCsv', 'batiments-machines-agricoles/sources/sdes-gaz-iris-2024-agriculture.csv'],
      ['epciElectricityCsv', 'batiments-machines-agricoles/sources/sdes-electricite-epci-2024-agriculture.csv'],
      ['epciGasCsv', 'batiments-machines-agricoles/sources/sdes-gaz-epci-2024-agriculture.csv'],
    ] as const)('renvoie l’erreur du fichier %s en le nommant', (key, dataset) => {
      const result = buildAgriculturalEnergy(toSources({ [key]: 'CODE_IRIS_CODE;CONSO\nA;beaucoup' }))
      expect(result._unsafeUnwrapErr()).toMatchObject({ dataset })
    })

    it('refuse un code de territoire qui obligerait à protéger le CSV produit', () => {
      const result = buildAgriculturalEnergy(
        toSources({
          communes: [
            { code_commune: '1', code_epci: '"x', code_departement: '01', code_region: '84' },
          ],
          regionalSheets: [
            {
              name: 'region-84',
              rows: toRegionalSheet({
                code: '84',
                values: { ca2: '1600', ca4: '16', ca5: '160', ca8: '5' },
              }),
            },
          ],
          irisElectricityCsv: 'CODE_IRIS_CODE;CONSO',
          irisGasCsv: 'CODE_IRIS_CODE;CONSO',
          epciElectricityCsv: 'CODE_EPCI_CODE;CONSO',
          epciGasCsv: 'CODE_EPCI_CODE;CONSO',
        }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'epcis',
        reason: 'malformed_csv',
        detail: 'field "x needs CSV quoting',
      })
    })
  })
})
