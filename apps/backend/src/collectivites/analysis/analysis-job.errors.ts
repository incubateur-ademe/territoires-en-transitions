import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const AnalysisJobSpecificErrors = [
  'COLLECTIVITE_NOT_FOUND',
  'GET_MOBILISATION_ERROR',
] as const;

export type AnalysisJobSpecificError =
  (typeof AnalysisJobSpecificErrors)[number];

export const AnalysisJobErrorEnum = createErrorsEnum(AnalysisJobSpecificErrors);

export type AnalysisJobError = keyof typeof AnalysisJobErrorEnum;
