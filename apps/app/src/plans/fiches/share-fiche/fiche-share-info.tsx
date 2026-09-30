import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheListItem } from '../list-all-fiches/data/use-list-fiches';

export const SHARE_ICON = 'share-forward-fill';

export const getFicheActionShareIcon = (
  fiche: Pick<FicheListItem, 'collectiviteId'>,
  collectiviteId: number
) => {
  return fiche.collectiviteId === collectiviteId ? 'team-fill' : SHARE_ICON;
};

export const ficheSharedSingularAndPluralText = (
  sharedWithCollectivites: NonNullable<
    FicheShareProperties['sharedWithCollectivites']
  >
) =>
  sharedWithCollectivites.length === 1
    ? `la collectivité ${sharedWithCollectivites[0].nom}`
    : `la collectivité ${sharedWithCollectivites[0].nom} et ${
        sharedWithCollectivites?.length - 1 === 1
          ? `1 autre`
          : `${sharedWithCollectivites?.length - 1} autres`
      }`;

export const getFicheActionShareText = (
  fiche: FicheShareProperties,
  collectiviteId: number
): string => {
  if (!fiche.sharedWithCollectivites?.length) {
    return '';
  }

  return fiche.collectiviteId === collectiviteId
    ? `Cette action est partagée en édition avec ${ficheSharedSingularAndPluralText(
        fiche.sharedWithCollectivites
      )}`
    : `Cette action vous est partagée en édition par la collectivité ${fiche.collectiviteNom}`;
};
