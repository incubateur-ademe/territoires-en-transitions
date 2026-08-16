import { makeCollectiviteUsersUrl, makeDemandesAvisUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';

export const makeServiceDeconcentreNav = ({
  user,
  currentCollectivite,
}: {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
}): HeaderProps['mainNav'] => {
  return {
    startItems: [
      {
        children: appLabels.instructionTitre,
        className: 'self-stretch',
        href: makeDemandesAvisUrl({
          collectiviteId: currentCollectivite.collectiviteId,
        }),
      },
      {
        children: appLabels.gestionDesUtilisateurs,
        className: 'self-stretch',
        dataTest: 'params-membres',
        href: makeCollectiviteUsersUrl({
          collectiviteId: currentCollectivite.collectiviteId,
        }),
      },
    ],
    endItems: [generateCollectiviteNavItem(user, currentCollectivite)],
  };
};
