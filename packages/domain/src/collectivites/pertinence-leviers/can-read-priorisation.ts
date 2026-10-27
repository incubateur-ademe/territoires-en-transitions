import { hasPermission } from '../../users/authorizations/user-permission.rules';
import type { UserRolesAndPermissions } from '../../users/authorizations/user-roles-and-permissions.schema';
import type { CollectiviteType } from '../collectivite-type.enum';
import { isPriorisationAvailable } from './is-priorisation-available';

export const canReadPriorisation = (
  user: UserRolesAndPermissions | null,
  {
    collectiviteId,
    collectiviteType,
    collectiviteAccesRestreint,
  }: {
    collectiviteId: number;
    collectiviteType: CollectiviteType;
    collectiviteAccesRestreint: boolean;
  }
): boolean => {
  const canReadCollectivite =
    !collectiviteAccesRestreint ||
    hasPermission(user, 'collectivites.read_confidentiel', { collectiviteId });

  return (
    isPriorisationAvailable(collectiviteType) &&
    canReadCollectivite &&
    hasPermission(user, 'collectivites.priorisation.read', { collectiviteId })
  );
};
