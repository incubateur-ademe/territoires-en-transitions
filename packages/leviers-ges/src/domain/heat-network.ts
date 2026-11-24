import type { KgCo2ePerKwh, MegawattHours } from './units.ts'

type HeatNetwork = {
  readonly deliveredMwh: MegawattHours
  readonly emissionFactor: KgCo2ePerKwh
}

export type { HeatNetwork }
