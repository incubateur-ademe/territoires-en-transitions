import { isFicheEditableByCollectiviteUser } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';

export const useCanEditAction = (action: FicheWithRelationsAndCollectivite) => {
  const collectivite = useCurrentCollectivite();
  const { id: userId } = useUser();

  return isFicheEditableByCollectiviteUser(action, collectivite, userId);
};
