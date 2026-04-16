import {
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteUsersUrl,
  makeMaCollectiviteUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateParametresDropdown = ({
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
  isAdeme,
}: {
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
  isAdeme: boolean;
}): CollectiviteNavItem => ({
  isVisible: !(collectiviteAccesRestreint && isVisitor),
  children: appLabels.navParametres,
  dataTest: 'nav-params',
  links: [
    {
      children: appLabels.navMaCollectivite,
      dataTest: 'params-collectivite',
      href: makeMaCollectiviteUrl({
        collectiviteId,
      }),
      urlPrefix: ['/ma-collectivite'],
    },
    {
      children: appLabels.navGestionDesUtilisateurs,
      dataTest: 'params-membres',
      href: makeCollectiviteUsersUrl({
        collectiviteId,
      }),
    },
    {
      children: appLabels.navBibliothequeDeDocuments,
      dataTest: 'params-docs',
      href: makeCollectiviteBibliothequeUrl({
        collectiviteId,
      }),
    },
    {
      isVisible: !isVisitor || isAdeme,
      children: appLabels.journalActivite,
      dataTest: 'params-logs',
      href: makeCollectiviteJournalUrl({
        collectiviteId,
      }),
    },
  ],
});
