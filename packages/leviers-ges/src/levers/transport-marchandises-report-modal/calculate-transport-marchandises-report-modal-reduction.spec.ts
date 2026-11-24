import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import { calculateTransportMarchandisesReportModalReduction } from './calculate-transport-marchandises-report-modal-reduction.ts'

function reductionOf({
  rail = '0',
  waterway = '0',
  tonneKilometres = '1000000',
  cyclologistic = '0',
  roadEmissionFactor = '0.08',
}: {
  rail?: string
  waterway?: string
  tonneKilometres?: string
  cyclologistic?: string
  roadEmissionFactor?: string
}): string {
  return calculateTransportMarchandisesReportModalReduction({
    roadToRail: quantity<'Fraction'>(rail),
    roadToWaterway: quantity<'Fraction'>(waterway),
    tonneKilometres: quantity<'TonneKilometres'>(tonneKilometres),
    cyclologisticTonneKilometres: quantity<'TonneKilometres'>(cyclologistic),
    roadEmissionFactor: quantity<'KgCo2ePerTonneKilometre'>(roadEmissionFactor),
  }).toFixed()
}

describe('calculateTransportMarchandisesReportModalReduction', () => {
  it('évite 57,1146408 tCO2e quand tout le routier passe au ferroviaire : 1 000 000 t.km, route à 0,08', () => {
    expect(reductionOf({ rail: '1' })).toBe('57.1146408')
  })

  it('évite 45,65433992 tCO2e quand tout le routier passe au fluvial', () => {
    expect(reductionOf({ waterway: '1' })).toBe('45.65433992')
  })

  it('additionne le ferroviaire à 10 % et le fluvial à 5 % : 7,994181076 tCO2e', () => {
    expect(reductionOf({ rail: '0.1', waterway: '0.05' })).toBe('7.994181076')
  })

  it('retire les t.km de cyclologistique de la base : 600 000 t.km restantes, tout ferroviaire, 34,26878448 tCO2e', () => {
    expect(reductionOf({ rail: '1', cyclologistic: '400000' })).toBe('34.26878448')
  })

  it('évite zéro sans report', () => {
    expect(reductionOf({})).toBe('0')
  })

  it('donne un résultat négatif quand la route émet moins que le mode reporté : route à 0,005', () => {
    expect(reductionOf({ rail: '1', roadEmissionFactor: '0.005' })).toBe('-3.3653592')
  })

  it('donne un résultat négatif quand la cyclologistique dépasse les t.km', () => {
    expect(reductionOf({ rail: '1', cyclologistic: '2000000' })).toBe('-57.1146408')
  })
})
