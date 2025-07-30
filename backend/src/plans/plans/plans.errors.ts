export const PlanErrorType = {
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type PlanErrorType = (typeof PlanErrorType)[keyof typeof PlanErrorType];

export type PlanError = PlanErrorType;
