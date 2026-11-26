import { Inject, Injectable, Logger } from '@nestjs/common';
import { success, Result } from '@tet/backend/utils/result.type';
import type { Solver } from 'ademe-planet';
import {
  LevierGesError,
  logInvalidDataset,
  toLevierGesFailure,
} from './levier-ges.errors';
import { LEVIERS_GES_SOLVER } from './leviers-ges-solver.provider';
import type { SolveLevierGesRequest } from './solve-levier-ges.request';
import type { SolveLevierGesResponse } from './solve-levier-ges.response';
import { toSolveLevierGesResponse } from './to-solve-levier-ges-response';

@Injectable()
export class SolveLevierGesService {
  private readonly logger = new Logger(SolveLevierGesService.name);

  constructor(
    @Inject(LEVIERS_GES_SOLVER)
    private readonly solver: Solver
  ) {}

  solve({
    solveFor,
    targetReductionTco2e,
    ...request
  }: SolveLevierGesRequest): Result<SolveLevierGesResponse, LevierGesError> {
    return this.solver({ request, solveFor, targetReductionTco2e }).match<
      Result<SolveLevierGesResponse, LevierGesError>
    >(
      (solution) => success(toSolveLevierGesResponse(solution)),
      (error) => {
        logInvalidDataset(this.logger, error);
        return toLevierGesFailure(error);
      }
    );
  }
}
