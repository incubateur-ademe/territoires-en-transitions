import { describe, expect, it, vi } from 'vitest';
import { ListIndicateursPredefinisService } from './list-indicateurs-predefinis.service';
import { failure, success } from '@tet/backend/utils/result.type';

describe('ListIndicateursPredefinisService', () => {
  const context = { user: null };

  it('propage la transaction et représente les erreurs de lecture par un Result', async () => {
    const cause = new Error('database unavailable');
    const repository = {
      listIndicateursPredefinis: vi.fn().mockRejectedValue(cause),
    };
    const service = new ListIndicateursPredefinisService(repository as never);
    const tx = { name: 'catalog-read' } as never;

    await expect(
      service.listIndicateursPredefinis({}, { user: null, tx })
    ).resolves.toEqual({
      success: false,
      error: 'DATABASE_ERROR',
      cause,
    });
    expect(repository.listIndicateursPredefinis).toHaveBeenCalledWith({}, tx);
  });
  it('délègue la lecture au repository', async () => {
    const definitions = [{ id: 1, periodicite: 'annuelle' }];
    const repository = {
      listIndicateursPredefinisAggregates: vi
        .fn()
        .mockResolvedValue(success(definitions)),
    };
    const service = new ListIndicateursPredefinisService(repository as never);
    const input = { indicateurIds: [1] };

    await expect(
      service.listIndicateursPredefinisAggregates(input, context)
    ).resolves.toEqual({ success: true, data: definitions });
    expect(repository.listIndicateursPredefinisAggregates).toHaveBeenCalledWith(
      input,
      undefined
    );
  });

  it('expose les définitions simples sans exposer le repository hors du domaine', async () => {
    const definitions = [
      { id: 1, identifiantReferentiel: 'cae_1.a' },
      { id: 2, identifiantReferentiel: 'cae_1.b' },
    ];
    const repository = {
      listIndicateursPredefinis: vi
        .fn()
        .mockResolvedValue(success(definitions)),
    };
    const service = new ListIndicateursPredefinisService(repository as never);

    await expect(
      service.listIndicateursPredefinisIdsByIdentifiantReferentiels(
        ['cae_1.a', 'cae_1.b'],
        context
      )
    ).resolves.toEqual({ success: true, data: { 'cae_1.a': 1, 'cae_1.b': 2 } });
    expect(repository.listIndicateursPredefinis).toHaveBeenCalledWith(
      {
        identifiantsReferentiel: ['cae_1.a', 'cae_1.b'],
      },
      undefined
    );
  });

  it('propage l’échec de nature renvoyé par le repository', async () => {
    const natureFailure = failure(
      'DATABASE_ERROR',
      new Error('Indicateur 2 : nature incohérente (PERSO_WITH_GROUPEMENT)')
    );
    const repository = {
      listIndicateursPredefinis: vi.fn().mockResolvedValue(natureFailure),
    };
    const service = new ListIndicateursPredefinisService(repository as never);

    await expect(
      service.listIndicateursPredefinis({}, context)
    ).resolves.toEqual(natureFailure);
  });

  it('préserve le court-circuit historique pour une liste vide', async () => {
    const repository = {
      listIndicateursPredefinis: vi.fn(),
    };
    const service = new ListIndicateursPredefinisService(repository as never);

    await expect(
      service.listIndicateursPredefinisIdsByIdentifiantReferentiels([], context)
    ).resolves.toEqual({ success: true, data: {} });
    expect(repository.listIndicateursPredefinis).not.toHaveBeenCalled();
  });
});
