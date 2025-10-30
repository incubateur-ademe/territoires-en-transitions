import { PlanCreationError } from './domain/plan.errors';

export const PlanErrorType = {
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_DATA: 'INVALID_DATA',
} as const;

export type PlanErrorType = (typeof PlanErrorType)[keyof typeof PlanErrorType];

export const isPlanError = (error: any): error is PlanErrorType => {
  return Object.values(PlanErrorType).includes(error);
};

/**
 * Plan Error peut être soit:
 * - Un code d'erreur simple (infrastructure/database)
 * - Une erreur de domaine riche avec cause et détails
 */
export type PlanError = PlanErrorType | PlanCreationError;
