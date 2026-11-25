import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ListIndicateurValeursService } from './list-indicateur-valeurs.service';

const context = { isUserTrusted: true as const };
const options = { collectiviteId: 1 } as Parameters<
  ListIndicateurValeursService['get']
>[0];

const makeService = (listIndicateurValeurs: ReturnType<typeof vi.fn>) =>
  new ListIndicateurValeursService(
    { listIndicateurValeurs } as never,
    {} as never,
    {} as never,
    {} as never
  );

describe('ListIndicateurValeursService.get', () => {
  it('rend les valeurs lues', async () => {
    const valeurs = [{ indicateurValeur: { id: 1 } }];
    const service = makeService(vi.fn().mockResolvedValue(success(valeurs)));

    await expect(
      service.get({ ...options, ignoreDedoublonnage: true }, context)
    ).resolves.toEqual(success(valeurs));
  });

  it('propage l’échec de nature renvoyé par le repository', async () => {
    const natureFailure = failure(
      'DATABASE_ERROR',
      new Error('Indicateur 7 : nature incohérente (PERSO_WITH_GROUPEMENT)')
    );
    const service = makeService(vi.fn().mockResolvedValue(natureFailure));

    await expect(service.get(options, context)).resolves.toEqual(natureFailure);
  });

  it.each([
    ['READ_DENIED', 'indicateurs.valeurs.read'],
    ['READ_CONFIDENTIEL_DENIED', 'indicateurs.valeurs.read_confidentiel'],
  ] as const)(
    'refuse un utilisateur dont l’accès est %s en citant l’autorisation %s',
    async (denial, permission) => {
      const listIndicateurValeurs = vi.fn();
      const service = new ListIndicateurValeursService(
        { listIndicateurValeurs } as never,
        { resolveReader: vi.fn().mockResolvedValue(failure(denial)) } as never,
        {} as never,
        {} as never
      );

      const result = await service.list(
        { ...options, indicateurIds: [1] },
        { user: { id: 'user-1' } as never }
      );

      expect(result).toEqual(
        failure(
          'UNAUTHORIZED',
          new Error(
            `Droits insuffisants, l'utilisateur user-1 n'a pas l'autorisation ${permission} sur la ressource Collectivité 1`
          )
        )
      );
      expect(listIndicateurValeurs).not.toHaveBeenCalled();
    }
  );

  it('représente une exception de lecture par un échec', async () => {
    const cause = new Error('connexion perdue');
    const service = makeService(vi.fn().mockRejectedValue(cause));

    await expect(service.get(options, context)).resolves.toEqual(
      failure('DATABASE_ERROR', cause)
    );
  });

  it('refuse un appel sans utilisateur ni capacité interne', async () => {
    const listIndicateurValeurs = vi.fn();
    const service = makeService(listIndicateurValeurs);

    const result = await service.list(
      { ...options, indicateurIds: [1] },
      {} as never
    );

    expect(result).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          'Un contexte utilisateur ou une capacité interne explicite est requis pour lire les valeurs de la collectivité 1'
        )
      )
    );
    expect(listIndicateurValeurs).not.toHaveBeenCalled();
  });

  it('refuse une lecture sans indicateurIds ni identifiantsReferentiel', async () => {
    const listIndicateurValeurs = vi.fn();
    const service = makeService(listIndicateurValeurs);

    const result = await service.list(options, { isUserTrusted: true });

    expect(result).toEqual(
      failure(
        'INVALID_VALUE',
        new Error('indicateurIds or identifiantsReferentiel required')
      )
    );
    expect(listIndicateurValeurs).not.toHaveBeenCalled();
  });

  it('propage l’échec de lecture des valeurs', async () => {
    const cause = new Error('lecture impossible');
    const service = makeService(
      vi.fn().mockResolvedValue(failure('DATABASE_ERROR', cause))
    );

    const result = await service.list(
      { ...options, indicateurIds: [1] },
      { isUserTrusted: true }
    );

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('propage l’échec de lecture des définitions', async () => {
    const cause = new Error('définitions illisibles');
    const service = new ListIndicateurValeursService(
      {
        listIndicateurValeurs: vi.fn().mockResolvedValue(success([])),
      } as never,
      {} as never,
      {
        listCollectiviteIndicateurs: vi
          .fn()
          .mockResolvedValue(failure('DATABASE_ERROR', cause)),
      } as never,
      { filterSourcesSnbc3: vi.fn().mockResolvedValue([]) } as never
    );

    const result = await service.list(
      { ...options, indicateurIds: [1] },
      { isUserTrusted: true }
    );

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('représente une exception levée pendant la liste par un échec', async () => {
    const cause = new Error('flag illisible');
    const service = new ListIndicateurValeursService(
      {
        listIndicateurValeurs: vi.fn().mockResolvedValue(success([])),
      } as never,
      {} as never,
      {} as never,
      { filterSourcesSnbc3: vi.fn().mockRejectedValue(cause) } as never
    );

    const result = await service.list(
      { ...options, indicateurIds: [1] },
      { isUserTrusted: true }
    );

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });
});
