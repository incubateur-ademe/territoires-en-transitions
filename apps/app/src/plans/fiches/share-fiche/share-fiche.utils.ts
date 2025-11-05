import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { FicheResume } from '@/domain/plans';
import { CollectiviteAccess } from '@/domain/users';

export function isFicheSharedWithCollectivite(
  fiche: FicheResume,
  collectiviteId: number
) {
  return fiche.sharedWithCollectivites?.some(
    (sharing) => sharing.id === collectiviteId
  );
}

export function isFicheEditableByCollectivite(
  fiche: FicheResume,
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
export function getFicheAllEditorCollectiviteIds(fiche: FicheResume) {
  return [
    fiche.collectiviteId,
    ...(fiche.sharedWithCollectivites?.map((s) => s.id) || []),
  ];
}
