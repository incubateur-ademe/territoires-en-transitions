import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsListUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeTdbPlansEtActionsUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
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
  children: appLabels.plansEtActions,
  dataTest: 'nav-pa',
  links: [
    {
      children: appLabels.tableauDeBord,
      dataTest: 'pa-tdb',
      href: makeTdbPlansEtActionsUrl({
        collectiviteId,
      }),
    },
    {
      children: appLabels.plans,
      dataTest: 'pa-tous',
      href: makeCollectivitePlansActionsListUrl({
        collectiviteId,
      }),
    },
    {
      children: appLabels.actions,
      dataTest: 'pa-fa-toutes',
      href: makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
      }),
    },
    {
      isVisible: !isVisitor,
      children: appLabels.actionsAImpact,
      dataTest: 'pa-ai',
      href: makeCollectivitePanierUrl({
        collectiviteId,
        panierId,
      }),
      external: true,
    },
  ],
});
