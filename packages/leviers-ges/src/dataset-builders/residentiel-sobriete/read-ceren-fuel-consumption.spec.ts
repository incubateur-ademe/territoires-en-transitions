import { describe, expect, it } from 'vitest'
import { readCerenFuelConsumption } from './read-ceren-fuel-consumption.ts'

const HEADER_ROW = ['Énergie', 'Usage', undefined, '1990', '2024']
const FUEL_OIL_ROW = ['Total Fioul', undefined, undefined, '103', '32']
const LPG_ROW = ['Total GPL', undefined, undefined, '17', '8']

describe('readCerenFuelConsumption', () => {
  it('lit les totaux fioul et GPL de la colonne 2024', () => {
    expect(
      readCerenFuelConsumption([['titre'], HEADER_ROW, FUEL_OIL_ROW, LPG_ROW])._unsafeUnwrap(),
    ).toEqual({ fuelOilTwh: '32', liquefiedPetroleumGasTwh: '8' })
  })

  it('arrondit un total à 12 décimales', () => {
    const rows = [HEADER_ROW, ['Total Fioul', undefined, undefined, '1', '32.0000000000005'], LPG_ROW]
    expect(readCerenFuelConsumption(rows)._unsafeUnwrap().fuelOilTwh).toBe('32.000000000001')
  })

  it('refuse une feuille sans ligne d’en-tête', () => {
    expect(readCerenFuelConsumption([FUEL_OIL_ROW, LPG_ROW])._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'columns_mismatch',
      detail: 'year 2024',
    })
  })

  it('refuse une en-tête sans la colonne 2024', () => {
    const rows = [['Énergie', 'Usage', undefined, '1990'], FUEL_OIL_ROW, LPG_ROW]
    expect(readCerenFuelConsumption(rows)._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'year 2024',
    })
  })

  it('refuse une feuille sans ligne Total GPL', () => {
    expect(readCerenFuelConsumption([HEADER_ROW, FUEL_OIL_ROW])._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'line Total GPL',
    })
  })

  it('refuse une cellule qui n’est pas du texte', () => {
    const rows = [HEADER_ROW, ['Total Fioul', undefined, undefined, '103', undefined], LPG_ROW]
    expect(readCerenFuelConsumption(rows)._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'line Total Fioul',
    })
  })

  it('refuse un total qui n’est pas un nombre', () => {
    const rows = [HEADER_ROW, ['Total Fioul', undefined, undefined, '103', 'n.d.'], LPG_ROW]
    expect(readCerenFuelConsumption(rows)._unsafeUnwrapErr()).toMatchObject({
      reason: 'unreadable',
      detail: 'Total Fioul=n.d. is not a decimal number',
    })
  })
})
