import type { Provider } from '@nestjs/common';
import { createDefaultEstimator } from 'leviers-ges';

export const LEVIERS_GES_ESTIMATOR = Symbol('LEVIERS_GES_ESTIMATOR');

/**
 * L'estimator est un singleton : ses jeux de données sont chargés
 * paresseusement puis gardés en mémoire.
 */
export const leviersGesEstimatorProvider: Provider = {
  provide: LEVIERS_GES_ESTIMATOR,
  useFactory: createDefaultEstimator,
};
