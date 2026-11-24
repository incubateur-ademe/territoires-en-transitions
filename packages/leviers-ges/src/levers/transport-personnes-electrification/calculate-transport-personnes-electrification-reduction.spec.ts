import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateElectrifiedBusShare,
  calculateElectrifiedCarShare,
  calculateTransportPersonnesElectrificationReduction,
  type ElectrificationFractions,
  type TransportFlows,
} from './calculate-transport-personnes-electrification-reduction.ts'
import type { ThermalFleet } from './data/thermal-fleet.ts'

const NO_ACTION: ElectrificationFractions = {
  carElectrification: quantity<'Fraction'>('0'),
  busElectrification: quantity<'Fraction'>('0'),
}

function transportFlows(overrides: Partial<Record<keyof TransportFlows, string>>): TransportFlows {
  const values = {
    carWeeklyPassengerKm: '0',
    publicTransportWeeklyPassengerKm: '0',
    ...overrides,
  }
  return {
    carWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>(values.carWeeklyPassengerKm),
    publicTransportWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>(
      values.publicTransportWeeklyPassengerKm,
    ),
  }
}

function thermalFleet(overrides: Partial<Record<keyof ThermalFleet, string>> = {}): ThermalFleet {
  const values = {
    carThermalEmissionFactor: '0.1165',
    busThermalEmissionFactor: '0.8',
    carThermalFleetShare: '1',
    busThermalFleetShare: '1',
    ...overrides,
  }
  return {
    carThermalEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.carThermalEmissionFactor),
    busThermalEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.busThermalEmissionFactor),
    carThermalFleetShare: quantity<'Fraction'>(values.carThermalFleetShare),
    busThermalFleetShare: quantity<'Fraction'>(values.busThermalFleetShare),
  }
}

function reduction({
  fractions = NO_ACTION,
  railShare = '0',
  flows,
  fleet = thermalFleet(),
}: {
  fractions?: Partial<ElectrificationFractions>
  railShare?: string
  flows: TransportFlows
  fleet?: ThermalFleet
}): string {
  return calculateTransportPersonnesElectrificationReduction({
    fractions: { ...NO_ACTION, ...fractions },
    railShare: quantity<'Fraction'>(railShare),
    transportFlows: flows,
    thermalFleet: fleet,
  })
    .decimalPlaces(6)
    .toFixed()
}

describe('calculateTransportPersonnesElectrificationReduction', () => {
  it('ne réduit rien sans électrification', () => {
    expect(
      reduction({
        flows: transportFlows({
          carWeeklyPassengerKm: '1000',
          publicTransportWeeklyPassengerKm: '1000',
        }),
      }),
    ).toBe('0')
  })

  it('électrifie des bus : 1 000 passagers.km par semaine dont 60 % en ferré, 0,8 contre 0,095 kgCO2e/véh.km, tout le parc, évitent 1,470348 tCO2e', () => {
    expect(
      reduction({
        fractions: { busElectrification: quantity<'Fraction'>('1') },
        railShare: '0.6',
        flows: transportFlows({ publicTransportWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('1.470348')
  })

  it('électrifie des voitures : 1 000 passagers.km par semaine, 0,1165 contre 0,013345 kgCO2e/véh.km, tout le parc, évitent 3,841787 tCO2e', () => {
    expect(
      reduction({
        fractions: { carElectrification: quantity<'Fraction'>('1') },
        flows: transportFlows({ carWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('3.841787')
  })

  it('est proportionnelle à la part électrifiée : la moitié du parc évite la moitié', () => {
    expect(
      reduction({
        fractions: { busElectrification: quantity<'Fraction'>('0.5') },
        railShare: '0.6',
        flows: transportFlows({ publicTransportWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('0.735174')
  })

  it('ne compte pas le ferré dans les bus : tout le transport en commun en ferré évite 0', () => {
    expect(
      reduction({
        fractions: { busElectrification: quantity<'Fraction'>('1') },
        railShare: '1',
        flows: transportFlows({ publicTransportWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('0')
  })

  it('plafonne la part électrifiée à la part thermique du parc : 80 % demandés sur un parc thermique à 50 % comptent pour 50 %', () => {
    const flows = transportFlows({ publicTransportWeeklyPassengerKm: '1000' })
    const capped = reduction({
      fractions: { busElectrification: quantity<'Fraction'>('0.8') },
      flows,
      fleet: thermalFleet({ busThermalFleetShare: '0.5' }),
    })
    const atCap = reduction({
      fractions: { busElectrification: quantity<'Fraction'>('0.5') },
      flows,
      fleet: thermalFleet({ busThermalFleetShare: '0.5' }),
    })
    expect(capped).toBe(atCap)
  })

  it('additionne les voitures et les bus', () => {
    expect(
      reduction({
        fractions: {
          carElectrification: quantity<'Fraction'>('1'),
          busElectrification: quantity<'Fraction'>('1'),
        },
        railShare: '0.6',
        flows: transportFlows({ carWeeklyPassengerKm: '1000', publicTransportWeeklyPassengerKm: '1000' }),
      }),
    ).toBe('5.312135')
  })
})

describe('calculateElectrifiedCarShare et calculateElectrifiedBusShare', () => {
  it('gardent la part demandée quand elle tient dans le parc thermique', () => {
    const fractions = {
      carElectrification: quantity<'Fraction'>('0.3'),
      busElectrification: quantity<'Fraction'>('0.4'),
    }
    const fleet = thermalFleet({ carThermalFleetShare: '0.9', busThermalFleetShare: '0.8' })
    expect({
      car: calculateElectrifiedCarShare({ fractions, thermalFleet: fleet }).toFixed(),
      bus: calculateElectrifiedBusShare({ fractions, thermalFleet: fleet }).toFixed(),
    }).toEqual({ car: '0.3', bus: '0.4' })
  })

  it('bornent la part demandée à la part thermique du parc', () => {
    const fractions = {
      carElectrification: quantity<'Fraction'>('1'),
      busElectrification: quantity<'Fraction'>('1'),
    }
    const fleet = thermalFleet({ carThermalFleetShare: '0.9', busThermalFleetShare: '0.8' })
    expect({
      car: calculateElectrifiedCarShare({ fractions, thermalFleet: fleet }).toFixed(),
      bus: calculateElectrifiedBusShare({ fractions, thermalFleet: fleet }).toFixed(),
    }).toEqual({ car: '0.9', bus: '0.8' })
  })
})
