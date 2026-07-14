import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['SNAPSHOT_LOAD_FAILED'] as const;
type SpecificError = (typeof specificErrors)[number];

export const getLabellisationErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      SNAPSHOT_LOAD_FAILED: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Impossible de récupérer le snapshot courant',
      },
    },
  };

export const GetLabellisationErrorEnum = createErrorsEnum(specificErrors);
export type GetLabellisationError = keyof typeof GetLabellisationErrorEnum;
