import type { Provider } from '@nestjs/common';
import { createDefaultEstimator } from 'ademe-planet';

export const LEVIERS_GES_ESTIMATOR = Symbol('LEVIERS_GES_ESTIMATOR');

export const leviersGesEstimatorProvider: Provider = {
  provide: LEVIERS_GES_ESTIMATOR,
  useFactory: createDefaultEstimator,
};
