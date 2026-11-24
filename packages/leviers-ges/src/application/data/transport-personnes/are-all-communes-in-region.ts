import { Result } from 'neverthrow'
import type { DataSourceError } from '../../../domain/data-source.ts'
import type { RegionLookup } from '../../estimate/estimation-context.ts'

function areAllCommunesInRegion({
  communes,
  regionCode,
  getRegionByCommune,
}: {
  communes: readonly string[]
  regionCode: string
  getRegionByCommune: RegionLookup
}): Result<boolean, DataSourceError> {
  return Result.combine(communes.map(getRegionByCommune)).map(
    (regions) => regions.length > 0 && regions.every((region) => region === regionCode),
  )
}

export { areAllCommunesInRegion }
