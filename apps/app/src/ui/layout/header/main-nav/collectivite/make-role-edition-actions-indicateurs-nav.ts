import { CurrentCollectivite } from '@/api/collectivites';
import { HeaderProps, NavDropdown, NavLink } from '@/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';
import { generateTdbPersonalLink } from './generate-tdb-personal-link';

type AddtionalProps = {
  hideWhenConfidential?: boolean;
  hideWhenVisitor?: boolean;
  hideWhenNotSupport?: boolean;
};

type CollectiviteNavLink = NavLink & AddtionalProps;

type CollectiviteNavDropdown = NavDropdown &
  AddtionalProps & {
    links: CollectiviteNavLink[];
  };

export type CollectiviteNavItem = CollectiviteNavLink | CollectiviteNavDropdown;

export const makeRoleEditionActionsIndicateursNav = ({
  currentCollectivite,
  collectivites,
}: {
  currentCollectivite: CurrentCollectivite;
  collectivites: CurrentCollectivite[];
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
