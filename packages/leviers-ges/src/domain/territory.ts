import { z } from 'zod'

const levels = ['departement', 'epci', 'region'] as const

type Level = (typeof levels)[number]

const territoryCodeSchema = z.string().trim().min(1, 'must not be empty').brand<'TerritoryCode'>()

type TerritoryCode = z.output<typeof territoryCodeSchema>

type Territory<L extends Level> = {
  readonly level: L
  readonly code: TerritoryCode
}

export { levels, territoryCodeSchema }
export type { Level, Territory, TerritoryCode }
