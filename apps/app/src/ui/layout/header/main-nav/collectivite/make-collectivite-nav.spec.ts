import { makeCollectivitePriorisationUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { toCollectiviteCurrent } from '@tet/api/collectivites';
import {
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import {
  CollectiviteRole,
  CollectiviteRolesAndPermissions,
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
      .find((dropdown) => dropdown.children === appLabels.roleSuperAdmin)
      ?.links
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

const makeStartItemsWithPriorisation = (isPriorisationEnabled: boolean) => {
  const user = toUser(epciAccess, connectedRoles);
  return (
    makeCollectiviteNav({
      user,
      currentCollectivite: toCollectiviteCurrent(
        { ...epciAccess, contexteInstruction: null },
        user
      ),
      isDemarchePcaetEnabled: false,
      isPriorisationEnabled,
    })?.startItems ?? []
  );
};

const priorisationHref = makeCollectivitePriorisationUrl({
  collectiviteId: 20,
});

describe('aide-a-la-priorisation-dans-la-nav', () => {
  it("l'aide à la priorisation est juste après Programmes & Démarches", () => {
    const startItems = makeStartItemsWithPriorisation(true);

    const indexProgrammes = startItems.findIndex(
      (item) => item.children === appLabels.programmesEtDemarches
    );

    expect(startItems[indexProgrammes + 1]).toMatchObject({
      href: priorisationHref,
    });
  });

  it("sans le feature flag, la nav n'a pas d'entrée vers la priorisation", () => {
    const hrefs = makeStartItemsWithPriorisation(false)
      .filter(isNavLink)
      .map((item) => item.href);

    expect(hrefs).not.toContain(priorisationHref);
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
