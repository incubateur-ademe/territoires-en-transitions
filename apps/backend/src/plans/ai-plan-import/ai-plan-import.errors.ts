import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const AiPlanImportSpecificErrors = [
  'CREATE_JOB_ERROR',
  'GET_JOB_ERROR',
  'UPDATE_JOB_ERROR',
  'JOB_NOT_FOUND',
  'IN_FLIGHT_JOB_EXISTS',
  'USER_IN_FLIGHT_JOB_EXISTS',
  'DAILY_QUOTA_EXCEEDED',
  'TOO_MANY_IN_FLIGHT_JOBS',
  'UNSUPPORTED_FILE_TYPE',
  'FILE_TOO_LARGE',
  'UNKNOWN_PLAN_TYPE',
  'STORAGE_ERROR',
  'CREATE_PLAN_ERROR',
  'ALREADY_IMPORTED',
  'UNAUTHORIZED',
] as const;

export type AiPlanImportSpecificError =
  (typeof AiPlanImportSpecificErrors)[number];

export const AiPlanImportErrorEnum = createErrorsEnum(AiPlanImportSpecificErrors);

export type AiPlanImportError = keyof typeof AiPlanImportErrorEnum;
