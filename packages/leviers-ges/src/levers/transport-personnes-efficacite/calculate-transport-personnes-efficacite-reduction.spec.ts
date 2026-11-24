import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateTransportPersonnesEfficaciteReduction,
  type EfficiencyFractions,
} from './calculate-transport-personnes-efficacite-reduction.ts'
import type { TransportInputs } from '../../application/data/transport-personnes/transport-inputs.ts'

const NO_ACTION: EfficiencyFractions = {
  carEcodrivingApplication: quantity<'Fraction'>('0'),
  busEcodrivingApplication: quantity<'Fraction'>('0'),
  carPassengerIncrease: quantity<'RelativeChange'>('0'),
  busPassengerIncrease: quantity<'RelativeChange'>('0'),
}

function transportInputs(overrides: Partial<Record<keyof TransportInputs, string>>): TransportInputs {
  const values = {
    carWeeklyPassengerKm: '0',
    publicTransportWeeklyPassengerKm: '0',
    carEmissionFactor: '0.1165',
    busEmissionFactor: '0.8',
    carFleetUnclassifiedShare: '0',
    busFleetUnclassifiedShare: '0',
    carFleetClassified: '1',
    busFleetClassified: '1',
    ...overrides,
  }
  return {
    carWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>(values.carWeeklyPassengerKm),
    publicTransportWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>(
      values.publicTransportWeeklyPassengerKm,
    ),
    carEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.carEmissionFactor),
    busEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.busEmissionFactor),
    carFleetUnclassifiedShare: quantity<'Fraction'>(values.carFleetUnclassifiedShare),
    busFleetUnclassifiedShare: quantity<'Fraction'>(values.busFleetUnclassifiedShare),
    carFleetClassified: quantity<'Vehicles'>(values.carFleetClassified),
    busFleetClassified: quantity<'Vehicles'>(values.busFleetClassified),
  }
}

function reduction({
  fractions = NO_ACTION,
  railShare = '0',
  inputs,
}: {
  fractions?: Partial<EfficiencyFractions>
  railShare?: string
  inputs: TransportInputs
}): string {
  return calculateTransportPersonnesEfficaciteReduction({
    fractions: { ...NO_ACTION, ...fractions },
    railShare: quantity<'Fraction'>(railShare),
    transportInputs: inputs,
  })
    .decimalPlaces(6)
    .toFixed()
}

describe('calculateTransportPersonnesEfficaciteReduction', () => {
  it('ne réduit rien sans écoconduite ni passagers en plus', () => {
    expect(
      reduction({
        inputs: transportInputs({
          carWeeklyPassengerKm: '1000',
          publicTransportWeeklyPassengerKm: '1000',
        }),
      }),
    ).toBe('0')
  })

  it('applique le potentiel de 10 % aux voitures : 1 000 passagers.km par semaine à 0,1 kgCO2e/passager.km', () => {
    expect(
      reduction({
        fractions: { carEcodrivingApplication: quantity<'Fraction'>('1') },
        inputs: transportInputs({ carWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('0.433879')
  })

  it('combine les deux gains par un produit : 50 % d’écoconduite et 10 % de passagers en plus donnent 13,6 %', () => {
    expect(
      reduction({
        fractions: {
          carEcodrivingApplication: quantity<'Fraction'>('0.5'),
          carPassengerIncrease: quantity<'RelativeChange'>('0.1'),
        },
        inputs: transportInputs({ carWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('0.591654')
  })

  it('une hausse de 100 % des passagers divise les émissions par deux', () => {
    expect(
      reduction({
        fractions: { carPassengerIncrease: quantity<'RelativeChange'>('1') },
        inputs: transportInputs({ carWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('2.169396')
  })

  it('divise le facteur du bus par 10 passagers et retire la part ferrée : 400 passagers.km routiers par semaine', () => {
    expect(
      reduction({
        fractions: { busEcodrivingApplication: quantity<'Fraction'>('1') },
        railShare: '0.6',
        inputs: transportInputs({ publicTransportWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('0.166848')
  })

  it('applique au bus sa propre hausse de passagers : 20 % et 50 % d’écoconduite sur 400 passagers.km routiers', () => {
    expect(
      reduction({
        fractions: {
          busEcodrivingApplication: quantity<'Fraction'>('0.5'),
          busPassengerIncrease: quantity<'RelativeChange'>('0.2'),
        },
        railShare: '0.6',
        inputs: transportInputs({ publicTransportWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('0.3476')
  })

  it('ne compte aucun bus quand tout le transport en commun est ferré', () => {
    expect(
      reduction({
        fractions: { busEcodrivingApplication: quantity<'Fraction'>('1') },
        railShare: '1',
        inputs: transportInputs({ publicTransportWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('0')
  })

  it('additionne les voitures et les bus', () => {
    expect(
      reduction({
        fractions: {
          carEcodrivingApplication: quantity<'Fraction'>('1'),
          busEcodrivingApplication: quantity<'Fraction'>('1'),
        },
        railShare: '0.6',
        inputs: transportInputs({
          carWeeklyPassengerKm: '1000',
          publicTransportWeeklyPassengerKm: '1000',
        }),
      }),
    ).toBe('0.600727')
  })
})
