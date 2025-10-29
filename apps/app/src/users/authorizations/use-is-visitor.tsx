'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import { CollectiviteAccessLevel } from '@/domain/users';

export const getIsVisitor = ({
  niveauAcces,
  isSupport,
  isAuditeur,
}: {
  niveauAcces: CollectiviteAccessLevel | null;
  isSupport: boolean;
  isAuditeur: boolean;
}) => niveauAcces === null && !isSupport && !isAuditeur;

/**
 * Hook to determine if the current user is in visitor mode
 * A user is a visitor if they have no access level to the collectivite
 * and they are neither support nor auditor
 */
export const useIsVisitor = () => {
  const collectivite = useCurrentCollectivite();
  const user = useUser();

  return getIsVisitor({
    niveauAcces: collectivite.niveauAcces,
    isSupport: user.isSupport,
    isAuditeur: collectivite.isRoleAuditeur,
  });
};
