import { FicheWithRelations } from '@tet/domain/plans';

const SHARE_ICON = 'share-forward-fill';

export const getFicheActionShareIcon = (
  fiche: Pick<FicheWithRelations, 'collectiviteId'>,
  collectiviteId: number
) => {
  return fiche.collectiviteId === collectiviteId ? 'team-fill' : SHARE_ICON;
};

export const getFicheActionShareText = (
  fiche: FicheWithRelations,
  collectiviteId: number
): string => {
  if (!fiche.sharedWithCollectivites?.length) {
    return '';
  }

  return fiche.collectiviteId === collectiviteId
    ? `Cette action est partagée en édition avec ${
        fiche.sharedWithCollectivites?.length === 1
          ? `la collectivité ${fiche.sharedWithCollectivites[0].nom}`
          : `la collectivité ${fiche.sharedWithCollectivites[0].nom} et ${
              fiche.sharedWithCollectivites?.length - 1 === 1
                ? `1 autre`
                : `${fiche.sharedWithCollectivites?.length - 1} autres`
            }`
      }`
    : `Cette action vous est partagée en édition par la collectivité ${fiche.collectiviteNom}`;
};
