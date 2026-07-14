import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateTdbLink = ({
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
}: {
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
}): CollectiviteNavItem | null => {
  if (collectiviteAccesRestreint && isVisitor) {
    return null;
  }

  return {
    dataTest: isVisitor ? 'tdb-collectivite' : 'tdb-perso',
    icon: 'home-4-line',
    href: makeTdbCollectiviteUrl({
      collectiviteId,
      view: isVisitor ? 'synthetique' : 'personnel',
    }),
  };
};
