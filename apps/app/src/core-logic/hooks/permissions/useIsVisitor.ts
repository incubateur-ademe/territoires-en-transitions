'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';

/**
 * Hook to determine if the current user is in visitor mode
 * A user is a visitor if they have no access level to the collectivite
 * and they are neither support nor auditor
 */
export const useIsVisitor = () => {
  const collectivite = useCurrentCollectivite();
  const user = useUser();

  return (
    collectivite.niveauAcces === null &&
    !user?.isSupport &&
    !collectivite.isRoleAuditeur
  );
};
