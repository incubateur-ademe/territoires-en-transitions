import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { aggregateHousingSurfaces } from './aggregate-housing-surfaces.ts'

const INSEE_HEADER = 'COMMUNE;ARM;ACHL;CMBL;HLML;IPONDL;SURF;TYPL'

const COMMUNES_CSV = [
  'code_commune,code_epci,code_departement,code_region',
  '01001,200000001,01,84',
  '01002,200000002,01,84',
  '',
].join('\n')

function linesOf(...lines: readonly string[]): AsyncIterable<string> {
  return Readable.from(lines)
}

function insee(...lines: readonly string[]): AsyncIterable<string> {
  return linesOf(INSEE_HEADER, ...lines)
}

function nonZeroCells(csv: string): Record<string, Record<string, string>> {
  const [header = '', ...rows] = csv.trim().split('\n')
  const columns = header.split(',')
  return Object.fromEntries(
    rows.map((row) => {
      const values = row.split(',')
      const [commune = ''] = values
      return [
        commune,
        Object.fromEntries(
          columns.flatMap((column, index) =>
            index < 3 || values[index] === '0' ? [] : [[column, values[index] ?? '']],
          ),
        ),
      ]
    }),
  )
}

describe('aggregateHousingSurfaces', () => {
  it('somme le poids par la superficie estimée de la classe, par commune et par cellule', async () => {
    const aggregated = await aggregateHousingSurfaces({
      lines: insee(
        '01001;ZZZZZ;A11  ;3;Z;2;3;1',
        '01001;ZZZZZ;A11  ;3;Z;1.5;4;1',
        '01001;ZZZZZ;A11  ;3;Z;0.5;4;1',
        '01001;ZZZZZ;C100 ;2;1;1;7;2',
        '01002;ZZZZZ;C2016;4;2;3;1;2',
      ),
      communesCsv: COMMUNES_CSV,
    })
    expect(nonZeroCells(aggregated._unsafeUnwrap().csv)).toEqual({
      '01001': {
        housing_m2_house_fuel_oil_before_1971: '240',
        housing_m2_social_apartment_natural_gas_1971_to_2005: '130',
      },
      '01002': { housing_m2_private_apartment_electricity_after_2005: '60' },
    })
  })

  it('lit un poids en notation scientifique', async () => {
    const aggregated = await aggregateHousingSurfaces({
      lines: insee('01001;ZZZZZ;A11  ;3;Z;1e-2;3;1'),
      communesCsv: COMMUNES_CSV,
    })
    expect(aggregated._unsafeUnwrap()).toMatchObject({ dwellings: '0.01', squareMetres: '0.5' })
  })

  it('écrit l’EPCI et le département de chaque commune avant les 54 colonnes', async () => {
    const aggregated = await aggregateHousingSurfaces({
      lines: insee('01002;ZZZZZ;A11  ;3;Z;1;3;1'),
      communesCsv: COMMUNES_CSV,
    })
    const [header = '', row = ''] = aggregated._unsafeUnwrap().csv.split('\n')
    expect({
      columnCount: header.split(',').length,
      start: header.split(',').slice(0, 3),
      row: row.split(',').slice(0, 3),
    }).toEqual({
      columnCount: 57,
      start: ['commune', 'epci', 'departement'],
      row: ['01002', '200000002', '01'],
    })
  })

  it('écarte les logements hors résidence principale, hors maison ou appartement, de période ou de superficie inconnues', async () => {
    const aggregated = await aggregateHousingSurfaces({
      lines: insee(
        '01001;ZZZZZ;A11  ;Y;Y;1;Z;1',
        '01001;ZZZZZ;A11  ;3;Z;1;3;3',
        '01001;ZZZZZ;ZZZ  ;3;Z;1;3;1',
        '01001;ZZZZZ;A11  ;3;Z;1;Z;1',
        '01001;ZZZZZ;A11  ;3;Y;1;3;2',
        'incomplete',
      ),
      communesCsv: COMMUNES_CSV,
    })
    expect(aggregated._unsafeUnwrap()).toMatchObject({
      communeCount: 0,
      dwellings: '0',
      squareMetres: '0',
    })
  })

  it('écarte et compte les communes absentes du code officiel géographique actuel', async () => {
    const aggregated = await aggregateHousingSurfaces({
      lines: insee('01001;ZZZZZ;A11  ;3;Z;2;3;1', '99999;ZZZZZ;A11  ;3;Z;1.5;3;1'),
      communesCsv: COMMUNES_CSV,
    })
    expect(aggregated._unsafeUnwrap()).toMatchObject({
      communeCount: 1,
      unmatchedCommuneCount: 1,
      unmatchedDwellings: '1.5',
      dwellings: '2',
      squareMetres: '100',
    })
  })

  it('refuse un fichier vide', async () => {
    expect((await aggregateHousingSurfaces({ lines: linesOf(), communesCsv: COMMUNES_CSV }))._unsafeUnwrapErr()).toMatchObject({
      reason: 'missing_key_column',
      detail: 'empty file',
    })
  })

  it('refuse un fichier sans la colonne du poids', async () => {
    expect(
      (
        await aggregateHousingSurfaces({
          lines: linesOf('COMMUNE;ACHL;CMBL;HLML;SURF;TYPL', '01001;A11;3;Z;3;1'),
          communesCsv: COMMUNES_CSV,
        })
      )._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'missing_key_column', detail: 'IPONDL is not in the header' })
  })

  it('refuse un poids qui n’est pas un nombre décimal', async () => {
    expect(
      (
        await aggregateHousingSurfaces({
          lines: insee('01001;ZZZZZ;A11  ;3;Z;abc;3;1'),
          communesCsv: COMMUNES_CSV,
        })
      )._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'unreadable', detail: 'IPONDL=abc is not a decimal number' })
  })

  it('refuse un référentiel de communes sans colonne EPCI', async () => {
    expect(
      (
        await aggregateHousingSurfaces({
          lines: insee('01001;ZZZZZ;A11  ;3;Z;1;3;1'),
          communesCsv: 'code_commune,code_departement\n01001,01\n',
        })
      )._unsafeUnwrapErr(),
    ).toMatchObject({ dataset: 'territoires/communes.csv', reason: 'columns_mismatch' })
  })

  it('refuse d’écrire un code commune qui exigerait un guillemet CSV', async () => {
    expect(
      (
        await aggregateHousingSurfaces({
          lines: insee('0,1;ZZZZZ;A11  ;3;Z;1;3;1'),
          communesCsv: 'code_commune,code_epci,code_departement\n"0,1",200000001,01\n',
        })
      )._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'malformed_csv' })
  })
})
