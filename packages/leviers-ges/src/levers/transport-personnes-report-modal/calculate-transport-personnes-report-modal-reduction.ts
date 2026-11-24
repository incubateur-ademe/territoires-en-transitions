import { sum } from '../../domain/big-number.ts'
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
import { calculatePublicTransportEmissionFactor } from '../../domain/public-transport-emission-factor.ts'
import { calculateCarEmissionFactorPerPassengerKm } from '../../domain/vehicle-occupancy.ts'

type ReportModalFractions = {
  readonly carToPublicTransport: Fraction
  readonly carToActiveModes: Fraction
  readonly publicTransportToActiveModes: Fraction
}

type ReportModalFlows = {
  readonly carWeeklyPassengerKm: PassengerKilometresPerWeek
  readonly publicTransportWeeklyPassengerKm: PassengerKilometresPerWeek
  readonly carEmissionFactor: KgCo2ePerVehicleKilometre
  readonly busEmissionFactor: KgCo2ePerVehicleKilometre
}

function calculateTransportPersonnesReportModalReduction({
  fractions,
  railShare,
  railEmissionFactor,
  flows,
}: {
  fractions: ReportModalFractions
  railShare: Fraction
  railEmissionFactor: KgCo2ePerPassengerKilometre
  flows: ReportModalFlows
}): TonnesCo2ePerYear {
  const carEmissionFactorPerPassengerKm = calculateCarEmissionFactorPerPassengerKm(
    flows.carEmissionFactor,
  )
  const publicTransportEmissionFactor = calculatePublicTransportEmissionFactor({
    busEmissionFactor: flows.busEmissionFactor,
    railShare,
    railEmissionFactor,
  })
  const gainToPublicTransport = carEmissionFactorPerPassengerKm.minus(publicTransportEmissionFactor)
  const publicTransportAvoidedPerPassengerKm =
    fractions.carToPublicTransport.times(gainToPublicTransport)
  const activeModesAvoidedPerPassengerKm =
    fractions.carToActiveModes.times(carEmissionFactorPerPassengerKm)
  const avoidedPerPassengerKm = sum([
    publicTransportAvoidedPerPassengerKm,
    activeModesAvoidedPerPassengerKm,
  ])
  const annualPassengerKm = flows.carWeeklyPassengerKm.times(WEEKS_PER_YEAR)
  const carShiftAvoidedEmissionsKg = annualPassengerKm.times(avoidedPerPassengerKm)
  const annualPublicTransportPassengerKm = flows.publicTransportWeeklyPassengerKm.times(WEEKS_PER_YEAR)
  const shiftedPublicTransportPassengerKm = annualPublicTransportPassengerKm.times(
    fractions.publicTransportToActiveModes,
  )
  const publicTransportShiftAvoidedEmissionsKg = shiftedPublicTransportPassengerKm.times(
    publicTransportEmissionFactor,
  )
  const avoidedEmissionsKg = sum([carShiftAvoidedEmissionsKg, publicTransportShiftAvoidedEmissionsKg])
  return quantity<'TonnesCo2ePerYear'>(avoidedEmissionsKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed())
}

export { calculateTransportPersonnesReportModalReduction }
export type { ReportModalFlows, ReportModalFractions }
