import { describe, expect, it } from 'vitest'
import { buildWasteTreatment } from './build-waste-treatment.ts'

const IREP_HEADER = 'identifiant,code_insee,code_operation,code_dechet,quantite_traitee_t'
const FACTORS_HEADER = 'code_irep,fe_stockage_kgco2e_t,fe_incineration_kgco2e_t'
const FLOWS_HEADER = 'flow_id,commune_code,waste_code,treatment_mode,tonnes_per_year'
const EMISSION_FACTORS_HEADER =
  'waste_code,storage_emission_factor_kg_per_tonne,incineration_emission_factor_kg_per_tonne'

const NO_FACTORS = toFactorsCsv()

function toIrepCsv(...lines: string[]): string {
  return [IREP_HEADER, ...lines].join('\n')
}

function toFactorsCsv(...lines: string[]): string {
  return [FACTORS_HEADER, ...lines].join('\n')
}

function toFlowsCsv(...lines: string[]): string {
  return `${[FLOWS_HEADER, ...lines].join('\n')}\n`
}

function toEmissionFactorsCsv(...lines: string[]): string {
  return `${[EMISSION_FACTORS_HEADER, ...lines].join('\n')}\n`
}

function flowsOf(irepCsv: string): string {
  return buildWasteTreatment({ irepCsv, emissionFactorsText: NO_FACTORS })._unsafeUnwrap().flowsCsv
}

