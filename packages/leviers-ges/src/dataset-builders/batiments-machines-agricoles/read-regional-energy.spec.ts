import { describe, expect, it } from 'vitest'
import { OLDER_YEAR_VALUES, toRegionalSheet } from '../../testing/to-regional-sheet.ts'
import type { SheetRows } from '../sheet-rows.ts'
import { readRegionalEnergy } from './read-regional-energy.ts'

function read(rows: SheetRows, year = '2024') {
  return readRegionalEnergy({ dataset: 'sheet', rows, year })
}

describe('readRegionalEnergy', () => {
  it('lit les quatre lignes de l’agriculture pour l’année demandée', () => {
    const rows = toRegionalSheet({ values: { ca2: '6649.5', ca4: '431.25', ca5: '1133', ca8: '105.75' } })
    expect(read(rows)._unsafeUnwrap()).toEqual({
      regionCode: '53',
      electricityGwh: '1133',
      naturalGasGwh: '431.25',
      petroleumProductsGwh: '6649.5',
      heatGwh: '105.75',
    })
  })

  it('choisit la colonne de l’année demandée', () => {
    const rows = toRegionalSheet({ values: { ca2: '1', ca4: '2', ca5: '3', ca8: '4' } })
    expect(read(rows, '2023')._unsafeUnwrap()).toMatchObject({
      petroleumProductsGwh: '10',
      naturalGasGwh: '20',
      electricityGwh: '30',
      heatGwh: '40',
    })
  })

  it('écrit en décimal à 12 chiffres une valeur en notation scientifique', () => {
    const rows = toRegionalSheet({
      values: { ca2: '5.8370206071839403E-2', ca4: '1', ca5: '1', ca8: '0.1000000000004' },
    })
    expect(read(rows)._unsafeUnwrap()).toMatchObject({
      petroleumProductsGwh: '0.058370206072',
      heatGwh: '0.1',
    })
  })

  it('refuse un classeur sans code de région en première cellule', () => {
    const rows = toRegionalSheet({ code: null, values: OLDER_YEAR_VALUES })
    expect(read(rows)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'sheet',
      reason: 'columns_mismatch',
      detail: 'region code in the first cell',
    })
  })

  it('refuse un classeur sans colonne pour l’année demandée', () => {
    const rows = toRegionalSheet({ values: OLDER_YEAR_VALUES })
    expect(read(rows, '2030')._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'year 2030',
    })
  })

  it.each(['CA2', 'CA4', 'CA5', 'CA8'])('refuse un classeur sans la ligne %s', (line) => {
    const rows = toRegionalSheet({ values: OLDER_YEAR_VALUES }).filter((row) => row[0] !== line)
    expect(read(rows)._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: `line ${line}`,
    })
  })

  it.each(['GWh PCS', 'kt', null])('refuse une ligne CA4 dont l’unité est %j et non GWh', (unit) => {
    const rows = toRegionalSheet({ values: OLDER_YEAR_VALUES }).map((row) =>
      row[0] === 'CA4' ? ['CA4', 'Gaz naturel', unit, '1', '2'] : row,
    )
    expect(read(rows)._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'unit of line CA4',
    })
  })

  it('refuse une ligne dont la cellule de l’année est vide', () => {
    const rows = toRegionalSheet({ values: OLDER_YEAR_VALUES }).map((row) =>
      row[0] === 'CA8' ? ['CA8', 'Chaleur commercialisée', 'GWh', '1', null] : row,
    )
    expect(read(rows)._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'line CA8',
    })
  })

  it('refuse une valeur qui n’est pas un nombre', () => {
    const rows = toRegionalSheet({ values: { ca2: 'abc', ca4: '1', ca5: '1', ca8: '1' } })
    expect(read(rows)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'sheet',
      reason: 'unreadable',
      detail: 'CA2=abc is not a decimal number',
    })
  })
})
