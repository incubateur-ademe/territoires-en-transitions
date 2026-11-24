import { err, ok, type Result } from 'neverthrow'
import type { Level, Territory } from './territory.ts'

type Commune = {
  readonly code: string
  readonly epci: string | undefined
  readonly departement: string
  readonly region: string
}

type UnknownTerritory = {
  readonly kind: 'unknown_territory'
  readonly level: Level
  readonly code: string
}

interface TerritoryIndex {
  communesOf(territory: Territory<Level>): Result<readonly string[], UnknownTerritory>
  departementsOf(epci: Territory<'epci'>): Result<readonly string[], UnknownTerritory>
  regionOf(commune: string): string | undefined
  departementOf(commune: string): string | undefined
}

type CommunesByCode = ReadonlyMap<string, readonly Commune[]>

function unknownTerritory({ level, code }: Pick<UnknownTerritory, 'level' | 'code'>): UnknownTerritory {
  return { kind: 'unknown_territory', level, code }
}

function hasEpci(commune: Commune): commune is Commune & { readonly epci: string } {
  return commune.epci !== undefined
}

function buildTerritoryIndex(communes: readonly Commune[]): TerritoryIndex {
  const communesByLevel: Record<Level, CommunesByCode> = {
    region: Map.groupBy(communes, (commune) => commune.region),
    departement: Map.groupBy(communes, (commune) => commune.departement),
    epci: Map.groupBy(communes.filter(hasEpci), (commune) => commune.epci),
  }

  const regionByCommune = new Map(communes.map((commune) => [commune.code, commune.region]))
  const departementByCommune = new Map(
    communes.map((commune) => [commune.code, commune.departement]),
  )

  function communesInTerritory({
    level,
    code,
  }: Pick<Territory<Level>, 'level' | 'code'>): Result<readonly Commune[], UnknownTerritory> {
    const found = communesByLevel[level].get(code)
    return found === undefined ? err(unknownTerritory({ level, code })) : ok(found)
  }

  return {
    communesOf: (territory) =>
      communesInTerritory(territory).map((found) => found.map((commune) => commune.code).toSorted()),
    departementsOf: (epci) =>
      communesInTerritory(epci).map((found) =>
        [...new Set(found.map((commune) => commune.departement))].toSorted(),
      ),
    regionOf: (commune) => regionByCommune.get(commune),
    departementOf: (commune) => departementByCommune.get(commune),
  }
}

export { buildTerritoryIndex }
export type { Commune, TerritoryIndex, UnknownTerritory }
