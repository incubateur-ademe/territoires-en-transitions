import type { DataSource } from '../../domain/data-source.ts'
import { createTerritoryIndexProvider } from '../territory-index/create-territory-index-provider.ts'
import type { EstimationContext } from './estimation-context.ts'

function createEstimationContext(dataSource: DataSource): EstimationContext {
  const getTerritoryIndex = createTerritoryIndexProvider(dataSource)
  return {
    dataSource,
    getCommunesOf: (territory) =>
      getTerritoryIndex().andThen((index) => index.communesOf(territory)),
    getRegionByCommune: (commune) => getTerritoryIndex().map((index) => index.regionOf(commune)),
    getDepartementByCommune: (commune) =>
      getTerritoryIndex().map((index) => index.departementOf(commune)),
  }
}

export { createEstimationContext }
