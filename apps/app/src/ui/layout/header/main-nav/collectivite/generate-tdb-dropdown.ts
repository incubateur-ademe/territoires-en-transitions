import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { generateTdbPersonalLink } from './generate-tdb-personal-link';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateTdbDropdown = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): CollectiviteNavItem => ({
  hideWhenConfidential: true,
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
    generateTdbPersonalLink({ collectiviteId }),
  ],
});
