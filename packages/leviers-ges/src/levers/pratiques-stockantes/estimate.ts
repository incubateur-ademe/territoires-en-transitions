import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import { calculatePratiquesStockantesReduction } from './calculate-pratiques-stockantes-reduction.ts'
import type { PratiquesStockantesRequest } from './pratiques-stockantes-request.ts'

function estimate({ parameters }: PratiquesStockantesRequest): EstimateResult {
  return toEstimateResult(
    calculatePratiquesStockantesReduction({
      intermediateCrops: parameters.intermediateCropsHectares,
      permanentVineyardGrassing: parameters.permanentVineyardGrassingHectares,
      winterIntercropVineyard: parameters.winterIntercropVineyardHectares,
      agroforestry: parameters.agroforestryHectares,
      temporaryGrasslandExtension: parameters.temporaryGrasslandExtensionHectares,
    }),
    {
      applicationSurfaceBounds: {
        value: 'aucune : chaque surface est prise telle que saisie, à partir de 0 hectare',
        source:
          'Documentation fonctionnelle PlanET (juin 2026), p. 78 : aucune borne documentée pour la surface d’application d’une pratique stockante',
        limit:
          'La surface d’application maximale de chaque pratique dépend de la pratique (prairies, vergers, vignes ou cultures) et n’est pas définie : une saisie supérieure à la surface disponible dans le territoire n’est pas refusée',
      },
    },
  )
}

export { estimate }
