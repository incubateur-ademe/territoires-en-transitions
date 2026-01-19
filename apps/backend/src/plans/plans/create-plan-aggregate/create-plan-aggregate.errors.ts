/**
 * Plan Domain Errors
 *
 * Erreurs métier typées pour le domaine PlanAggregate.
 * Ces erreurs représentent des violations de règles métier,
 * pas des erreurs techniques ou d'infrastructure.
 */

export const CreatePlanAggregateError = {
  INCOHERENT_PLAN_AGGREGATE: 'INCOHERENT_PLAN_AGGREGATE',
  ORPHANED_FICHES: 'ORPHANED_FICHES',
  INVALID_AXE_HIERARCHY: 'INVALID_AXE_HIERARCHY',
  INVALID_PLAN_DATA: 'INVALID_PLAN_DATA',
  INVALID_PLAN_NAME: 'INVALID_PLAN_NAME',
} as const;

export type CreatePlanAggregateErrorType =
  (typeof CreatePlanAggregateError)[keyof typeof CreatePlanAggregateError];
