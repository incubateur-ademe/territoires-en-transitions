import { AuthRole } from '@tet/backend/users/models/auth.models';
import { describe, expect, it, vi } from 'vitest';
import CreateDefinitionService from './create-definition.service';

describe('CreateDefinitionService', () => {
  it('verrouille le graphe avant toute insertion de définition', async () => {
    const events: string[] = [];
    const tx = { name: 'tx' };
    const transactionManager = {
      executeSingle: vi.fn(
        (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx)
      ),
    };
    const repository = {
      createPersonalizedDefinition: vi.fn(async () => {
        events.push('insert-definition');
        return 42;
      }),
    };
    const permissionService = {
      assertAllowed: vi.fn().mockResolvedValue(undefined),
    };
    const periodiciteAvailabilityService = {
      checkAvailable: vi
        .fn()
        .mockResolvedValue({ success: true, data: undefined }),
    };
    const definitionLockRepository = {
      lockForDefinitionMutation: vi.fn(async () => {
        events.push('lock-graph');
      }),
    };
    const handleDefinitionFichesService = {
      upsertIndicateurFiches: vi.fn().mockResolvedValue(undefined),
    };
    const service = new CreateDefinitionService(
      transactionManager as never,
      repository as never,
      permissionService as never,
      periodiciteAvailabilityService as never,
      definitionLockRepository as never,
      handleDefinitionFichesService as never
    );

    await expect(
      service.createIndicateurPerso(
        {
          collectiviteId: 1,
          titre: 'Indicateur mensuel',
          unite: 't',
          periodicite: 'mensuelle',
          thematiques: [],
          estFavori: false,
          estConfidentiel: true,
          ficheId: 9,
        },
        {
          id: '00000000-0000-0000-0000-000000000001',
          role: AuthRole.AUTHENTICATED,
        } as never
      )
    ).resolves.toBe(42);

    expect(events).toEqual(['lock-graph', 'insert-definition']);
    expect(
      definitionLockRepository.lockForDefinitionMutation
    ).toHaveBeenCalledWith(tx);
    expect(repository.createPersonalizedDefinition).toHaveBeenCalledWith(
      {
        collectiviteId: 1,
        titre: 'Indicateur mensuel',
        unite: 't',
        periodicite: 'mensuelle',
        thematiqueIds: [],
        commentaire: undefined,
        estFavori: false,
        estConfidentiel: true,
        modifiedBy: '00000000-0000-0000-0000-000000000001',
      },
      tx
    );
    expect(
      handleDefinitionFichesService.upsertIndicateurFiches
    ).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, ficheIds: [9] },
      tx
    );
  });
});
