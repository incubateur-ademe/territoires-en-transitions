import type { IndicateurExpressionError } from '../indicateur-expression.errors';

export type ComputeValeursError =
  | IndicateurExpressionError
  | 'LOAD_CALCUL_GRAPH_FAILED'
  | 'COMPUTE_VALEURS_FAILED'
  | 'DATABASE_ERROR';
