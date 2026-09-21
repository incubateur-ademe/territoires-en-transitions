import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const AnalysisJobSpecificErrors = [
  'CREATE_JOB_ERROR',
  'GET_JOB_ERROR',
  'UPDATE_JOB_ERROR',
  'JOB_NOT_FOUND',
  'JOB_TRANSITION_REFUSED',
  'IN_FLIGHT_JOB_EXISTS',
  'COLLECTIVITE_NOT_FOUND',
  'NO_FICHE_TO_CLASSIFY',
  'GET_MOBILISATION_ERROR',
] as const;

export type AnalysisJobSpecificError =
  (typeof AnalysisJobSpecificErrors)[number];

export const AnalysisJobErrorEnum = createErrorsEnum(AnalysisJobSpecificErrors);

export type AnalysisJobError = keyof typeof AnalysisJobErrorEnum;
