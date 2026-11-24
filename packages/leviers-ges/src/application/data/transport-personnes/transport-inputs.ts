import type {
  Fraction,
  KgCo2ePerVehicleKilometre,
  PassengerKilometresPerWeek,
  Vehicles,
} from '../../../domain/units.ts'

type TransportInputs = {
  readonly carWeeklyPassengerKm: PassengerKilometresPerWeek
  readonly publicTransportWeeklyPassengerKm: PassengerKilometresPerWeek
  readonly carEmissionFactor: KgCo2ePerVehicleKilometre
  readonly busEmissionFactor: KgCo2ePerVehicleKilometre
  readonly carFleetUnclassifiedShare: Fraction
  readonly busFleetUnclassifiedShare: Fraction
  readonly carFleetClassified: Vehicles
  readonly busFleetClassified: Vehicles
}

export type { TransportInputs }
