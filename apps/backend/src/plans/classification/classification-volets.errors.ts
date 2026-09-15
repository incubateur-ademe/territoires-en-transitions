import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const ClassificationVoletsSpecificErrors = [
  'CREATE_JOB_ERROR',
  'GET_JOB_ERROR',
  'UPDATE_JOB_ERROR',
  'JOB_NOT_FOUND',
  'JOB_TRANSITION_REFUSED',
  'IN_FLIGHT_JOB_EXISTS',
  'COLLECTIVITE_NOT_FOUND',
  'NO_FICHE_TO_CLASSIFY',
  'NO_VOLET_TO_SCORE',
] as const;

export type ClassificationVoletsSpecificError =
  (typeof ClassificationVoletsSpecificErrors)[number];

export const ClassificationVoletsErrorEnum = createErrorsEnum(
  ClassificationVoletsSpecificErrors
);

export type ClassificationVoletsError =
  keyof typeof ClassificationVoletsErrorEnum;
