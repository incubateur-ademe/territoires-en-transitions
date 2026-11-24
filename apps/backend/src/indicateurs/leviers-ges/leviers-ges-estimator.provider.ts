import type { Provider } from '@nestjs/common';
import {
  createCsvDataSource,
  createEstimator,
  type Estimator,
} from 'leviers-ges';
import { dirname, join } from 'node:path';

export const LEVIERS_GES_ESTIMATOR = Symbol('LEVIERS_GES_ESTIMATOR');

/**
 * Les jeux de données (CSV) sont embarqués dans le package `leviers-ges`,
 * à côté de son `package.json`.
 */
const resolveDataDirectory = (): string =>
  join(dirname(require.resolve('leviers-ges/package.json')), 'data');

/**
 * L'estimator est un singleton : la source CSV charge ses jeux de données
 * paresseusement puis les garde en mémoire.
 */
export const leviersGesEstimatorProvider: Provider<Estimator> = {
  provide: LEVIERS_GES_ESTIMATOR,
  useFactory: () => createEstimator(createCsvDataSource(resolveDataDirectory())),
};
