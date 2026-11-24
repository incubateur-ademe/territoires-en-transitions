import { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import { readHeatEmissionFactor } from '../../application/heat-networks/read-heat-emission-factor.ts'
import { reseauxChaleurNetworksDataset } from '../../application/heat-networks/read-heat-networks.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import type { BatimentsMachinesAgricolesRequest } from './batiments-machines-agricoles-request.ts'
import { calculateBatimentsMachinesAgricolesReduction } from './calculate-batiments-machines-agricoles-reduction.ts'
import { getAgriculturalConsumption } from './data/get-agricultural-consumption.ts'

function estimate(
  { territory, parameters }: BatimentsMachinesAgricolesRequest,
  { dataSource, getCommunesOf, getRegionByCommune }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return getCommunesOf(territory).andThen((communes) =>
    Result.combine([
      getAgriculturalConsumption({ dataSource, territory, communes, getRegionByCommune }),
      readHeatEmissionFactor({
        dataSource,
        dataset: reseauxChaleurNetworksDataset,
        communes,
      }),
    ]).map(([consumption, heatEmissionFactor]) =>
      toEstimateResult(
        calculateBatimentsMachinesAgricolesReduction({
          reductionFractions: {
            electricity: parameters.electricityReductionFraction,
            naturalGas: parameters.naturalGasReductionFraction,
            petroleumProducts: parameters.petroleumProductsReductionFraction,
            heat: parameters.heatReductionFraction,
          },
          consumption,
          heatEmissionFactor,
        }),
      ),
    ),
  )
}

export { estimate }
