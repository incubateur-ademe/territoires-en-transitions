import {
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteUsersUrl,
} from '@/app/app/paths';
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
  children: 'Paramètres',
  dataTest: 'nav-params',
  links: [
    {
      children: 'Gestion des utilisateurs',
      dataTest: 'params-membres',
      href: makeCollectiviteUsersUrl({
        collectiviteId,
      }),
    },
    {
      children: 'Bibliothèque de documents',
      dataTest: 'params-docs',
      href: makeCollectiviteBibliothequeUrl({
        collectiviteId,
      }),
    },
    {
      isVisible: !isVisitor || isAdeme,
      children: "Journal d'activité",
      dataTest: 'params-logs',
      href: makeCollectiviteJournalUrl({
        collectiviteId,
      }),
    },
  ],
});
