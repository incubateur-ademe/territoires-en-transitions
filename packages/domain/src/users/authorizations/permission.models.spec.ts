import { describe, expect, it } from 'vitest';
import { permissionsByRole } from './permission.models';
import { CollectiviteRole, PlatformRole } from './user-role.enum.schema';

describe('permissionsByRole', () => {
  it("n'accorde la modification des documents de labellisation qu'au super admin", () => {
    const rolesGranting = Object.entries(permissionsByRole)
      .filter(([, permissions]) =>
        permissions.includes('referentiels.labellisations.mutate_documents')
      )
      .map(([role]) => role);

    expect(rolesGranting).toEqual([PlatformRole.SUPER_ADMIN]);
  });

  it("n'exempte que le super admin de la limite d'un import IA en cours par utilisateur", () => {
    const rolesGranting = Object.entries(permissionsByRole)
      .filter(([, permissions]) =>
        permissions.includes('plans.fiches.import_in_parallel')
      )
      .map(([role]) => role);

    expect(rolesGranting).toEqual([PlatformRole.SUPER_ADMIN]);
  });

  it("n'accorde la qualification de la pertinence des leviers qu'au super admin et à l'admin de la collectivité", () => {
    const rolesGranting = Object.entries(permissionsByRole)
      .filter(([, permissions]) =>
        permissions.includes('collectivites.pertinence-leviers.mutate')
      )
      .map(([role]) => role);

    expect(rolesGranting).toEqual([
      PlatformRole.SUPER_ADMIN,
      CollectiviteRole.ADMIN,
    ]);
  });

  it('accorde la lecture des documents confidentiels à tout rôle qui dépose des documents', () => {
    const rolesMutatingWithoutConfidentielRead = Object.entries(
      permissionsByRole
    )
      .filter(([, permissions]) =>
        permissions.includes('collectivites.documents.mutate')
      )
      .filter(
        ([, permissions]) =>
          !permissions.includes('collectivites.documents.read_confidentiel')
      )
      .map(([role]) => role);

    expect(rolesMutatingWithoutConfidentielRead).toEqual([]);
  });
});

describe('permissions des vues indicateurs', () => {
  it('réserve la lecture aux membres et au super admin', () => {
    const roles = Object.entries(permissionsByRole)
      .filter(([, permissions]) =>
        permissions.includes('indicateurs.vues.read')
      )
      .map(([role]) => role);
    expect(roles).toEqual([
      PlatformRole.SUPER_ADMIN,
      CollectiviteRole.LECTURE,
      CollectiviteRole.EDITION,
      CollectiviteRole.ADMIN,
      CollectiviteRole.EDITION_FICHES_INDICATEURS,
    ]);
  });

  it('permet à tous les rôles en écriture de gérer les vues collectives', () => {
    const roles = Object.entries(permissionsByRole)
      .filter(([, permissions]) =>
        permissions.includes('indicateurs.vues.mutate')
      )
      .map(([role]) => role);
    expect(roles).toEqual([
      PlatformRole.SUPER_ADMIN,
      CollectiviteRole.EDITION,
      CollectiviteRole.ADMIN,
      CollectiviteRole.EDITION_FICHES_INDICATEURS,
    ]);
  });
});
