import { Result } from 'neverthrow'
import type { RegionLookup } from '../../../application/estimate/estimation-context.ts'
import type { DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { Level, Territory } from '../../../domain/territory.ts'
import type { AgriculturalConsumption } from './agricultural-consumption.ts'
import {
  calculateApportionedRegionalEnergy,
  type RegionalPart,
} from './calculate-apportioned-regional-energy.ts'
import { calculateRegionalAreaShares } from './calculate-regional-area-shares.ts'
import { readLocalEnergy } from './read-local-energy.ts'
import { readLocatedAreas } from './read-located-areas.ts'
import {
  findRegionalConsumption,
  readRegionalEnergy,
  type RegionalEnergy,
} from './read-regional-energy.ts'

function toRegionalParts({
  shares,
  regionalEnergy,
}: {
  shares: ReadonlyMap<string, RegionalPart['share']>
  regionalEnergy: RegionalEnergy
}): Result<readonly RegionalPart[], DataSourceError> {
  return Result.combine(
    [...shares].map(([region, share]) =>
      findRegionalConsumption({ regionalEnergy, region }).map((regionalConsumption) => ({
        share,
        regionalConsumption,
      })),
    ),
  )
}

function getAgriculturalConsumption({
  dataSource,
  territory,
  communes,
  getRegionByCommune,
}: {
  dataSource: DataSource
  territory: Territory<Level>
  communes: readonly string[]
  getRegionByCommune: RegionLookup
}): Result<AgriculturalConsumption, DataSourceError> {
  return Result.combine([
    readRegionalEnergy(dataSource),
    readLocatedAreas({ dataSource, getRegionByCommune }),
  ]).andThen(([regionalEnergy, locatedAreas]) => {
    const shares = calculateRegionalAreaShares({
      areas: locatedAreas,
      territoryCommunes: new Set(communes),
    })
    return Result.combine([
      readLocalEnergy({ dataSource, territory, regionalEnergy }),
      toRegionalParts({ shares, regionalEnergy }).map(calculateApportionedRegionalEnergy),
    ]).map(([localEnergy, apportionedEnergy]) => ({ ...localEnergy, ...apportionedEnergy }))
  })
}

export { getAgriculturalConsumption }
