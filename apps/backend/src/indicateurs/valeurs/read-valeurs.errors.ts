import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';

export type ReadValeursError = Extract<
  CommonError,
  'UNAUTHORIZED' | 'NOT_FOUND' | 'DATABASE_ERROR'
>;

export const readValeursErrorConfig: TrpcErrorHandlerConfig<never> = {
  commonErrors: {
    UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
    NOT_FOUND: { code: 'NOT_FOUND', messageFromCause: true },
    DATABASE_ERROR: { code: 'INTERNAL_SERVER_ERROR', messageFromCause: true },
  },
};
