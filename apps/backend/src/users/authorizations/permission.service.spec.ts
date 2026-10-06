import { ForbiddenException } from '@nestjs/common';
import { AuthRole, AuthUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import { ResourceType, UserRolesAndPermissions } from '@tet/domain/users';
import { describe, expect, it, vi } from 'vitest';
import { PermissionService } from './permission.service';

const service = new PermissionService({} as never, {} as never, {} as never);

const humanUser = {
  id: '00000000-0000-0000-0000-000000000001',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
} satisfies AuthUser<AuthRole.AUTHENTICATED>;

describe('PermissionService.isApiKeyAllowed', () => {
  it('does not constrain a human session without an API-key allow-list', () => {
    expect(
      service.isApiKeyAllowed(humanUser, 'indicateurs.valeurs.mutate')
    ).toEqual(success(undefined));
  });

  it('rejects an operation absent from a restricted API-key allow-list', () => {
    const readOnlyApiKeyUser = {
      ...humanUser,
      jwtPayload: {
        ...humanUser.jwtPayload,
        client_id: 'read-only-key',
        permissions: ['indicateurs.valeurs.read'],
      },
    } satisfies AuthUser<AuthRole.AUTHENTICATED>;

    expect(
      service.isApiKeyAllowed(readOnlyApiKeyUser, 'indicateurs.valeurs.mutate')
    ).toEqual(failure('UNAUTHORIZED'));
  });

  it('allows an operation present in a restricted API-key allow-list', () => {
    const writableApiKeyUser = {
      ...humanUser,
      jwtPayload: {
        ...humanUser.jwtPayload,
        client_id: 'writable-key',
        permissions: ['indicateurs.valeurs.mutate'],
      },
    } satisfies AuthUser<AuthRole.AUTHENTICATED>;

    expect(
      service.isApiKeyAllowed(writableApiKeyUser, 'indicateurs.valeurs.mutate')
    ).toEqual(success(undefined));
  });

  it('keeps service-role integrations unrestricted', () => {
    const serviceRoleUser = {
      id: null,
      role: AuthRole.SERVICE_ROLE,
      isAnonymous: true,
      jwtPayload: { role: AuthRole.SERVICE_ROLE, permissions: [] },
    } satisfies AuthUser<AuthRole.SERVICE_ROLE>;

    expect(
      service.isApiKeyAllowed(serviceRoleUser, 'indicateurs.valeurs.mutate')
    ).toEqual(success(undefined));
  });
});

describe('PermissionService.isAllowed', () => {
  it('returns a denial for a restricted API key before loading roles', async () => {
    const restrictedUser = {
      ...humanUser,
      jwtPayload: { ...humanUser.jwtPayload, permissions: [] },
    };
    await expect(
      service.isAllowed(
        restrictedUser,
        'indicateurs.valeurs.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId: 42 }
      )
    ).resolves.toEqual(failure('UNAUTHORIZED'));
    await expect(
      service.assertAllowed(
        restrictedUser,
        'indicateurs.valeurs.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId: 42 }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delegates the audit fallback lookup to the repository with the current transaction', async () => {
    const tx = {} as Transaction;
    const userPermissions = {
      roles: [],
      permissions: ['referentiels.read'],
      collectivites: [],
    } satisfies UserRolesAndPermissions;
    const getUserRolesAndPermissions = vi
      .fn()
      .mockResolvedValue(success(userPermissions));
    const getPreferencesByCollectiviteId = vi
      .fn()
      .mockResolvedValue(success(defaultCollectivitePreferences));
    const getAuditPermissionContext = vi.fn().mockResolvedValue({
      collectiviteId: 12,
      referentielId: 'cae',
    });
    const auditPermissionService = new PermissionService(
      { getUserRolesAndPermissions } as never,
      { getPreferencesByCollectiviteId } as never,
      { getAuditPermissionContext } as never
    );

    await expect(
      auditPermissionService.isAllowed(
        humanUser,
        'referentiels.read',
        ResourceType.AUDIT,
        { auditId: 42 },
        tx
      )
    ).resolves.toEqual(success(undefined));
    expect(getUserRolesAndPermissions).toHaveBeenCalledWith({
      userId: humanUser.id,
      tx,
    });
    expect(getAuditPermissionContext).toHaveBeenCalledWith(42, tx);
    expect(getPreferencesByCollectiviteId).toHaveBeenCalledWith(12, { tx });
  });
});
