import { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import { calculateProduitsBoisStorage } from './calculate-produits-bois-storage.ts'
import { readNationalWood } from './data/read-national-wood.ts'
import { readTerritoryWoodProduction } from './data/read-territory-wood-production.ts'
import type { ProduitsBoisRequest } from './produits-bois-request.ts'

function estimate(
  { territory, parameters }: ProduitsBoisRequest,
  { dataSource }: EstimationContext,
): Result<EstimateResult, DataSourceError> {
  return Result.combine([
    readTerritoryWoodProduction({ dataSource, territory }),
    readNationalWood(dataSource),
  ]).map(([territoryProduction, { production: nationalProduction, productsCarbon }]) =>
    toEstimateResult(
      calculateProduitsBoisStorage({
        woodProductionIncrease: parameters.woodProductionIncrease,
        territoryProduction,
        nationalProduction,
        productsCarbon,
      }),
    ),
  )
}

export { estimate }
