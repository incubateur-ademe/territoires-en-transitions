import {
  ajouterCollectiviteUrl,
  bannerInfoUrl,
  getRechercheViewUrl,
  importerPlanUrl,
  makeCollectiviteAccueilUrl,
  makeCollectiviteAffichageReferentielsUrl,
  makeCollectiviteModifierUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { ReferentielDisplayMap } from '@tet/domain/collectivites';
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
import { generateParametresDropdown } from './generate-parametres-dropdown';
import { generatePlansActionsDropdown } from './generate-plans-actions-dropdown';
import { generateTdbDropdown } from './generate-tdb-dropdown';

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

export const makeCollectiviteNav = ({
  user,
  currentCollectivite,
  panierId,
  referentielDisplay,
}: {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
  panierId?: string;
  referentielDisplay?: ReferentielDisplayMap;
}): HeaderProps['mainNav'] => {
  const { collectiviteId, collectiviteAccesRestreint } = currentCollectivite;
  const isVisitor = isUserVisitor(user, { collectiviteId });

  const filterItems = (items: (CollectiviteNavItem | null)[]): NavItem[] =>
    items
      .filter((item) => item !== null)
      .filter((item) => (item.isVisible !== undefined ? item.isVisible : true))
      .map((item) =>
        isNavDropdown(item)
          ? { ...item, links: filterItems(item.links) as NavLink[] }
          : { ...item }
      )
      .map(cleanButtonProps);

  const startItems: (CollectiviteNavItem | null)[] = [
    {
      isVisible: !isVisitor,
      icon: 'home-4-line',
      href: makeCollectiviteAccueilUrl({ collectiviteId }),
      dataTest: 'nav-home',
    },
    generateTdbDropdown({
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
        currentCollectivite.collectivitePreferences.referentiels.display,
    }),
    generatePlansActionsDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
      panierId,
    }),
    generateIndicateursDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
    }),
    {
      children: appLabels.navCollectivites,
      dataTest: 'nav-collectivites',
      href: getRechercheViewUrl({
        collectiviteId,
        view: 'collectivites',
      }),
    },
    {
      isVisible: hasRole(user, PlatformRole.SUPER_ADMIN),
      children: appLabels.navSuperAdmin,
      links: [
        {
          children: appLabels.navImporterUnPlan,
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
          children: appLabels.navAffichageReferentiels,
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
    generateParametresDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
      isAdeme: hasRole(user, PlatformRole.ADEME),
    }),
    generateCollectiviteNavItem(user, currentCollectivite),
  ];

  return {
    startItems: filterItems(startItems),
    endItems: filterItems(endItems),
  };
};
