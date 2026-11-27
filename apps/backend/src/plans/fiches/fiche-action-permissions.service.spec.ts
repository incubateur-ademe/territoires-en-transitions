import { ForbiddenException } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { describe, expect, it, vi } from 'vitest';
import FicheActionPermissionsService from './fiche-action-permissions.service';

describe('FicheActionPermissionsService.canDeleteFiche', () => {
  it('rejects a key without the delete scope before evaluating account permissions', async () => {
    const getUserRolesAndPermissions = vi.fn();
    const rolesService = { getUserRolesAndPermissions } as never;
    const permissionService = new PermissionService(
      rolesService,
      {} as never,
      {} as never
    );
    const service = new FicheActionPermissionsService(
      permissionService,
      rolesService,
      {} as never,
      {} as never
    );
    const fiche = { id: 2, parentId: 1, collectiviteId: 42 };
    vi.spyOn(service, 'getFicheFromId').mockResolvedValue(
      fiche as NonNullable<Awaited<ReturnType<typeof service.getFicheFromId>>>
    );

    const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');
    user.jwtPayload.client_id = 'read-only-key';
    user.jwtPayload.permissions = ['plans.fiches.read'];

    await expect(service.canDeleteFiche(fiche.id, user)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    await expect(service.canDeleteFiche(fiche.id, user, true)).resolves.toBe(
      false
    );
    expect(getUserRolesAndPermissions).not.toHaveBeenCalled();
  });
});
