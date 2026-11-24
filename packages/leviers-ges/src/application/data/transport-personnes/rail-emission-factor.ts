import type { KgCo2ePerPassengerKilometre } from '../../../domain/units.ts'

type RailEmissionFactor = {
  readonly emissionFactor: KgCo2ePerPassengerKilometre
  readonly isCorsican: boolean
}

export type { RailEmissionFactor }
