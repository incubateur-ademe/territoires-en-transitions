import { describe, expect, it } from 'vitest';
import { permissionsByRole } from './permission.models';
import { PlatformRole } from './user-role.enum.schema';

describe('permissionsByRole', () => {
  it("n'accorde la modification des documents de labellisation qu'au super admin", () => {
    const rolesGranting = Object.entries(permissionsByRole)
      .filter(([, permissions]) =>
        permissions.includes('referentiels.labellisations.mutate_documents')
      )
      .map(([role]) => role);

    expect(rolesGranting).toEqual([PlatformRole.SUPER_ADMIN]);
  });
});
