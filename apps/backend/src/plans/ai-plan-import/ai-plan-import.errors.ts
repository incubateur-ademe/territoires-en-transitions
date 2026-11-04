import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';
import { planCreationDisabledReasons } from '@tet/domain/plans';

export const AiPlanImportSpecificErrors = [
  ...planCreationDisabledReasons,
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
  'UNKNOWN_IMPORT_PROFILE',
  'IMPORT_PROFILE_UNAVAILABLE',
  'UNSUPPORTED_IMPORT_CONTRACT',
  'INVALID_CHECKPOINT',
  'STORAGE_ERROR',
  'CREATE_PLAN_ERROR',
  'ALREADY_IMPORTED',
  'JOB_NOT_RESUMABLE',
  'UNAUTHORIZED',
] as const;

export type AiPlanImportSpecificError =
  (typeof AiPlanImportSpecificErrors)[number];

/** Messages partagés entre les réponses API et les échecs persistés des jobs. */
export const aiPlanImportErrorMessages = {
  UNSUPPORTED_IMPORT_CONTRACT:
    "Ce profil ou cette version d'import n'est pas pris en charge",
  INVALID_CHECKPOINT:
    'Le point de reprise de cet import est invalide ou incompatible',
} as const satisfies Partial<Record<AiPlanImportSpecificError, string>>;

export const AiPlanImportErrorEnum = createErrorsEnum(
  AiPlanImportSpecificErrors
);

export type AiPlanImportError = keyof typeof AiPlanImportErrorEnum;
