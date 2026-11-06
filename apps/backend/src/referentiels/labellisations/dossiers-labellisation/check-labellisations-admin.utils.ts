import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import {
  DossiersLabellisationError,
  DossiersLabellisationErrorEnum,
} from './dossiers-labellisation.errors';

/** Garde commune à l'administration des dossiers : permission `labellisations.admin`. */
export const checkLabellisationsAdmin = async (
  permissionService: PermissionService,
  user: ServiceSecondArg['user']
): Promise<Result<void, DossiersLabellisationError>> => {
  const isAllowed = await permissionService.isAllowed(
    user,
    'labellisations.admin',
    ResourceType.PLATEFORME,
    null
  );
  return isAllowed.success
    ? success(undefined)
    : failure(DossiersLabellisationErrorEnum.UNAUTHORIZED);
};
