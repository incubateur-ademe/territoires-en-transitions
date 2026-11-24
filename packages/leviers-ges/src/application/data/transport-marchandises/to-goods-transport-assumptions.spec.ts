import { describe, expect, it } from 'vitest'
import { calculateHeavyVehicleEmissionFactors } from '../../../domain/heavy-vehicle-emission-factor.ts'
import { quantity } from '../../../domain/units.ts'
import type { GoodsTransport } from './get-goods-transport.ts'
import { toGoodsTransportAssumptions } from './to-goods-transport-assumptions.ts'

const INPUTS = {
  tonneKilometres: quantity<'TonneKilometres'>('1000'),
  heavyVehicleFleet: quantity<'Vehicles'>('100'),
  zeroEmissionFleet: quantity<'Vehicles'>('10'),
  dieselEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>('0.81'),
  dieselUnclassifiedShare: quantity<'Fraction'>('0.09'),
}

const GOODS_TRANSPORT: GoodsTransport = {
  inputs: INPUTS,
  emissionFactors: calculateHeavyVehicleEmissionFactors({
    dieselEmissionFactor: INPUTS.dieselEmissionFactor,
    heavyVehicleFleet: INPUTS.heavyVehicleFleet,
    zeroEmissionFleet: INPUTS.zeroEmissionFleet,
  }),
}

describe('toGoodsTransportAssumptions', () => {
  it('renvoie les hypothèses avec leurs valeurs', () => {
    const assumptions = toGoodsTransportAssumptions(GOODS_TRANSPORT)
    expect({
      tripType: assumptions['heavyVehicleTripType']?.value,
      factor: assumptions['heavyVehicleThermalEmissionFactor']?.value,
      loading: assumptions['heavyVehicleLoadFactor']?.value,
      unclassified: assumptions['dieselUnclassifiedShare']?.value,
      electric: assumptions['electricHeavyVehicleEmissionFactor']?.value,
      flows: assumptions['includeInternationalFlows']?.limit,
    }).toEqual({
      tripType: 'type de trajet par défaut du tableur, route et ville, poids lourds diesel de la région',
      factor: '0.1',
      loading: '8.1',
      unclassified: '0.09',
      electric: '0.0467',
      flows: expect.stringContaining('239,97') as string,
    })
  })
})
