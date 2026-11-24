import type {
  Fraction,
  KgCo2ePerVehicleKilometre,
  TonneKilometres,
  Vehicles,
} from '../../../domain/units.ts'

type GoodsTransportInputs = {
  readonly tonneKilometres: TonneKilometres
  readonly heavyVehicleFleet: Vehicles
  readonly zeroEmissionFleet: Vehicles
  readonly dieselEmissionFactor: KgCo2ePerVehicleKilometre
  readonly dieselUnclassifiedShare: Fraction
}

export type { GoodsTransportInputs }
