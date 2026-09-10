import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const ClassificationLeviersSpecificErrors = [
  'CREATE_JOB_ERROR',
  'GET_JOB_ERROR',
  'UPDATE_JOB_ERROR',
  'JOB_NOT_FOUND',
  'JOB_TRANSITION_REFUSED',
  'IN_FLIGHT_JOB_EXISTS',
  'PLAN_NOT_FOUND',
  'NOT_A_PLAN',
  'NO_FICHE_TO_CLASSIFY',
] as const;

export type ClassificationLeviersSpecificError =
  (typeof ClassificationLeviersSpecificErrors)[number];

export const ClassificationLeviersErrorEnum = createErrorsEnum(
  ClassificationLeviersSpecificErrors
);

export type ClassificationLeviersError =
  keyof typeof ClassificationLeviersErrorEnum;
