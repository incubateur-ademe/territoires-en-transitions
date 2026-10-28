import { hasPermission } from '../../users/authorizations/user-permission.rules';
import type { UserRolesAndPermissions } from '../../users/authorizations/user-roles-and-permissions.schema';
import type { CollectiviteType } from '../collectivite-type.enum';
import { isPriorisationAvailable } from './is-priorisation-available';

// Droit d'ouvrir la page, quel que soit le type de collectivité : une
// collectivité non EPCI y voit qu'elle est réservée aux EPCI.
export const hasPriorisationReadPermission = (
  user: UserRolesAndPermissions | null,
  {
    collectiviteId,
    collectiviteAccesRestreint,
  }: {
    collectiviteId: number;
    collectiviteAccesRestreint: boolean;
  }
): boolean => {
  const canReadCollectivite =
    !collectiviteAccesRestreint ||
    hasPermission(user, 'collectivites.read_confidentiel', { collectiviteId });

  return (
    canReadCollectivite &&
    hasPermission(user, 'collectivites.priorisation.read', { collectiviteId })
  );
};

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
): boolean =>
  isPriorisationAvailable(collectiviteType) &&
  hasPriorisationReadPermission(user, {
    collectiviteId,
    collectiviteAccesRestreint,
  });
