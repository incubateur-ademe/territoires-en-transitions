import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsListUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeTdbPlansEtActionsUrl,
} from '@/app/app/paths';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generatePlansActionsDropdown = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId: number;
  panierId?: string;
}): CollectiviteNavItem => ({
  hideWhenConfidential: true,
  children: 'Plans & Actions',
  dataTest: 'nav-pa',
  links: [
    {
      children: 'Tableau de bord Plans & Actions',
      dataTest: 'pa-tdb',
      href: makeTdbPlansEtActionsUrl({
        collectiviteId,
      }),
    },
    {
      children: 'Tous les plans',
      dataTest: 'pa-tous',
      href: makeCollectivitePlansActionsListUrl({
        collectiviteId,
      }),
    },
    {
      children: 'Toutes les actions',
      dataTest: 'pa-fa-toutes',
      href: makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
      }),
    },
    {
      hideWhenVisitor: true,
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
