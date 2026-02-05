import {
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteTrajectoirelUrl,
} from '@/app/app/paths';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateIndicateursDropdown = ({
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
}: {
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
}): CollectiviteNavItem => ({
  isVisible: !(collectiviteAccesRestreint && isVisitor),
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
