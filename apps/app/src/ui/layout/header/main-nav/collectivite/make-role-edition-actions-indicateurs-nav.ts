import { CollectiviteCurrent } from '@tet/api/collectivites';
import { UserRolesAndPermissions } from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';
import { generateTdbPersonalLink } from './generate-tdb-personal-link';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const makeSimplifiedViewNav = ({
  user,
  currentCollectivite,
}: {
  user: UserRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
}): HeaderProps['mainNav'] => {
  const endItems: CollectiviteNavItem[] = [
    generateCollectiviteNavItem(user, currentCollectivite),
  ];

  return {
    startItems: [
      generateTdbPersonalLink({
        collectiviteId: currentCollectivite.collectiviteId,
      }),
    ],
    endItems: endItems,
  };
};
