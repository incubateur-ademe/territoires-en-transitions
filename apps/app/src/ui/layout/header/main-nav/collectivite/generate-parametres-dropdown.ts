import {
    makeCollectiviteBibliothequeUrl,
    makeCollectiviteJournalUrl,
    makeCollectiviteUsersUrl,
} from '@/app/app/paths';
import { isVisitor } from '@tet/domain/users';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateParametresDropdown = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): CollectiviteNavItem => ({
  isVisibleWhen: (user, accesRestreint) =>
    !(accesRestreint && isVisitor(user, { collectiviteId })),
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
      children: "Journal d'activité",
      dataTest: 'params-logs',
      href: makeCollectiviteJournalUrl({
        collectiviteId,
      }),
    },
  ],
});
