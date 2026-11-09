import { failure, success } from '@tet/backend/utils/result.type';
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

  it('représente une exception de lecture par un échec', async () => {
    const cause = new Error('connexion perdue');
    const service = makeService(vi.fn().mockRejectedValue(cause));

    await expect(service.get(options, context)).resolves.toEqual(
      failure('DATABASE_ERROR', cause)
    );
  });
});
