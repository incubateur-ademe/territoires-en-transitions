import { sum } from '../../domain/big-number.ts'
import { calculatePublicTransportEmissionFactor } from '../../domain/public-transport-emission-factor.ts'
import { KILOGRAMS_PER_TONNE } from '../../domain/mass-conversions.ts'
import { WEEKS_PER_YEAR } from '../../domain/transport-conversions.ts'
import {
  quantity,
  type Fraction,
  type KgCo2ePerPassengerKilometre,
  type KgCo2ePerVehicleKilometre,
  type PassengerKilometresPerWeek,
  type TonnesCo2ePerYear,
} from '../../domain/units.ts'
import { calculateCarEmissionFactorPerPassengerKm } from '../../domain/vehicle-occupancy.ts'

type SobrieteFlows = {
  readonly carWeeklyPassengerKm: PassengerKilometresPerWeek
  readonly publicTransportWeeklyPassengerKm: PassengerKilometresPerWeek
  readonly carEmissionFactor: KgCo2ePerVehicleKilometre
  readonly busEmissionFactor: KgCo2ePerVehicleKilometre
}

function calculateTransportPersonnesSobrieteDeplacementsReduction({
  distanceReduction,
  railShare,
  railEmissionFactor,
  flows,
}: {
  distanceReduction: Fraction
  railShare: Fraction
  railEmissionFactor: KgCo2ePerPassengerKilometre
  flows: SobrieteFlows
}): TonnesCo2ePerYear {
  const carEmissionFactorPerPassengerKm = calculateCarEmissionFactorPerPassengerKm(
    flows.carEmissionFactor,
  )
  const publicTransportEmissionFactor = calculatePublicTransportEmissionFactor({
    busEmissionFactor: flows.busEmissionFactor,
    railShare,
    railEmissionFactor,
  })
  const carWeeklyEmissions = flows.carWeeklyPassengerKm.times(carEmissionFactorPerPassengerKm)
  const publicTransportWeeklyEmissions = flows.publicTransportWeeklyPassengerKm.times(
    publicTransportEmissionFactor,
  )
  const weeklyEmissionsKg = sum([carWeeklyEmissions, publicTransportWeeklyEmissions])
  const annualEmissionsKg = weeklyEmissionsKg.times(WEEKS_PER_YEAR)
  const avoidedEmissionsKg = annualEmissionsKg.times(distanceReduction)
  return quantity<'TonnesCo2ePerYear'>(avoidedEmissionsKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed())
}

export { calculateTransportPersonnesSobrieteDeplacementsReduction }
export type { SobrieteFlows }
