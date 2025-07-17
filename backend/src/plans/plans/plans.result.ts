import { PlanError } from './plans.errors';

export type Result<T, E = PlanError> =
  | { success: true; data: T }
  | { success: false; error: E };
