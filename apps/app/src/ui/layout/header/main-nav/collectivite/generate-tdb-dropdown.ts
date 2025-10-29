import { makeTdbCollectiviteUrl } from '@/app/app/paths';
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
    {
      hideWhenVisitor: true,
      children: 'Mon suivi personnel',
      dataTest: 'tdb-perso',
      href: makeTdbCollectiviteUrl({
        collectiviteId,
        view: 'personnel',
      }),
    },
  ],
});
