import {
  ajouterCollectiviteUrl,
  bannerInfoUrl,
  importerPlanUrl,
  makeCollectiviteAffichageReferentielsUrl,
  makeCollectiviteModifierUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import {
  getReferentielDisplayMap,
  ReferentielDisplayMap,
} from '@tet/domain/collectivites';
import {
  hasRole,
  isUserVisitor,
  PlatformRole,
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
import { generatePlansActionsDropdown } from './generate-plans-actions-dropdown';
import { generateTdbLink } from './generate-tdb-dropdown';

type AddtionalProps = {
  isVisible?: boolean;
};

export type CollectiviteNavLink = NavLink & AddtionalProps;

type CollectiviteNavDropdown = NavDropdown &
  AddtionalProps & {
    links: CollectiviteNavLink[];
  };

export type CollectiviteNavItem = CollectiviteNavLink | CollectiviteNavDropdown;

export const cleanButtonProps = (item: CollectiviteNavItem): NavItem => {
  const { isVisible, ...rest } = item;
  return rest;
};

export const filterNavItems = (
  items: (CollectiviteNavItem | null)[]
): NavItem[] =>
  items
    .filter((item) => item !== null)
    .filter((item) => (item.isVisible !== undefined ? item.isVisible : true))
    .map((item) =>
      isNavDropdown(item)
        ? { ...item, links: filterNavItems(item.links) as NavLink[] }
        : { ...item }
    )
    .map(cleanButtonProps);

export const makeCollectiviteNav = ({
  user,
  currentCollectivite,
  referentielDisplay,
  isDemarchePcaetEnabled,
}: {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
  referentielDisplay?: ReferentielDisplayMap;
  isDemarchePcaetEnabled: boolean;
}): HeaderProps['mainNav'] => {
  const { collectiviteId, collectiviteAccesRestreint } = currentCollectivite;
  const isVisitor = isUserVisitor(user, { collectiviteId });

  const startItems: (CollectiviteNavItem | null)[] = [
    generateTdbLink({
      user,
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
    }),
    generatePlansActionsDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
    }),
    generateIndicateursDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
    }),
    generateEdlDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
      referentielsDisplay:
        referentielDisplay ??
        getReferentielDisplayMap(
          currentCollectivite.collectivitePreferences.referentiels
        ),
      isDemarchePcaetEnabled,
    }),
    {
      isVisible: hasRole(user, PlatformRole.SUPER_ADMIN),
      children: appLabels.roleSuperAdmin,
      links: [
        {
          children: appLabels.importerUnPlan,
          href: importerPlanUrl,
        },
        {
          children: appLabels.ajouterCollectivite,
          href: ajouterCollectiviteUrl,
        },
        {
          children: appLabels.modifierCollectivite,
          href: makeCollectiviteModifierUrl({
            collectiviteId,
          }),
        },
        {
          children: appLabels.affichageDesReferentiels,
          href: makeCollectiviteAffichageReferentielsUrl({
            collectiviteId,
          }),
        },
        {
          children: 'Bannière',
          href: bannerInfoUrl,
        },
      ],
    },
  ];

  const endItems: CollectiviteNavItem[] = [
    generateCollectiviteNavItem({
      user,
      currentCollectivite,
    }),
  ];

  return {
    startItems: filterNavItems(startItems),
    endItems: filterNavItems(endItems),
  };
};
