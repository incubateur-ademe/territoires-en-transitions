import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const AiPlanImportSpecificErrors = [
  'CREATE_JOB_ERROR',
  'GET_JOB_ERROR',
  'UPDATE_JOB_ERROR',
  'JOB_NOT_FOUND',
  'IN_FLIGHT_JOB_EXISTS',
  'TOO_MANY_IN_FLIGHT_JOBS',
  'UNSUPPORTED_FILE_TYPE',
  'FILE_TOO_LARGE',
  'UNKNOWN_PLAN_TYPE',
  'STORAGE_ERROR',
  'UNAUTHORIZED',
] as const;

export type AiPlanImportSpecificError =
  (typeof AiPlanImportSpecificErrors)[number];

export const AiPlanImportErrorEnum = createErrorsEnum(AiPlanImportSpecificErrors);

export type AiPlanImportError = keyof typeof AiPlanImportErrorEnum;
