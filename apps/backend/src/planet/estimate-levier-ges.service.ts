import { Inject, Injectable, Logger } from '@nestjs/common';
import type { EstimateUntrustedRequest, EstimationError } from 'leviers-ges';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { EstimateLevierGesRequest } from './estimate-levier-ges.request';
import type { EstimateLevierGesResponse } from './estimate-levier-ges.response';
import { LEVIERS_GES_ESTIMATOR } from './leviers-ges-estimator.provider';
import { toEstimateLevierGesResponse } from './to-estimate-levier-ges-response';

@Injectable()
export class EstimateLevierGesService {
  private readonly logger = new Logger(EstimateLevierGesService.name);

  constructor(
    @Inject(LEVIERS_GES_ESTIMATOR)
    private readonly estimator: EstimateUntrustedRequest
  ) {}

  estimate(
    request: EstimateLevierGesRequest
  ): Result<EstimateLevierGesResponse, EstimationError> {
    return this.estimator(request).match<
      Result<EstimateLevierGesResponse, EstimationError>
    >(
      (estimate) => success(toEstimateLevierGesResponse(estimate)),
      (error) => {
        if (error.kind === 'invalid_dataset') {
          this.logger.error(
            `Jeu de données invalide ${error.dataset} (${error.reason}): ${error.detail}`
          );
        }
        return failure(error);
      }
    );
  }
}
