import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { describe, expect, it, vi } from 'vitest';
import ValeursMoyenneService from './valeurs-moyenne.service';

const collectiviteId = 3;
const indicateurId = 10;
const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');
const options = { collectiviteId, indicateurId };

const toServiceWithMocks = ({
  isPrivate = success(false),
  permission = success(undefined),
  isApiKeyAllowed = success(undefined),
  typeCollectiviteRows = [] as unknown[],
  limit = vi.fn().mockResolvedValue(typeCollectiviteRows),
}: {
  isPrivate?: Awaited<ReturnType<CollectivitesService['isPrivate']>>;
  permission?: Awaited<ReturnType<PermissionService['isAllowed']>>;
  isApiKeyAllowed?: ReturnType<PermissionService['isApiKeyAllowed']>;
  typeCollectiviteRows?: unknown[];
  limit?: ReturnType<typeof vi.fn>;
}) => {
  const databaseService = {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ limit }),
        }),
      }),
    },
  } as unknown as DatabaseService;
  const isAllowed = vi.fn().mockResolvedValue(permission);
  const permissionService = {
    isAllowed,
    isApiKeyAllowed: vi.fn().mockReturnValue(isApiKeyAllowed),
  } as unknown as PermissionService;
  const collectiviteService = {
    isPrivate: vi.fn().mockResolvedValue(isPrivate),
  } as unknown as CollectivitesService;
  return {
    service: new ValeursMoyenneService(
      databaseService,
      permissionService,
      collectiviteService
    ),
    isAllowed,
  };
};

describe('ValeursMoyenneService.getMoyenneCollectivites', () => {
  it('retourne null pour une collectivité sans type', async () => {
    const { service } = toServiceWithMocks({ typeCollectiviteRows: [] });

    const result = await service.getMoyenneCollectivites(options, user);

    expect(result).toEqual(success(null));
  });

  it('ne vérifie aucun droit sans utilisateur', async () => {
    const { service, isAllowed } = toServiceWithMocks({});

    await service.getMoyenneCollectivites(options);

    expect(isAllowed).not.toHaveBeenCalled();
  });

  it('exige la lecture simple pour une collectivité publique', async () => {
    const { service, isAllowed } = toServiceWithMocks({});

    await service.getMoyenneCollectivites(options, user);

    expect(isAllowed).toHaveBeenCalledWith(
      user,
      'indicateurs.indicateurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
  });

  it('exige la lecture confidentielle pour une collectivité privée', async () => {
    const { service, isAllowed } = toServiceWithMocks({
      isPrivate: success(true),
    });

    await service.getMoyenneCollectivites(options, user);

    expect(isAllowed).toHaveBeenCalledWith(
      user,
      'indicateurs.indicateurs.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
  });

  it('refuse un utilisateur sans droit de lecture', async () => {
    const { service } = toServiceWithMocks({
      permission: failure('UNAUTHORIZED'),
    });

    const result = await service.getMoyenneCollectivites(options, user);

    expect(result).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation indicateurs.indicateurs.read sur la ressource ${ResourceType.COLLECTIVITE} ${collectiviteId}`
        )
      )
    );
  });

  it('refuse un utilisateur sans droit de lecture confidentielle d’une collectivité privée', async () => {
    const { service } = toServiceWithMocks({
      isPrivate: success(true),
      permission: failure('UNAUTHORIZED'),
    });

    const result = await service.getMoyenneCollectivites(options, user);

    expect(result).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation indicateurs.indicateurs.read_confidentiel sur la ressource ${ResourceType.COLLECTIVITE} ${collectiviteId}`
        )
      )
    );
  });

  it("refuse une clé d'api sans l'autorisation de lecture", async () => {
    const { service } = toServiceWithMocks({
      permission: failure('UNAUTHORIZED'),
      isApiKeyAllowed: failure('UNAUTHORIZED'),
    });

    const result = await service.getMoyenneCollectivites(options, user);

    expect(result).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          "Droits insuffisants, la clé d'api n'a pas l'autorisation indicateurs.indicateurs.read."
        )
      )
    );
  });

  it('propage l’échec DATABASE_ERROR de la lecture de la confidentialité', async () => {
    const cause = new Error('connexion perdue');
    const { service } = toServiceWithMocks({
      isPrivate: failure('DATABASE_ERROR', cause),
    });

    const result = await service.getMoyenneCollectivites(options, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('retourne NOT_FOUND pour une collectivité inconnue', async () => {
    const cause = new Error(`Collectivité avec l'identifiant 3 introuvable`);
    const { service } = toServiceWithMocks({
      isPrivate: failure('NOT_FOUND', cause),
    });

    const result = await service.getMoyenneCollectivites(options, user);

    expect(result).toEqual(failure('NOT_FOUND', cause));
  });

  it('convertit une exception de lecture en DATABASE_ERROR', async () => {
    const cause = new Error('connexion perdue');
    const { service } = toServiceWithMocks({
      limit: vi.fn().mockRejectedValue(cause),
    });

    const result = await service.getMoyenneCollectivites(options, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });
});
