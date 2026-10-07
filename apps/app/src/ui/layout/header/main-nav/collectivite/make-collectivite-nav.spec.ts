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
import { isNavLink, NavItem, NavLink } from '@tet/ui';
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

const toCollectiviteRootLinks = (
  roles: readonly PlatformRole[]
): RootLink[] => {
  const user = toUser(epciAccess, roles);
  return toRootLinks(
    makeCollectiviteNav({
      user,
      currentCollectivite: toCollectiviteCurrent(
        { ...epciAccess, contexteInstruction: null },
        user
      ),
      isDemarchePcaetEnabled: false,
    })?.startItems
  );
};

const toMainRootLinks = (
  access: CollectiviteRolesAndPermissions
): RootLink[] => {
  const user = toUser(access, superAdminRoles);
  return toRootLinks(
    makeMainNav({
      user,
      currentCollectivite: toCollectiviteCurrent(
        { ...access, contexteInstruction: null },
        user
      ),
      isDemarchePcaetEnabled: false,
    })?.startItems
  );
};

const actionsDeReferenceLink: RootLink = {
  label: appLabels.actionsDeReference,
  href: '/collectivite/20/actions-reference',
};

describe('entree-nav-reservee-au-super-admin', () => {
  it('un super admin a une entrée à la racine qui mène aux actions de référence de la collectivité', () => {
    expect(toCollectiviteRootLinks(superAdminRoles)).toContainEqual(
      actionsDeReferenceLink
    );
  });

  it("un utilisateur qui n'est pas super admin n'a pas l'entrée des actions de référence", () => {
    const labels = toCollectiviteRootLinks(connectedRoles).map(
      (link) => link.label
    );

    expect(labels).not.toContain(appLabels.actionsDeReference);
  });

  it("un super admin en service déconcentré n'a pas l'entrée des actions de référence", () => {
    const labels = toMainRootLinks(drealAccess).map((link) => link.label);

    expect(labels).not.toContain(appLabels.actionsDeReference);
  });

  it("un super admin en vue simplifiée n'a pas l'entrée des actions de référence", () => {
    const labels = toMainRootLinks(simplifiedViewAccess).map(
      (link) => link.label
    );

    expect(labels).not.toContain(appLabels.actionsDeReference);
  });
});
