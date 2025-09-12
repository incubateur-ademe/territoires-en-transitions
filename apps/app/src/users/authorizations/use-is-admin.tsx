import { useCurrentCollectivite } from '@/api/collectivites';
import { PermissionLevelEnum } from '@/domain/users';

export const useIsAdmin = () => {
  const collectivite = useCurrentCollectivite();

  return collectivite.niveauAcces === PermissionLevelEnum.ADMIN;
};
