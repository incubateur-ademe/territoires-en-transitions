import type BigNumber from 'bignumber.js'
import { toBig } from './big-number.ts'
import type { Fraction, KgCo2ePerPassengerKilometre, KgCo2ePerVehicleKilometre } from './units.ts'
import { calculateBusEmissionFactorPerPassengerKm } from './vehicle-occupancy.ts'

// Source : élément neutre de la multiplication
const ONE: BigNumber = toBig('1')

function calculatePublicTransportEmissionFactor({
  busEmissionFactor,
  railShare,
  railEmissionFactor,
}: {
  busEmissionFactor: KgCo2ePerVehicleKilometre
  railShare: Fraction
  railEmissionFactor: KgCo2ePerPassengerKilometre
}): BigNumber {
  const roadShare = ONE.minus(railShare)
  const busEmissionFactorPerPassengerKm = calculateBusEmissionFactorPerPassengerKm(busEmissionFactor)
  const railContribution = railShare.times(railEmissionFactor)
  const roadContribution = roadShare.times(busEmissionFactorPerPassengerKm)
  return railContribution.plus(roadContribution)
}

export { calculatePublicTransportEmissionFactor }
