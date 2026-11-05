import { AuthRole } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurValeursReadAccessService } from './indicateur-valeurs-read-access.service';

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  role: AuthRole.AUTHENTICATED,
} as never;

const createService = ({
  canReadConfidentiel,
  canRead,
  isPrivate,
}: {
  canReadConfidentiel: boolean;
  canRead: boolean;
  isPrivate: boolean;
}) => {
  const permissionService = {
    isAllowed: vi.fn(async (_user: unknown, operation: string) => {
      const allowed =
        operation === 'indicateurs.valeurs.read_confidentiel'
          ? canReadConfidentiel
          : canRead;
      return allowed ? success(undefined) : failure('UNAUTHORIZED');
    }),
  };
  const collectiviteService = {
    isPrivate: vi.fn().mockResolvedValue(isPrivate),
  };
  return new IndicateurValeursReadAccessService(
    permissionService as never,
    collectiviteService as never
  );
};

describe('IndicateurValeursReadAccessService', () => {
  it('traite comme membre un utilisateur qui lit le confidentiel', async () => {
    const service = createService({
      canReadConfidentiel: true,
      canRead: true,
      isPrivate: true,
    });

    await expect(
      service.resolveReader({ collectiviteId: 1, user })
    ).resolves.toEqual(success('member'));
  });

  it('traite comme visiteur un utilisateur qui lit sans le confidentiel d’une collectivité publique', async () => {
    const service = createService({
      canReadConfidentiel: false,
      canRead: true,
      isPrivate: false,
    });

    await expect(
      service.resolveReader({ collectiviteId: 1, user })
    ).resolves.toEqual(success('visitor'));
  });

  it('refuse l’accès restreint à qui ne lit pas le confidentiel', async () => {
    const service = createService({
      canReadConfidentiel: false,
      canRead: true,
      isPrivate: true,
    });

    await expect(
      service.resolveReader({ collectiviteId: 1, user })
    ).resolves.toEqual(failure('READ_CONFIDENTIEL_DENIED'));
  });

  it('refuse qui ne peut pas lire les valeurs', async () => {
    const service = createService({
      canReadConfidentiel: false,
      canRead: false,
      isPrivate: false,
    });

    await expect(
      service.resolveReader({ collectiviteId: 1, user })
    ).resolves.toEqual(failure('READ_DENIED'));
  });
});
