import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { FicheResume } from '@/domain/plans';
import { CollectiviteAccess } from '@/domain/users';

export function isFicheSharedWithCollectivite(
  fiche: Pick<FicheResume, 'sharedWithCollectivites'>,
  collectiviteId: number
) {
  return fiche.sharedWithCollectivites?.some(
    (sharing) => sharing.id === collectiviteId
  );
}

export function isFicheEditableByCollectiviteUser(
  fiche: FicheShareProperties & Pick<FicheResume, 'pilotes'>,
  currentCollectivite: CollectiviteAccess,
  userId?: string
) {
  return (
    !currentCollectivite.isReadOnly &&
    (hasPermission(currentCollectivite.permissions, 'plans.fiches.update') ||
      (userId &&
        hasPermission(
          currentCollectivite.permissions,
          'plans.fiches.update_piloted_by_me'
        ) &&
        fiche.pilotes?.some((pilote) => pilote.userId === userId))) &&
    (fiche.collectiviteId === currentCollectivite.collectiviteId ||
      isFicheSharedWithCollectivite(fiche, currentCollectivite.collectiviteId))
  );
}

/**
 * Retourne la liste de toutes les collectivités avec lesquelles la fiche est partagée
 * @param fiche
 * @returns
 */
export function getFicheAllEditorCollectiviteIds(fiche: FicheShareProperties) {
  return [
    fiche.collectiviteId,
    ...(fiche.sharedWithCollectivites?.map((s) => s.id) || []),
  ];
}
