import {
  ajouterCollectiviteUrl,
  getRechercheViewUrl,
  makeCollectiviteAccueilUrl,
  makeCollectiviteModifierUrl,
} from '@/app/app/paths';
import { getIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import {
  CollectiviteAccess,
  UserWithCollectiviteAccesses,
} from '@tet/domain/users';
import {
  HeaderProps,
  isNavDropdown,
  NavDropdown,
  NavItem,
  NavLink,
} from '@tet/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';
import { generateEdlDropdown } from './generate-edl-dropdown';
import { generateIndicateursDropdown } from './generate-indicateurs-dropdown';
import { generateParametresDropdown } from './generate-parametres-dropdown';
import { generatePlansActionsDropdown } from './generate-plans-actions-dropdown';
import { generateTdbDropdown } from './generate-tdb-dropdown';

type AddtionalProps = {
  hideWhenConfidential?: boolean;
  hideWhenVisitor?: boolean;
  hideWhenNotSupport?: boolean;
};

export type CollectiviteNavLink = NavLink & AddtionalProps;

type CollectiviteNavDropdown = NavDropdown &
  AddtionalProps & {
    links: CollectiviteNavLink[];
  };

export type CollectiviteNavItem = CollectiviteNavLink | CollectiviteNavDropdown;

export const makeCollectiviteNav = ({
  user,
  currentCollectivite,
  collectivites,
  isDemoMode,
  panierId,
}: {
  user: UserWithCollectiviteAccesses;
  currentCollectivite: CollectiviteAccess;
  collectivites: CollectiviteAccess[];
  isDemoMode: boolean;
  panierId?: string;
}): HeaderProps['mainNav'] => {
  const collectiviteId = currentCollectivite.collectiviteId;

  const isSupport = user.isSupport && !isDemoMode;

  const isVisitor = getIsVisitor({
    niveauAcces: currentCollectivite.niveauAcces,
    isSupport,
    isAuditeur: currentCollectivite.isRoleAuditeur,
  });

  const isConfidential = isVisitor && currentCollectivite.accesRestreint;

  const filterItems = (items: CollectiviteNavItem[]): NavItem[] =>
    items
      .filter((item) => {
        if (item.hideWhenConfidential && isConfidential) return false;
        if (item.hideWhenVisitor && isVisitor) return false;
        if (item.hideWhenNotSupport && !isSupport) return false;
        return true;
      })
      .map(
        ({
          hideWhenConfidential,
          hideWhenVisitor,
          hideWhenNotSupport,
          ...item
        }) =>
          isNavDropdown(item)
            ? { ...item, links: filterItems(item.links) as NavLink[] }
            : { ...item }
      );

  const startItems: CollectiviteNavItem[] = [
    {
      hideWhenVisitor: true,
      icon: 'home-4-line',
      href: makeCollectiviteAccueilUrl({ collectiviteId }),
      dataTest: 'nav-home',
    },
    generateTdbDropdown({ collectiviteId }),
    generateEdlDropdown({ collectiviteId }),
    generatePlansActionsDropdown({ collectiviteId, panierId }),
    generateIndicateursDropdown({ collectiviteId }),
    {
      children: 'Collectivités',
      dataTest: 'nav-collectivites',
      href: getRechercheViewUrl({
        collectiviteId,
        view: 'collectivites',
      }),
    },
    {
      hideWhenNotSupport: true,
      children: 'Support',
      links: [
        {
          children: 'Ajouter une collectivité',
          href: ajouterCollectiviteUrl,
        },
        {
          children: 'Modifier la collectivité',
          href: makeCollectiviteModifierUrl({
            collectiviteId,
          }),
        },
      ],
    },
  ];

  const endItems: CollectiviteNavItem[] = [
    generateParametresDropdown({ collectiviteId }),
    generateCollectiviteNavItem(collectivites, currentCollectivite),
  ];

  return {
    startItems: filterItems(startItems),
    endItems: filterItems(endItems),
  };
};
