import { describe, expect, it, vi } from 'vitest';
import { ListPlatformDefinitionsService } from './list-platform-definitions.service';

describe('ListPlatformDefinitionsService', () => {
  const context = { user: null };

  it('propage la transaction et représente les erreurs de lecture par un Result', async () => {
    const cause = new Error('database unavailable');
    const repository = {
      listPlatformDefinitions: vi.fn().mockRejectedValue(cause),
    };
    const service = new ListPlatformDefinitionsService(repository as never);
    const tx = { name: 'catalog-read' } as never;

    await expect(
      service.listPlatformDefinitions({}, { user: null, tx })
    ).resolves.toEqual({
      success: false,
      error: 'DATABASE_ERROR',
      cause,
    });
    expect(repository.listPlatformDefinitions).toHaveBeenCalledWith({}, tx);
  });
  it('délègue la lecture au repository', async () => {
    const definitions = [{ id: 1, periodicite: 'annuelle' }];
    const repository = {
      listPlatformDefinitionAggregates: vi.fn().mockResolvedValue(definitions),
    };
    const service = new ListPlatformDefinitionsService(repository as never);
    const input = { indicateurIds: [1] };

    await expect(
      service.listPlatformDefinitionAggregates(input, context)
    ).resolves.toEqual({ success: true, data: definitions });
    expect(repository.listPlatformDefinitionAggregates).toHaveBeenCalledWith(
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
      listPlatformDefinitions: vi.fn().mockResolvedValue(definitions),
    };
    const service = new ListPlatformDefinitionsService(repository as never);

    await expect(
      service.listPlatformDefinitionIdsByIdentifiantReferentiels(
        ['cae_1.a', 'cae_1.b'],
        context
      )
    ).resolves.toEqual({ success: true, data: { 'cae_1.a': 1, 'cae_1.b': 2 } });
    expect(repository.listPlatformDefinitions).toHaveBeenCalledWith(
      {
        identifiantsReferentiel: ['cae_1.a', 'cae_1.b'],
      },
      undefined
    );
  });

  it('préserve le court-circuit historique pour une liste vide', async () => {
    const repository = {
      listPlatformDefinitions: vi.fn(),
    };
    const service = new ListPlatformDefinitionsService(repository as never);

    await expect(
      service.listPlatformDefinitionIdsByIdentifiantReferentiels([], context)
    ).resolves.toEqual({ success: true, data: {} });
    expect(repository.listPlatformDefinitions).not.toHaveBeenCalled();
  });
});
