import { toReadPermissionDeniedFailure } from '@tet/backend/indicateurs/indicateurs/list-indicateurs/list-indicateurs.errors';
import { Result } from '@tet/backend/utils/result.type';

export const metricsReadOperation = 'collectivites.read';

export const toMetricsReadDeniedFailure = ({
  userId,
  collectiviteId,
  isApiKeyDenied,
}: {
  userId: string | null;
  collectiviteId: number;
  isApiKeyDenied: boolean;
}): Result<never, 'UNAUTHORIZED'> =>
  toReadPermissionDeniedFailure({
    userId,
    collectiviteId,
    isApiKeyDenied,
    operation: metricsReadOperation,
  });
