import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { describe, expect, it, vi } from 'vitest';
import { GetImportCapabilitiesService } from './get-import-capabilities.service';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('GetImportCapabilitiesService', () => {
  it('refuse les capacités sans droit sur la collectivité demandée', async () => {
    const isAllowed = vi.fn(async () => failure('UNAUTHORIZED'));
    const service = new GetImportCapabilitiesService({
      isAllowed,
    } as unknown as PermissionService);

    expect(
      await service.getCapabilities({ collectiviteId: 42 }, { user })
    ).toEqual({
      success: false,
      error: 'UNAUTHORIZED',
    });
    expect(isAllowed).toHaveBeenCalledWith(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      {
        collectiviteId: 42,
      }
    );
  });

  it('garde l’annexe indisponible même pour un utilisateur autorisé', async () => {
    const service = new GetImportCapabilitiesService({
      isAllowed: vi.fn(async () => success(undefined)),
    } as unknown as PermissionService);

    expect(
      await service.getCapabilities({ collectiviteId: 42 }, { user })
    ).toEqual({
      success: true,
      data: {
        profiles: [
          { profile: 'generic', available: true },
          { profile: 'annexe-3-electrification', available: false },
        ],
      },
    });
  });
});
