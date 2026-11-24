import type { Result } from 'neverthrow'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import type { Level, Territory } from '../../domain/territory.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'

type RegionLookup = (commune: string) => Result<string | undefined, DataSourceError>

type DepartementLookup = (commune: string) => Result<string | undefined, DataSourceError>

type EstimationContext = {
  readonly dataSource: DataSource
  readonly getCommunesOf: (
    territory: Territory<Level>,
  ) => Result<readonly string[], DataSourceError | UnknownTerritory>
  readonly getRegionByCommune: RegionLookup
  readonly getDepartementByCommune: DepartementLookup
}

export type { DepartementLookup, EstimationContext, RegionLookup }
