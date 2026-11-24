import { describe, expect, it } from 'vitest'
import { fleetDataset, readFleet } from './read-fleet.ts'

const HEADER = 'maille,code,groupe,carburant,parc_2025'

describe('readFleet', () => {
  it('lit la maille, le code, le groupe, le carburant et la taille du parc', () => {
    const rows = readFleet(`${HEADER}\nDEP,01,VP,diesel,518\nDEP,01,TC_routier,gaz,3\n`)._unsafeUnwrap()
    expect(rows.map((row) => ({ ...row, vehicles: row.vehicles.toFixed() }))).toEqual([
      { level: 'DEP', code: '01', group: 'VP', fuel: 'diesel', vehicles: '518' },
      { level: 'DEP', code: '01', group: 'TC_routier', fuel: 'gaz', vehicles: '3' },
    ])
  })

  it('refuse un groupe inconnu', () => {
    expect(readFleet(`${HEADER}\nDEP,01,PL,diesel,5\n`)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: fleetDataset,
      reason: 'columns_mismatch',
      detail: 'groupe=PL',
    })
  })

  it('refuse un parc qui n’est pas un nombre décimal', () => {
    expect(readFleet(`${HEADER}\nDEP,01,VP,diesel,beaucoup\n`)._unsafeUnwrapErr()).toMatchObject({
      dataset: fleetDataset,
      reason: 'unreadable',
      detail: 'parc_2025=beaucoup is not a decimal number',
    })
  })

  it('refuse une colonne manquante', () => {
    expect(readFleet('maille,code,groupe,carburant\nDEP,01,VP,diesel\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: fleetDataset,
      reason: 'columns_mismatch',
      detail: 'parc_2025',
    })
  })

  it('refuse un CSV mal formé', () => {
    expect(readFleet('a,a\n1,2\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: fleetDataset,
      reason: 'malformed_csv',
    })
  })
})
