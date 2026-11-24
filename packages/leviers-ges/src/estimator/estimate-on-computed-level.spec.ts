import { err, ok } from 'neverthrow'
import { describe, expect, it, vi } from 'vitest'
import type { EstimateResult } from '../application/estimate/estimate-result.ts'
import { quantity } from '../domain/units.ts'
import { estimateOnComputedLevel } from './estimate-on-computed-level.ts'

const ESTIMATE_RESULT: EstimateResult = {
  reduction: quantity<'TonnesCo2ePerYear'>('42'),
  appliedAssumptions: {},
}

describe('estimateOnComputedLevel', () => {
  it('appelle le levier quand le niveau est calculé', () => {
    const estimateLever = vi.fn(() => ok(ESTIMATE_RESULT))
    const request = { id: 'fertilisation_azotee', territory: { level: 'departement' } } as const
    expect(estimateOnComputedLevel(request, estimateLever)._unsafeUnwrap()).toBe(ESTIMATE_RESULT)
    expect(estimateLever).toHaveBeenCalledExactlyOnceWith(request)
  })

  it('refuse un niveau non calculé sans appeler le levier', () => {
    const estimateLever = vi.fn(() => ok(ESTIMATE_RESULT))
    const request = { id: 'elevage_durable', territory: { level: 'epci' } } as const
    expect(estimateOnComputedLevel(request, estimateLever)._unsafeUnwrapErr()).toEqual({
      kind: 'level_not_computed',
      lever: 'elevage_durable',
      level: 'epci',
    })
    expect(estimateLever).not.toHaveBeenCalled()
  })

  it('renvoie l’erreur du levier quand il échoue', () => {
    const failure = { kind: 'unknown_territory', level: 'region', code: '99' } as const
    const request = { id: 'fertilisation_azotee', territory: { level: 'region' } } as const
    expect(estimateOnComputedLevel(request, () => err(failure))._unsafeUnwrapErr()).toBe(failure)
  })
})
