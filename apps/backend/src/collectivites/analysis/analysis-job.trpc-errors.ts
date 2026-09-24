import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { AnalysisJobSpecificError } from './analysis-job.errors';

export const analysisJobErrorConfig: TrpcErrorHandlerConfig<AnalysisJobSpecificError> =
  {
    specificErrors: {
      COLLECTIVITE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La collectivité demandée n'existe pas",
      },
      GET_MOBILISATION_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La lecture de la mobilisation a échoué',
      },
    },
  };
