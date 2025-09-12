import { useCurrentCollectivite } from '@/api/collectivites';
import { PermissionLevelEnum } from '@/domain/users';

export const useIsEditeur = () => {
  const collectivite = useCurrentCollectivite();

  return collectivite.niveauAcces === PermissionLevelEnum.EDITION;
};
