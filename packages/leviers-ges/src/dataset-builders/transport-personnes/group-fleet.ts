import { groupBy } from 'es-toolkit'
import type { FleetCounts } from './calculate-fleet-emission-factor.ts'
import type { FleetRow } from './read-fleet.ts'
import { toTerritoryKey } from './source-level.ts'

type FleetByTerritory = Readonly<Record<string, readonly FleetRow[]>>

function toFleetKey({ level, code, group }: Pick<FleetRow, 'level' | 'code' | 'group'>): string {
  return `${toTerritoryKey({ level, code })}|${group}`
}

function groupFleetByTerritory(fleet: readonly FleetRow[]): FleetByTerritory {
  return groupBy(fleet, toFleetKey)
}

function fleetCountsOf({
  fleetByTerritory,
  level,
  code,
  group,
}: {
  fleetByTerritory: FleetByTerritory
} & Pick<FleetRow, 'level' | 'code' | 'group'>): FleetCounts {
  const rows = fleetByTerritory[toFleetKey({ level, code, group })] ?? []
  return Object.fromEntries(rows.map(({ fuel, vehicles }) => [fuel, vehicles]))
}

export { fleetCountsOf, groupFleetByTerritory }
export type { FleetByTerritory }
