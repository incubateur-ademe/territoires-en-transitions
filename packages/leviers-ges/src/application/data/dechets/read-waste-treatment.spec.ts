import { describe, expect, it } from 'vitest'
import type { DataRow } from '../../../domain/data-source.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../../testing/temporary-csv-data-source.ts'
import { readWasteTreatment } from './read-waste-treatment.ts'

function flow(commune: string, wasteCode: string, mode: string, tonnes: string): DataRow {
  return {
    flow_id: `${commune}:${wasteCode}:${mode}`,
    commune_code: commune,
    waste_code: wasteCode,
    treatment_mode: mode,
    tonnes_per_year: tonnes,
  }
}

function factors(wasteCode: string, storage: string, incineration: string): DataRow {
  return {
    waste_code: wasteCode,
    storage_emission_factor_kg_per_tonne: storage,
    incineration_emission_factor_kg_per_tonne: incineration,
  }
}

function toDataSource({
  flows,
  emissionFactors = [factors('20 03 01', '412', '374'), factors('20 02 02', '', '')],
}: {
  flows: readonly DataRow[]
  emissionFactors?: readonly DataRow[]
}) {
  const fixtures: Readonly<Record<string, DatasetFixture>> = {
    'dechets/treatment-flows': { keyColumn: 'flow_id', rows: flows },
    'dechets/emission-factors': { keyColumn: 'waste_code', rows: emissionFactors },
  }
  return createTemporaryCsvDataSource(fixtures)
}

describe('readWasteTreatment', () => {
  it('additionne les tonnes de chaque mode par code de déchet, sur les communes du territoire seulement', () => {
    const dataSource = toDataSource({
      flows: [
        flow('01001', '20 03 01', 'storage', '10'),
        flow('01002', '20 03 01', 'storage', '5.5'),
        flow('01001', '20 03 01', 'incineration', '7'),
        flow('99999', '20 03 01', 'storage', '1000'),
      ],
    })
    const [wasteType] = readWasteTreatment({ dataSource, communes: ['01001', '01002'] })._unsafeUnwrap()
    expect({
      wasteCode: wasteType?.wasteCode,
      storage: wasteType?.storageTonnes.toFixed(),
      incineration: wasteType?.incinerationTonnes.toFixed(),
    }).toEqual({ wasteCode: '20 03 01', storage: '15.5', incineration: '7' })
  })

  it('renvoie un type par code de déchet, avec des tonnes nulles pour le mode absent', () => {
    const dataSource = toDataSource({
      flows: [flow('01001', '20 03 01', 'storage', '10'), flow('01001', '20 02 02', 'incineration', '3')],
    })
    const wasteTypes = readWasteTreatment({ dataSource, communes: ['01001'] })._unsafeUnwrap()
    expect(
      wasteTypes.map(({ wasteCode, storageTonnes, incinerationTonnes }) => [
        wasteCode,
        storageTonnes.toFixed(),
        incinerationTonnes.toFixed(),
      ]),
    ).toEqual([
      ['20 03 01', '10', '0'],
      ['20 02 02', '0', '3'],
    ])
  })

  it('joint les facteurs d’émission du code, vides quand la Base Empreinte n’en a pas', () => {
    const dataSource = toDataSource({
      flows: [flow('01001', '20 03 01', 'storage', '10'), flow('01001', '20 02 02', 'storage', '3')],
    })
    const wasteTypes = readWasteTreatment({ dataSource, communes: ['01001'] })._unsafeUnwrap()
    expect(
      wasteTypes.map(({ storageEmissionFactor, incinerationEmissionFactor }) => [
        storageEmissionFactor?.toFixed(),
        incinerationEmissionFactor?.toFixed(),
      ]),
    ).toEqual([
      ['412', '374'],
      [undefined, undefined],
    ])
  })

  it('laisse sans facteur un code absent du jeu des facteurs', () => {
    const dataSource = toDataSource({
      flows: [flow('01001', '20 99 99', 'storage', '10')],
    })
    const [wasteType] = readWasteTreatment({ dataSource, communes: ['01001'] })._unsafeUnwrap()
    expect([wasteType?.storageEmissionFactor, wasteType?.incinerationEmissionFactor]).toEqual([
      undefined,
      undefined,
    ])
  })

  it('renvoie une liste vide pour un territoire sans site de traitement', () => {
    const dataSource = toDataSource({ flows: [flow('01001', '20 03 01', 'storage', '10')] })
    expect(readWasteTreatment({ dataSource, communes: ['02002'] })._unsafeUnwrap()).toEqual([])
  })

  it('refuse un mode de traitement inconnu', () => {
    const dataSource = toDataSource({ flows: [flow('01001', '20 03 01', 'burning', '10')] })
    expect(readWasteTreatment({ dataSource, communes: ['01001'] })._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'dechets/treatment-flows',
      reason: 'unreadable',
      detail: 'treatment_mode=burning is neither storage nor incineration',
    })
  })

  it('refuse des tonnes qui ne sont pas un nombre', () => {
    const dataSource = toDataSource({ flows: [flow('01001', '20 03 01', 'storage', 'beaucoup')] })
    expect(readWasteTreatment({ dataSource, communes: ['01001'] })._unsafeUnwrapErr()).toMatchObject({
      reason: 'unreadable',
      detail: 'tonnes_per_year=beaucoup is not a decimal number',
    })
  })

  it('refuse un facteur d’émission qui n’est pas un nombre', () => {
    const dataSource = toDataSource({
      flows: [flow('01001', '20 03 01', 'storage', '10')],
      emissionFactors: [factors('20 03 01', 'beaucoup', '374')],
    })
    expect(readWasteTreatment({ dataSource, communes: ['01001'] })._unsafeUnwrapErr()).toMatchObject({
      dataset: 'dechets/emission-factors',
      reason: 'unreadable',
      detail: 'storage_emission_factor_kg_per_tonne=beaucoup is not a decimal number',
    })
  })

  it('refuse un jeu de flux absent', () => {
    const dataSource = createTemporaryCsvDataSource({})
    expect(readWasteTreatment({ dataSource, communes: ['01001'] })._unsafeUnwrapErr()).toMatchObject({
      reason: 'unknown_dataset',
    })
  })

  it('refuse un flux sans colonne de commune', () => {
    const withoutCommune: DataRow = {
      flow_id: '01001:20 03 01:storage',
      waste_code: '20 03 01',
      treatment_mode: 'storage',
      tonnes_per_year: '10',
    }
    const dataSource = toDataSource({ flows: [withoutCommune] })
    expect(readWasteTreatment({ dataSource, communes: ['01001'] })._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
    })
  })
})
