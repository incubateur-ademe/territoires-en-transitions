import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { generateTdbPersonalLink } from './generate-tdb-personal-link';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateTdbDropdown = ({
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
}: {
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
}): CollectiviteNavItem | null => {
  if (!isVisitor) {
    return {
      children: 'Tableaux de bord',
      dataTest: 'nav-tdb',
      links: [
        {
          children: 'Tableau de bord synthétique',
          dataTest: 'tdb-collectivite',
          href: makeTdbCollectiviteUrl({
            collectiviteId,
            view: 'synthetique',
          }),
        },
        generateTdbPersonalLink({ collectiviteId, isVisitor }),
      ],
    };
  }

  // From here it's a visitor

  if (collectiviteAccesRestreint) {
    return null;
  }

  return {
    children: 'Tableau de bord',
    dataTest: 'nav-tdb',
    href: makeTdbCollectiviteUrl({
      collectiviteId,
      view: 'synthetique',
    }),
  };
};
