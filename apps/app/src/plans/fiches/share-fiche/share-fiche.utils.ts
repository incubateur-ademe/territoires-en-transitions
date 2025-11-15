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
  currentCollectivite: CollectiviteAccess
) {
  return (
    !currentCollectivite.isReadOnly &&
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
