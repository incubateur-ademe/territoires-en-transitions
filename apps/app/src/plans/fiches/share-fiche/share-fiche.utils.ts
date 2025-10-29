import { CollectiviteAccess } from '@/domain/users';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheResume } from '@/domain/plans';

export function isFicheSharedWithCollectivite(
  fiche: Pick<FicheResume, 'sharedWithCollectivites'>,
  collectiviteId: number
) {
  return fiche.sharedWithCollectivites?.some(
    (sharing) => sharing.id === collectiviteId
  );
}

export function isFicheEditableByCollectivite(
  fiche: FicheShareProperties,
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
export function getFicheAllEditorCollectiviteIds(fiche: FicheShareProperties) {
  return [
    fiche.collectiviteId,
    ...(fiche.sharedWithCollectivites?.map((s) => s.id) || []),
  ];
}
