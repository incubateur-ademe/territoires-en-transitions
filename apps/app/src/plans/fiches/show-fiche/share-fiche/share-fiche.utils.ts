import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';

export function isFicheSharedWithCollectivite(
  fiche: Pick<FicheWithRelations, 'sharedWithCollectivites'>,
  collectiviteId: number
) {
  return fiche.sharedWithCollectivites?.some(
    (sharing) => sharing.id === collectiviteId
  );
}

export function isFicheEditableByCollectiviteUser(
  fiche: FicheShareProperties & Pick<FicheWithRelations, 'pilotes'>,
  { collectiviteId, hasCollectivitePermission }: CollectiviteCurrent,
  userId?: string
) {
  return (
    (hasCollectivitePermission('plans.fiches.update') ||
      (userId &&
        hasCollectivitePermission('plans.fiches.update_piloted_by_me') &&
        fiche.pilotes?.some((pilote) => pilote.userId === userId))) &&
    (fiche.collectiviteId === collectiviteId ||
      isFicheSharedWithCollectivite(fiche, collectiviteId))
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
