import { makeCollectivitePriorisationUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { toCollectiviteCurrent } from '@tet/api/collectivites';
import {
  CollectiviteType,
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import {
  CollectiviteRole,
  CollectiviteRolesAndPermissions,
  permissionsByRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { isNavDropdown, isNavLink, NavItem, NavLink } from '@tet/ui';
import { makeMainNav } from '../make-main-nav';
import { makeCollectiviteNav } from './make-collectivite-nav';

const epciAccess: CollectiviteRolesAndPermissions = {
  collectiviteId: 20,
  collectiviteNom: 'Communauté de communes du Test',
  collectiviteType: collectiviteTypeEnum.EPCI,
  collectiviteAccesRestreint: false,
  collectivitePreferences: defaultCollectivitePreferences,
  role: CollectiviteRole.ADMIN,
  permissions: [],
  audits: [],
};

const drealAccess: CollectiviteRolesAndPermissions = {
  ...epciAccess,
  collectiviteId: 10,
  collectiviteNom: 'DREAL du Test',
  collectiviteType: collectiviteTypeEnum.DREAL,
};

const simplifiedViewAccess: CollectiviteRolesAndPermissions = {
  ...epciAccess,
  role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
};

const connectedRoles: readonly PlatformRole[] = [
  PlatformRole.CONNECTED,
  PlatformRole.VERIFIED,
];

const superAdminRoles: readonly PlatformRole[] = [
  ...connectedRoles,
  PlatformRole.SUPER_ADMIN,
];

const toUser = (
  access: CollectiviteRolesAndPermissions,
  roles: readonly PlatformRole[]
): UserWithRolesAndPermissions => ({
  id: 'utilisateur-connecte',
  nom: 'Test',
  prenom: 'Camille',
  email: 'camille@test.fr',
  telephone: null,
  cguAccepteesLe: null,
  newEmail: null,
  roles: [...roles],
  permissions: [],
  collectivites: [access],
});

type RootLink = { label: NavItem['children']; href: NavLink['href'] };

const toRootLinks = (items: NavItem[] | undefined): RootLink[] =>
  (items ?? [])
    .filter(isNavLink)
    .map((link) => ({ label: link.children, href: link.href }));

const toSuperAdminMenuLinks = (items: NavItem[]): RootLink[] =>
  toRootLinks(
    items
      .filter(isNavDropdown)
      .find((dropdown) => dropdown.children === appLabels.roleSuperAdmin)?.links
  );

const toCollectiviteStartItems = (
  roles: readonly PlatformRole[]
): NavItem[] => {
  const user = toUser(epciAccess, roles);
  return (
    makeCollectiviteNav({
      user,
      currentCollectivite: toCollectiviteCurrent(
        { ...epciAccess, contexteInstruction: null },
        user
      ),
      isDemarchePcaetEnabled: false,
      isPriorisationEnabled: false,
    })?.startItems ?? []
  );
};

const toMainStartItems = (
  access: CollectiviteRolesAndPermissions
): NavItem[] => {
  const user = toUser(access, superAdminRoles);
  return (
    makeMainNav({
      user,
      currentCollectivite: toCollectiviteCurrent(
        { ...access, contexteInstruction: null },
        user
      ),
      isDemarchePcaetEnabled: false,
      isPriorisationEnabled: false,
    })?.startItems ?? []
  );
};

const actionsDeReferenceLink: RootLink = {
  label: appLabels.actionsDeReference,
  href: '/collectivite/20/actions-reference',
};

const toMemberAccess = ({
  role,
  collectiviteType,
}: {
  role: CollectiviteRole;
  collectiviteType: CollectiviteType;
}): CollectiviteRolesAndPermissions => ({
  ...epciAccess,
  collectiviteType,
  role,
  permissions: permissionsByRole[role],
});

const otherCollectiviteAccess: CollectiviteRolesAndPermissions = {
  ...toMemberAccess({
    role: CollectiviteRole.ADMIN,
    collectiviteType: collectiviteTypeEnum.EPCI,
  }),
  collectiviteId: 30,
};

const toUserWithPlatformPermissions = (
  access: CollectiviteRolesAndPermissions,
  roles: readonly PlatformRole[]
): UserWithRolesAndPermissions => ({
  ...toUser(access, roles),
  permissions: roles.flatMap((role) => permissionsByRole[role]),
});

const makeStartItemsWithPriorisation = ({
  user,
  currentAccess,
  isPriorisationEnabled = true,
}: {
  user: UserWithRolesAndPermissions;
  currentAccess: CollectiviteRolesAndPermissions;
  isPriorisationEnabled?: boolean;
}): NavItem[] =>
  makeMainNav({
    user,
    currentCollectivite: toCollectiviteCurrent(
      { ...currentAccess, contexteInstruction: null },
      user
    ),
    isDemarchePcaetEnabled: false,
    isPriorisationEnabled,
  })?.startItems ?? [];

const toPriorisationHrefs = (startItems: NavItem[]): NavLink['href'][] =>
  startItems
    .filter(isNavLink)
    .map((item) => item.href)
    .filter((href) => href === priorisationHref);

const priorisationHref = makeCollectivitePriorisationUrl({
  collectiviteId: 20,
});

const toMemberStartItems = (
  memberAccess: CollectiviteRolesAndPermissions
): NavItem[] =>
  makeStartItemsWithPriorisation({
    user: toUserWithPlatformPermissions(memberAccess, connectedRoles),
    currentAccess: memberAccess,
  });

const toStartItemsOnEpciOfNonMember = ({
  roles,
  collectiviteAccesRestreint,
}: {
  roles: readonly PlatformRole[];
  collectiviteAccesRestreint: boolean;
}): NavItem[] =>
  makeStartItemsWithPriorisation({
    user: toUserWithPlatformPermissions(otherCollectiviteAccess, roles),
    currentAccess: {
      ...toMemberAccess({
        role: CollectiviteRole.ADMIN,
        collectiviteType: collectiviteTypeEnum.EPCI,
      }),
      collectiviteAccesRestreint,
    },
  });

describe('aide-a-la-priorisation-dans-la-nav', () => {
  it("l'aide à la priorisation est juste après Programmes & Démarches", () => {
    const startItems = toMemberStartItems(
      toMemberAccess({
        role: CollectiviteRole.ADMIN,
        collectiviteType: collectiviteTypeEnum.EPCI,
      })
    );

    const indexProgrammes = startItems.findIndex(
      (item) => item.children === appLabels.programmesEtDemarches
    );

    expect(startItems[indexProgrammes + 1]).toMatchObject({
      href: priorisationHref,
    });
  });

  it("sans le feature flag, la nav n'a pas d'entrée vers la priorisation", () => {
    const adminAccess = toMemberAccess({
      role: CollectiviteRole.ADMIN,
      collectiviteType: collectiviteTypeEnum.EPCI,
    });
    const startItems = makeStartItemsWithPriorisation({
      user: toUserWithPlatformPermissions(adminAccess, connectedRoles),
      currentAccess: adminAccess,
      isPriorisationEnabled: false,
    });

    expect(toPriorisationHrefs(startItems)).toEqual([]);
  });

  it.each([CollectiviteRole.ADMIN, CollectiviteRole.EDITION])(
    "un membre %s d'un EPCI a l'onglet",
    (role) => {
      expect(
        toPriorisationHrefs(
          toMemberStartItems(
            toMemberAccess({
              role,
              collectiviteType: collectiviteTypeEnum.EPCI,
            })
          )
        )
      ).toEqual([priorisationHref]);
    }
  );

  it.each([
    CollectiviteRole.LECTURE,
    CollectiviteRole.EDITION_FICHES_INDICATEURS,
  ])("un membre %s d'un EPCI n'a pas l'onglet", (role) => {
    expect(
      toPriorisationHrefs(
        toMemberStartItems(
          toMemberAccess({
            role,
            collectiviteType: collectiviteTypeEnum.EPCI,
          })
        )
      )
    ).toEqual([]);
  });

  it("l'admin d'une commune n'a pas l'onglet", () => {
    const communeAdminAccess = toMemberAccess({
      role: CollectiviteRole.ADMIN,
      collectiviteType: collectiviteTypeEnum.COMMUNE,
    });

    expect(toPriorisationHrefs(toMemberStartItems(communeAdminAccess))).toEqual(
      []
    );
  });

  it("un visiteur de l'EPCI n'a pas l'onglet", () => {
    expect(
      toPriorisationHrefs(
        toStartItemsOnEpciOfNonMember({
          roles: connectedRoles,
          collectiviteAccesRestreint: false,
        })
      )
    ).toEqual([]);
  });

  it.each([
    { label: 'un super admin', roles: superAdminRoles },
    {
      label: 'un utilisateur ADEME',
      roles: [...connectedRoles, PlatformRole.ADEME],
    },
  ])("$label a l'onglet sur un EPCI dont il n'est pas membre", ({ roles }) => {
    expect(
      toPriorisationHrefs(
        toStartItemsOnEpciOfNonMember({
          roles,
          collectiviteAccesRestreint: false,
        })
      )
    ).toEqual([priorisationHref]);
  });

  it("un super admin a l'onglet sur un EPCI en accès restreint dont il n'est pas membre", () => {
    expect(
      toPriorisationHrefs(
        toStartItemsOnEpciOfNonMember({
          roles: superAdminRoles,
          collectiviteAccesRestreint: true,
        })
      )
    ).toEqual([priorisationHref]);
  });

  it("un utilisateur ADEME n'a pas l'onglet sur un EPCI en accès restreint dont il n'est pas membre", () => {
    expect(
      toPriorisationHrefs(
        toStartItemsOnEpciOfNonMember({
          roles: [...connectedRoles, PlatformRole.ADEME],
          collectiviteAccesRestreint: true,
        })
      )
    ).toEqual([]);
  });
});

describe('entree-actions-de-reference-dans-le-menu-super-admin', () => {
  it('un super admin trouve dans le menu Super Admin le lien vers les actions de référence de la collectivité', () => {
    expect(
      toSuperAdminMenuLinks(toCollectiviteStartItems(superAdminRoles))
    ).toContainEqual(actionsDeReferenceLink);
  });

  it("un utilisateur qui n'est pas super admin n'a pas le menu Super Admin", () => {
    expect(
      toSuperAdminMenuLinks(toCollectiviteStartItems(connectedRoles))
    ).toEqual([]);
  });

  it("un super admin en service déconcentré n'a pas le lien vers les actions de référence", () => {
    const labels = toSuperAdminMenuLinks(toMainStartItems(drealAccess)).map(
      (link) => link.label
    );

    expect(labels).not.toContain(appLabels.actionsDeReference);
  });

  it("un super admin en vue simplifiée n'a pas le lien vers les actions de référence", () => {
    const labels = toSuperAdminMenuLinks(
      toMainStartItems(simplifiedViewAccess)
    ).map((link) => link.label);

    expect(labels).not.toContain(appLabels.actionsDeReference);
  });
});
