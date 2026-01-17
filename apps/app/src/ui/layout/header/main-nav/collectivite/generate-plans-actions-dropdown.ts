import {
    makeCollectivitePanierUrl,
    makeCollectivitePlansActionsListUrl,
    makeCollectiviteToutesLesFichesUrl,
    makeTdbPlansEtActionsUrl,
} from '@/app/app/paths';
import { isVisitor } from '@tet/domain/users';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generatePlansActionsDropdown = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId: number;
  panierId?: string;
}): CollectiviteNavItem => ({
  isVisibleWhen: (user, accesRestreint) =>
    !(accesRestreint && isVisitor(user, { collectiviteId })),
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
