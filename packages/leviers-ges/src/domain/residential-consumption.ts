import type { MegawattHours } from './units.ts'

type ResidentialConsumption = {
  readonly electricity: MegawattHours
  readonly naturalGas: MegawattHours
  readonly fuelOil: MegawattHours
  readonly liquefiedPetroleumGas: MegawattHours
  readonly heat: MegawattHours
}

export type { ResidentialConsumption }
