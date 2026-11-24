import type { MegawattHours } from '../../../domain/units.ts'

type AgriculturalConsumption = {
  readonly electricity: MegawattHours
  readonly naturalGas: MegawattHours
  readonly petroleumProducts: MegawattHours
  readonly heat: MegawattHours
}

export type { AgriculturalConsumption }
