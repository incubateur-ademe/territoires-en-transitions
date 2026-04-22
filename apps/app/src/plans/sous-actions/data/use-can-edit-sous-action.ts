import { useGetFiche } from '@/app/plans/fiches/data/use-get-fiche';
import { isFicheEditableByCollectiviteUser } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useUser } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';

/**
 * Une sous-action est éditable par l'utilisateur s'il peut éditer la fiche
 * parente (cas du contributeur pilote de la fiche parente) ou s'il peut
 * éditer la sous-action elle-même (permission directe ou rôle de pilote sur
 * la sous-action).
 */
export const useCanEditSousAction = (sousAction: FicheWithRelations) => {
  const collectivite = useCurrentCollectivite();
  const { id: userId } = useUser();

  const { data: parentFiche } = useGetFiche({
    id: sousAction.parentId ?? 0,
    enabled: sousAction.parentId != null,
  });

  const canEditParent =
    !!parentFiche &&
    isFicheEditableByCollectiviteUser(parentFiche, collectivite, userId);

  return (
    canEditParent ||
    isFicheEditableByCollectiviteUser(sousAction, collectivite, userId)
  );
};
