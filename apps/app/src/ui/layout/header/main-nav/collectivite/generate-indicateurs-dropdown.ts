import {
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteTrajectoirelUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
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
  children: appLabels.indicateurs,
  dataTest: 'nav-ind',
  links: [
    {
      children: appLabels.navListesIndicateurs,
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
      children: appLabels.trajectoireSnbcEtObjectifs,
      href: makeCollectiviteTrajectoirelUrl({ collectiviteId }),
    },
  ],
});
