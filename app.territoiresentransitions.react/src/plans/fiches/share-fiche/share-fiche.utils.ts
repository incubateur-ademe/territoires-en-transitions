import { CurrentCollectivite } from '@/api/collectivites/use-get-current-collectivite';
import { FicheResume } from '@/domain/plans/fiches';

export function isFicheSharedWithCollectivite(
  fiche: Pick<FicheResume, 'sharedWithCollectivites'>,
  collectiviteId: number
) {
  return Boolean(
    fiche.sharedWithCollectivites?.find(
      (sharing) => sharing.id === collectiviteId
    )
  );
}

export function isFicheEditableByCollectivite(
  fiche: Pick<FicheResume, 'collectiviteId' | 'sharedWithCollectivites'>,
  currentCollectivite: CurrentCollectivite
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
export function getFicheAllEditorCollectiviteIds(
  fiche: Pick<FicheResume, 'collectiviteId' | 'sharedWithCollectivites'>
) {
  return [
    fiche.collectiviteId,
    ...(fiche.sharedWithCollectivites?.map((s) => s.id) || []),
  ];
}
