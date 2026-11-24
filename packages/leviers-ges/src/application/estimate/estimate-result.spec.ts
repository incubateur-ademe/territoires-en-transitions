import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import { toEstimateResult } from './estimate-result.ts'

describe('toEstimateResult', () => {
  const reduction = quantity<'TonnesCo2ePerYear'>('12.3456789')

  it('arrondit la réduction et n’annonce aucune hypothèse par défaut', () => {
    const result = toEstimateResult(reduction)
    expect(result.reduction.toFixed()).toBe('12.35')
    expect(result.appliedAssumptions).toEqual({})
  })

  it('renvoie les hypothèses appliquées avec leur valeur, leur source et leur limite', () => {
    const appliedAssumptions = {
      railShare: { value: '0.24', source: 'SDES 2024', limit: 'moyenne hors Île-de-France' },
    }
    expect(toEstimateResult(reduction, appliedAssumptions).appliedAssumptions).toEqual(
      appliedAssumptions,
    )
  })
})
