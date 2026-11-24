import { describe, expect, it } from 'vitest'
import { commutingDataset, readCommutingPassengerKm } from './read-commuting-passenger-km.ts'

const HEADER = 'side,level,code,mode,champ_co2,sum_ipondi,sum_ipondi_dist_hebdo,sum_ipondi_co2_hebdo,rows'

function commuting(...lines: readonly string[]): string {
  return `${[HEADER, ...lines].join('\n')}\n`
}

describe('readCommutingPassengerKm', () => {
  it('lit le niveau, le code, le mode et les passagers.km par semaine', () => {
    const rows = readCommutingPassengerKm(commuting('R,DEP,01,5,TRUE,10,200.5,0,3'))._unsafeUnwrap()
    expect(rows.map((row) => ({ ...row, weeklyPassengerKm: row.weeklyPassengerKm.toFixed() }))).toEqual([
      { level: 'DEP', code: '01', mode: '5', weeklyPassengerKm: '200.5' },
    ])
  })

  it('refuse un niveau inconnu', () => {
    expect(readCommutingPassengerKm(commuting('R,COM,01,5,TRUE,10,200,0,3'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: commutingDataset,
      reason: 'columns_mismatch',
      detail: 'level=COM',
    })
  })

  it('refuse des passagers.km qui ne sont pas un nombre décimal', () => {
    expect(readCommutingPassengerKm(commuting('R,DEP,01,5,TRUE,10,abc,0,3'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: commutingDataset,
      reason: 'unreadable',
      detail: 'sum_ipondi_dist_hebdo=abc is not a decimal number',
    })
  })

  it('refuse une colonne manquante', () => {
    expect(readCommutingPassengerKm('side,level,code,mode\nR,DEP,01,5\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: commutingDataset,
      reason: 'columns_mismatch',
      detail: 'sum_ipondi_dist_hebdo',
    })
  })

  it('refuse un CSV mal formé', () => {
    expect(readCommutingPassengerKm('a,a\n1,2\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: commutingDataset,
      reason: 'malformed_csv',
    })
  })
})
