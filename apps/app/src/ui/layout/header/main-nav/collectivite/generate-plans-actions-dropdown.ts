import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsListUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeTdbPlansEtActionsUrl,
} from '@/app/app/paths';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generatePlansActionsDropdown = ({
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
  panierId,
}: {
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
  panierId?: string;
}): CollectiviteNavItem => ({
  isVisible: !(collectiviteAccesRestreint && isVisitor),
  children: 'Plans & Actions',
  dataTest: 'nav-pa',
  links: [
    {
      children: 'Tableau de bord',
      dataTest: 'pa-tdb',
      href: makeTdbPlansEtActionsUrl({
        collectiviteId,
      }),
    },
    {
      children: 'Plans',
      dataTest: 'pa-tous',
      href: makeCollectivitePlansActionsListUrl({
        collectiviteId,
      }),
    },
    {
      children: 'Actions',
      dataTest: 'pa-fa-toutes',
      href: makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
      }),
    },
    {
      isVisible: !isVisitor,
      children: 'Actions à Impact',
      dataTest: 'pa-ai',
      href: makeCollectivitePanierUrl({
        collectiviteId,
        panierId,
      }),
      external: true,
    },
  ],
});
