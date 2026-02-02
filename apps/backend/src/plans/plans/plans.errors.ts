import { CreatePlanAggregateErrorType } from "./create-plan-aggregate/create-plan-aggregate.errors";

export const PlanErrorType = {
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_DATA: 'INVALID_DATA',
} as const;

export type PlanErrorType = (typeof PlanErrorType)[keyof typeof PlanErrorType];

export type PlanError = PlanErrorType | CreatePlanAggregateErrorType;
