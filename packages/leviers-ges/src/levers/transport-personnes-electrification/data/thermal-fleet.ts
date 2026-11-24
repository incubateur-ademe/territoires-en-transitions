import type { Fraction, KgCo2ePerVehicleKilometre } from '../../../domain/units.ts'

type ThermalFleet = {
  readonly carThermalEmissionFactor: KgCo2ePerVehicleKilometre
  readonly busThermalEmissionFactor: KgCo2ePerVehicleKilometre
  readonly carThermalFleetShare: Fraction
  readonly busThermalFleetShare: Fraction
}

export type { ThermalFleet }
