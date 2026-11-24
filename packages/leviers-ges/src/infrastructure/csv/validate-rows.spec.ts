import { describe, expect, it } from 'vitest'
import { checkControlTotals, indexByKey } from './validate-rows.ts'

describe('validate-rows', () => {
  it('un total de contrôle sur une colonne absente des lignes est refusé', () => {
    expect(checkControlTotals([{ code: '11' }], { hectares: '1' })._unsafeUnwrapErr()).toEqual({
      reason: 'control_total_mismatch',
      detail: 'hectares is absent or not numeric',
    })
  })

  it('une colonne clé absente des lignes est refusée', () => {
    expect(indexByKey([{ code: '11' }], 'insee')._unsafeUnwrapErr()).toEqual({
      reason: 'missing_key_column',
      detail: 'insee',
    })
  })
})
