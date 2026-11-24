import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateTransportPersonnesReportModalReduction,
  type ReportModalFlows,
  type ReportModalFractions,
} from './calculate-transport-personnes-report-modal-reduction.ts'

const NO_SHIFT: ReportModalFractions = {
  carToPublicTransport: quantity<'Fraction'>('0'),
  carToActiveModes: quantity<'Fraction'>('0'),
  publicTransportToActiveModes: quantity<'Fraction'>('0'),
}

function flows(overrides: Partial<Record<keyof ReportModalFlows, string>> = {}): ReportModalFlows {
  const values = {
    carWeeklyPassengerKm: '1000',
    publicTransportWeeklyPassengerKm: '1000',
    carEmissionFactor: '0.1165',
    busEmissionFactor: '0.8',
    ...overrides,
  }
  return {
    carWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>(values.carWeeklyPassengerKm),
    publicTransportWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>(
      values.publicTransportWeeklyPassengerKm,
    ),
    carEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.carEmissionFactor),
    busEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.busEmissionFactor),
  }
}

function reduction({
  fractions = NO_SHIFT,
  railShare = '0.6',
  railEmissionFactor = '0.02',
  input = flows(),
}: {
  fractions?: Partial<ReportModalFractions>
  railShare?: string
  railEmissionFactor?: string
  input?: ReportModalFlows
}): string {
  return calculateTransportPersonnesReportModalReduction({
    fractions: { ...NO_SHIFT, ...fractions },
    railShare: quantity<'Fraction'>(railShare),
    railEmissionFactor: quantity<'KgCo2ePerPassengerKilometre'>(railEmissionFactor),
    flows: input,
  })
    .decimalPlaces(6)
    .toFixed()
}

describe('calculateTransportPersonnesReportModalReduction', () => {
  it('ne réduit rien sans report', () => {
    expect(reduction({})).toBe('0')
  })

  it('reporte toute la voiture vers les transports en commun : 1 000 passagers.km par semaine, 60 % de ferré à 0,02, évitent 2,044633 tCO2e', () => {
    expect(reduction({ fractions: { carToPublicTransport: quantity<'Fraction'>('1') } })).toBe(
      '2.044633',
    )
  })

  it('reporte toute la voiture vers les modes actifs, sans émission : 1 000 passagers.km par semaine évitent 4,338793 tCO2e', () => {
    expect(reduction({ fractions: { carToActiveModes: quantity<'Fraction'>('1') } })).toBe('4.338793')
  })

  it('reporte tout le transport en commun vers les modes actifs : 1 000 passagers.km par semaine à 0,044 kgCO2e/passager.km (60 % de ferré à 0,02, bus à 0,08) évitent 2,29416 tCO2e', () => {
    expect(
      reduction({ fractions: { publicTransportToActiveModes: quantity<'Fraction'>('1') } }),
    ).toBe('2.29416')
  })

  it('reporte la moitié du transport en commun vers les modes actifs : 1,14708 tCO2e', () => {
    expect(
      reduction({ fractions: { publicTransportToActiveModes: quantity<'Fraction'>('0.5') } }),
    ).toBe('1.14708')
  })

  it('additionne les deux reports : moitié vers les transports en commun, moitié vers les modes actifs', () => {
    expect(
      reduction({
        fractions: {
          carToPublicTransport: quantity<'Fraction'>('0.5'),
          carToActiveModes: quantity<'Fraction'>('0.5'),
        },
      }),
    ).toBe('3.191713')
  })

  it('renvoie un résultat négatif quand le transport en commun émet plus que la voiture', () => {
    expect(
      reduction({
        fractions: { carToPublicTransport: quantity<'Fraction'>('1') },
        railShare: '0',
        input: flows({ carEmissionFactor: '0.0233' }),
      }),
    ).toBe('-3.303441')
  })

  it('est proportionnelle aux passagers.km en voiture', () => {
    expect(
      reduction({
        fractions: { carToActiveModes: quantity<'Fraction'>('1') },
        input: flows({ carWeeklyPassengerKm: '2000' }),
      }),
    ).toBe('8.677586')
  })
})
