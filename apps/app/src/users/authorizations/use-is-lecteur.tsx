import { useCurrentCollectivite } from '@/api/collectivites';
import { PermissionLevelEnum } from '@/domain/users';

export const useIsLecteur = () => {
  const collectivite = useCurrentCollectivite();

  return collectivite.niveauAcces === PermissionLevelEnum.LECTURE;
};
