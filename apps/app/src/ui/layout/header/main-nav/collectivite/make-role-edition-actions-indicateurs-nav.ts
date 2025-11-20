import { CollectiviteAccess } from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';
import { generateTdbPersonalLink } from './generate-tdb-personal-link';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const makeRoleEditionActionsIndicateursNav = ({
  currentCollectivite,
  collectivites,
}: {
  currentCollectivite: CollectiviteAccess;
  collectivites: CollectiviteAccess[];
}): HeaderProps['mainNav'] => {
  const endItems: CollectiviteNavItem[] = [
    generateCollectiviteNavItem(collectivites, currentCollectivite),
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
