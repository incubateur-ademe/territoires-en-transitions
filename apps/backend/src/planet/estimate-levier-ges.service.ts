import { Inject, Injectable, Logger } from '@nestjs/common';
import { success, Result } from '@tet/backend/utils/result.type';
import type { EstimateUntrustedRequest } from 'ademe-planet';
import type { EstimateLevierGesRequest } from './estimate-levier-ges.request';
import type { EstimateLevierGesResponse } from './estimate-levier-ges.response';
import {
  LevierGesError,
  logInvalidDataset,
  toLevierGesFailure,
} from './levier-ges.errors';
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
  ): Result<EstimateLevierGesResponse, LevierGesError> {
    return this.estimator(request).match<
      Result<EstimateLevierGesResponse, LevierGesError>
    >(
      (estimate) => success(toEstimateLevierGesResponse(estimate)),
      (error) => {
        logInvalidDataset(this.logger, error);
        return toLevierGesFailure(error);
      }
    );
  }
}
