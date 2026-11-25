import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { UpsertGridValeursService } from './upsert-grid-valeurs.service';

const collectiviteId = 3;
const indicateurId = 10;
const tx = {};
const user = {
  ...buildRequesterUser('00000000-0000-0000-0000-000000000001'),
  role: 'authenticated',
};
const indicateur = {
  id: indicateurId,
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
};
const savedValeur = { id: 1, collectiviteId, indicateurId, resultat: 42 };
const calculatedValeur = { ...savedValeur, id: 2, indicateurId: 11 };

const toServiceWithMocks = ({
  nestedUpsert,
  validation = success({ [indicateurId]: { precision: 2 } }),
  gridUpsert = success([savedValeur]),
  lock = vi.fn(),
  rawManagerError,
  publish = vi.fn().mockResolvedValue(undefined),
}: {
  nestedUpsert?: unknown;
  validation?: unknown;
  gridUpsert?: unknown;
  lock?: ReturnType<typeof vi.fn>;
  rawManagerError?: unknown;
  publish?: ReturnType<typeof vi.fn>;
}) => {
  const manage = {
    canMutateValeurs: vi.fn().mockResolvedValue(success(undefined)),
    upsertIndicateurValeurs: vi.fn().mockResolvedValue(nestedUpsert),
    publishValeurUpsertedEvents: publish,
  };
  const transactionManager = {
    executeSingle: vi.fn(
      async (operation: (tx: unknown) => Promise<Result<unknown, unknown>>) => {
        if (rawManagerError !== undefined) return failure(rawManagerError);
        try {
          const result = await operation(tx);
          return result.success
            ? success(result.data)
            : failure(result.error, result.cause);
        } catch (error) {
          return failure(error);
        }
      }
    ),
  };
  const service = new UpsertGridValeursService(
    transactionManager as never,
    manage as never,
    {
      listIndicateurs: vi
        .fn()
        .mockResolvedValue(success({ data: [indicateur] })),
    } as never,
    { updateIndicateursModifiedFields: vi.fn() } as never,
    {
      updateCalculatedIndicateurValeurs: vi
        .fn()
        .mockResolvedValue(success([calculatedValeur])),
    } as never,
    { lock } as never,
    { validate: vi.fn().mockResolvedValue(validation) } as never,
    { upsert: vi.fn().mockResolvedValue(gridUpsert) } as never
  );
  return { service, manage };
};

const input = {
  collectiviteId,
  valeurs: [
    {
      indicateurId,
      period: {
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateDebut: '2025-01-01',
      },
      resultat: 42,
    },
  ],
} as never;

describe('UpsertGridValeursService.upsertGridValeurs', () => {
  it.each([
    { error: 'INVALID_VALUE', expected: 'INVALID_GRID_VALEUR' },
    { error: 'INDICATEUR_NOT_AVAILABLE', expected: 'INVALID_GRID_VALEUR' },
    { error: 'PERIODICITE_MISMATCH', expected: 'INVALID_GRID_VALEUR' },
    { error: 'USER_VALUE_NOT_ALLOWED', expected: 'USER_VALUE_NOT_ALLOWED' },
    { error: 'UNAUTHORIZED', expected: 'UNAUTHORIZED' },
  ] as const)(
    "retourne l'échec $error des valeurs calculées en $expected, sans publier d'événement",
    async ({ error, expected }) => {
      const cause = new Error('détail précis');
      const { service, manage } = toServiceWithMocks({
        nestedUpsert: failure(error, cause),
      });

      const result = await service.upsertGridValeurs(input, {
        user: user as never,
      });

      expect(result).toEqual(failure(expected, cause));
      expect(manage.publishValeurUpsertedEvents).not.toHaveBeenCalled();
    }
  );

  it.each(['INDICATEUR_NOT_AVAILABLE', 'PERIODICITE_MISMATCH'] as const)(
    "retourne l'échec de validation %s en code de grille sans écrire de valeurs calculées",
    async (error) => {
      const cause = new Error('détail précis');
      const { service, manage } = toServiceWithMocks({
        validation: failure(error, cause),
      });

      const result = await service.upsertGridValeurs(input, {
        user: user as never,
      });

      expect(result).toEqual(failure('INVALID_GRID_VALEUR', cause));
      expect(manage.upsertIndicateurValeurs).not.toHaveBeenCalled();
    }
  );

  it('publie les événements et retourne les valeurs enregistrées quand les valeurs calculées réussissent', async () => {
    const { service, manage } = toServiceWithMocks({
      nestedUpsert: success([calculatedValeur]),
    });

    const result = await service.upsertGridValeurs(input, {
      user: user as never,
    });

    expect(result).toEqual(success([savedValeur]));
    expect(manage.upsertIndicateurValeurs).toHaveBeenCalledWith(
      [calculatedValeur],
      { user, isUserTrusted: true, tx }
    );
    expect(manage.publishValeurUpsertedEvents).toHaveBeenCalledWith(
      [savedValeur, calculatedValeur],
      user
    );
  });

  it("retourne l'échec d'écriture de la grille sans écrire de valeurs calculées ni publier d'événement", async () => {
    const cause = new Error(
      "Échec de l'écriture d'un lot de 1 valeurs d'indicateur"
    );
    const { service, manage } = toServiceWithMocks({
      gridUpsert: failure('DATABASE_ERROR', cause),
    });

    const result = await service.upsertGridValeurs(input, {
      user: user as never,
    });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
    expect(manage.upsertIndicateurValeurs).not.toHaveBeenCalled();
    expect(manage.publishValeurUpsertedEvents).not.toHaveBeenCalled();
  });

  it("convertit une exception imprévue de l'écriture en DATABASE_ERROR, sans écrire de valeurs calculées ni publier d'événement", async () => {
    const cause = new Error('interblocage');
    const { service, manage } = toServiceWithMocks({
      lock: vi.fn().mockRejectedValue(cause),
    });

    const result = await service.upsertGridValeurs(input, {
      user: user as never,
    });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
    expect(manage.upsertIndicateurValeurs).not.toHaveBeenCalled();
    expect(manage.publishValeurUpsertedEvents).not.toHaveBeenCalled();
  });

  it("garde le succès quand la publication des événements échoue après l'écriture", async () => {
    const { service } = toServiceWithMocks({
      nestedUpsert: success([calculatedValeur]),
      publish: vi.fn().mockRejectedValue(new Error('listener en échec')),
    });

    const result = await service.upsertGridValeurs(input, {
      user: user as never,
    });

    expect(result).toEqual(success([savedValeur]));
  });

  it.each([
    { raw: new Error('commit refusé'), cause: new Error('commit refusé') },
    { raw: 'commit refusé', cause: new Error('commit refusé') },
  ])(
    'convertit une erreur brute du gestionnaire de transaction ($raw) en DATABASE_ERROR',
    async ({ raw, cause }) => {
      const { service, manage } = toServiceWithMocks({ rawManagerError: raw });

      const result = await service.upsertGridValeurs(input, {
        user: user as never,
      });

      expect(result).toEqual(
        failure('DATABASE_ERROR', raw instanceof Error ? raw : cause)
      );
      expect(manage.publishValeurUpsertedEvents).not.toHaveBeenCalled();
    }
  );
});
