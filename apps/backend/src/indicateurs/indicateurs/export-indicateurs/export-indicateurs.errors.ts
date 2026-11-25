import { failure, Result } from '@tet/backend/utils/result.type';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import { ListIndicateursError } from '../list-indicateurs/list-indicateurs.errors';

export type ExportIndicateursError =
  | ListIndicateursError
  | 'EXPORT_TOO_LARGE'
  | 'NOT_FOUND';

export const exportIndicateursErrorConfig: TrpcErrorHandlerConfig<
  'INDICATEUR_NOT_FOUND' | 'EXPORT_TOO_LARGE'
> = {
  commonErrors: {
    UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
    DATABASE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      messageFromCause: true,
    },
    NOT_FOUND: { code: 'NOT_FOUND', messageFromCause: true },
  },
  specificErrors: {
    INDICATEUR_NOT_FOUND: { code: 'BAD_REQUEST', messageFromCause: true },
    EXPORT_TOO_LARGE: { code: 'PAYLOAD_TOO_LARGE', messageFromCause: true },
  },
};

export const toExportTooLargeFailure = (
  maxExportCount: number
): Result<never, 'EXPORT_TOO_LARGE'> =>
  failure(
    'EXPORT_TOO_LARGE',
    new Error(
      `L'export dépasse la limite technique de ${maxExportCount} indicateurs`
    )
  );
