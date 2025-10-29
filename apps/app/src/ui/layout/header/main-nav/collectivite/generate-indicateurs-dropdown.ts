import {
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteTrajectoirelUrl,
} from '@/app/app/paths';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateIndicateursDropdown = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): CollectiviteNavItem => ({
  hideWhenConfidential: true,
  children: 'Indicateurs',
  dataTest: 'nav-ind',
  links: [
    {
      children: "Listes d'indicateurs",
      dataTest: 'ind-tous',
      href: makeCollectiviteIndicateursListUrl({
        collectiviteId,
      }),
      urlPrefix: [
        makeCollectiviteIndicateursListUrl({
          collectiviteId,
        }),
      ],
    },
    {
      dataTest: 'ind-traj-snbc',
      children: 'Trajectoire SNBC et objectifs',
      href: makeCollectiviteTrajectoirelUrl({ collectiviteId }),
    },
  ],
});
