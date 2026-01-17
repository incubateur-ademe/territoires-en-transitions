import {
  ajouterCollectiviteUrl,
  getRechercheViewUrl,
  importerPlanUrl,
  makeCollectiviteAccueilUrl,
  makeCollectiviteModifierUrl,
} from '@/app/app/paths';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import {
  hasRole,
  isVisitor,
  PlatformRole,
  UserRolesAndPermissions,
  UserWithRolesAndPermissions,
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
  isVisibleWhen?: (
    user: UserRolesAndPermissions,
    accesRestreint: boolean
  ) => boolean;
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
  panierId,
}: {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
  panierId?: string;
}): HeaderProps['mainNav'] => {
  const { collectiviteId, collectiviteAccesRestreint } = currentCollectivite;

  const filterItems = (items: CollectiviteNavItem[]): NavItem[] =>
    items
      .filter((item) =>
        item.isVisibleWhen
          ? item.isVisibleWhen(user, collectiviteAccesRestreint)
          : true
      )
      .map((item) =>
        isNavDropdown(item)
          ? { ...item, links: filterItems(item.links) as NavLink[] }
          : { ...item }
      );

  const startItems: CollectiviteNavItem[] = [
    {
      isVisibleWhen: (user) => !isVisitor(user, { collectiviteId }),
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
      isVisibleWhen: (user) => hasRole(user, PlatformRole.SUPER_ADMIN),
      children: 'Support',
      links: [
        {
          children: 'Importer un plan',
          href: importerPlanUrl,
        },
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
    generateCollectiviteNavItem(user, currentCollectivite),
  ];

  return {
    startItems: filterItems(startItems),
    endItems: filterItems(endItems),
  };
};
