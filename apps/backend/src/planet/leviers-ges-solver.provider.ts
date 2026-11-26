import type { Provider } from '@nestjs/common';
import { createSolver, type EstimateUntrustedRequest } from 'ademe-planet';
import { LEVIERS_GES_ESTIMATOR } from './leviers-ges-estimator.provider';

export const LEVIERS_GES_SOLVER = Symbol('LEVIERS_GES_SOLVER');

export const leviersGesSolverProvider: Provider = {
  provide: LEVIERS_GES_SOLVER,
  inject: [LEVIERS_GES_ESTIMATOR],
  useFactory: (estimator: EstimateUntrustedRequest) => createSolver(estimator),
};