describe('buildWasteTreatment, flux de traitement', () => {
  it.each([
    ['D1', 'storage'],
    ['D5', 'storage'],
    ['D10', 'storage'],
    ['R1', 'incineration'],
  ])('range l’opération %s dans le mode %s', (operation, mode) => {
    expect(flowsOf(toIrepCsv(`A,01001,${operation},20 03 01,10`))).toBe(
      toFlowsCsv(`01001:20 03 01:${mode},01001,20 03 01,${mode},10`),
    )
  })

  it.each(['R3', 'R12', 'R13', 'D13'])('écarte l’opération %s, qui n’est pas un mode de départ', (operation) => {
    expect(flowsOf(toIrepCsv(`A,01001,${operation},20 03 01,10`))).toBe(toFlowsCsv())
  })

  it('additionne les lignes d’une même commune, d’un même déchet et d’un même mode', () => {
    expect(
      flowsOf(
        toIrepCsv(
          'A,01001,D1,20 03 01,10.250',
          'B,01001,D5,20 03 01,0.5',
          'C,01001,D10,20 03 01,1',
          'D,01001,R1,20 03 01,4',
        ),
      ),
    ).toBe(
      toFlowsCsv(
        '01001:20 03 01:incineration,01001,20 03 01,incineration,4',
        '01001:20 03 01:storage,01001,20 03 01,storage,11.75',
      ),
    )
  })

  it('ne mélange ni les communes ni les codes de déchet', () => {
    expect(
      flowsOf(
        toIrepCsv('A,01002,D1,20 03 01,1', 'B,01001,D1,20 03 07,2', 'C,01001,D1,20 03 01,3'),
      ),
    ).toBe(
      toFlowsCsv(
        '01001:20 03 01:storage,01001,20 03 01,storage,3',
        '01001:20 03 07:storage,01001,20 03 07,storage,2',
        '01002:20 03 01:storage,01002,20 03 01,storage,1',
      ),
    )
  })

  it('écarte les lignes à zéro tonne', () => {
    expect(flowsOf(toIrepCsv('A,01001,D1,20 03 01,0.000', 'B,01002,D1,20 03 01,2'))).toBe(
      toFlowsCsv('01002:20 03 01:storage,01002,20 03 01,storage,2'),
    )
  })

  it('rattache l’arrondissement d’une commune à sa commune', () => {
    expect(flowsOf(toIrepCsv('A,69387,R1,20 03 01,5', 'B,13215,D1,20 03 01,6'))).toBe(
      toFlowsCsv(
        '13055:20 03 01:storage,13055,20 03 01,storage,6',
        '69123:20 03 01:incineration,69123,20 03 01,incineration,5',
      ),
    )
  })

  it('totalise les tonnes, au total et par mode', () => {
    const build = buildWasteTreatment({
      irepCsv: toIrepCsv('A,01001,D1,20 03 01,10', 'B,01001,D10,20 03 07,1.5', 'C,01002,R1,20 03 01,4'),
      emissionFactorsText: NO_FACTORS,
    })._unsafeUnwrap()
    expect({
      flows: build.flowCount,
      total: build.totalTonnes,
      storage: build.storageTonnes,
      incineration: build.incinerationTonnes,
    }).toEqual({ flows: 3, total: '15.5', storage: '11.5', incineration: '4' })
  })

  it('refuse une quantité qui n’est pas un nombre', () => {
    expect(
      buildWasteTreatment({
        irepCsv: toIrepCsv('A,01001,D1,20 03 01,beaucoup'),
        emissionFactorsText: NO_FACTORS,
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'dechets/sources/irep-2022-dechets-municipaux-traitement.csv',
      reason: 'unreadable',
      detail: 'quantite_traitee_t=beaucoup is not a decimal number',
    })
  })

  it('refuse un relevé IREP sans la colonne des quantités', () => {
    expect(
      buildWasteTreatment({
        irepCsv: 'identifiant,code_insee,code_operation,code_dechet\nA,01001,D1,20 03 01',
        emissionFactorsText: NO_FACTORS,
      })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch', detail: 'quantite_traitee_t' })
  })

  it('refuse un relevé IREP mal formé', () => {
    expect(
      buildWasteTreatment({
        irepCsv: 'a,b\n1,2,3',
        emissionFactorsText: NO_FACTORS,
      })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'dechets/sources/irep-2022-dechets-municipaux-traitement.csv',
      reason: 'malformed_csv',
    })
  })
})

describe('buildWasteTreatment, facteurs d’émission', () => {
  const irepCsv = toIrepCsv('A,01001,D1,20 03 01,1')

  function emissionFactorsOf(emissionFactorsText: string): string {
    return buildWasteTreatment({ irepCsv, emissionFactorsText })._unsafeUnwrap().emissionFactorsCsv
  }

  it('recopie les facteurs, triés par code de déchet', () => {
    expect(emissionFactorsOf(toFactorsCsv('20 03 01,412,374', '20 01 01,950,120'))).toBe(
      toEmissionFactorsCsv('20 01 01,950,120', '20 03 01,412,374'),
    )
  })

  it('laisse vide un facteur absent de la Base Empreinte', () => {
    expect(emissionFactorsOf(toFactorsCsv('20 01 31*,—,943', '20 02 02,—,—'))).toBe(
      toEmissionFactorsCsv('20 01 31*,,943', '20 02 02,,'),
    )
  })

  it('refuse un facteur qui n’est pas un nombre', () => {
    expect(
      buildWasteTreatment({
        irepCsv,
        emissionFactorsText: toFactorsCsv('20 03 01,beaucoup,374'),
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'dechets/sources/fe-dechets-tableur.csv',
      reason: 'unreadable',
      detail: 'fe_stockage_kgco2e_t=beaucoup is not a decimal number',
    })
  })

  it('refuse un tableau de facteurs sans la colonne du stockage', () => {
    expect(
      buildWasteTreatment({
        irepCsv,
        emissionFactorsText: 'code_irep,fe_incineration_kgco2e_t\n20 03 01,374',
      })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'dechets/sources/fe-dechets-tableur.csv',
      reason: 'columns_mismatch',
      detail: 'fe_stockage_kgco2e_t',
    })
  })

  it('refuse un tableau de facteurs mal formé', () => {
    expect(
      buildWasteTreatment({ irepCsv, emissionFactorsText: 'a,b\n1,2,3' })._unsafeUnwrapErr(),
    ).toMatchObject({ dataset: 'dechets/sources/fe-dechets-tableur.csv', reason: 'malformed_csv' })
  })
})
