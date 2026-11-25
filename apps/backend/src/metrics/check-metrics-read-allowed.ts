import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import {
  metricsReadOperation,
  toMetricsReadDeniedFailure,
} from './metrics.errors';

export const checkMetricsReadAllowed = async ({
  permissionService,
  user,
  collectiviteId,
}: {
  permissionService: PermissionService;
  user: AuthUser;
  collectiviteId: number;
}): Promise<Result<void, 'UNAUTHORIZED'>> => {
  const permission = await permissionService.isAllowed(
    user,
    metricsReadOperation,
    ResourceType.COLLECTIVITE,
    { collectiviteId }
  );
  if (permission.success) return success(undefined);
  return toMetricsReadDeniedFailure({
    userId: user.id,
    collectiviteId,
    isApiKeyDenied: !permissionService.isApiKeyAllowed(
      user,
      metricsReadOperation
    ).success,
  });
};
