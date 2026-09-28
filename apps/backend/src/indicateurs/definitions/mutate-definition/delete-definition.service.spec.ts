import { AuthRole } from '@tet/backend/users/models/auth.models';
import { describe, expect, it, vi } from 'vitest';
import { DeleteDefinitionService } from './delete-definition.service';

describe('DeleteDefinitionService', () => {
  it('verrouille le graphe avant de supprimer une définition', async () => {
    const events: string[] = [];
    const tx = { name: 'tx' };
    const transactionManager = {
      executeSingle: vi.fn(
        (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx)
      ),
    };
    const repository = {
      deletePersonalizedDefinition: vi.fn(async () => {
        events.push('delete-definition');
        return true;
      }),
    };
    const permissionService = {
      assertAllowed: vi.fn().mockResolvedValue(undefined),
    };
    const definitionLockRepository = {
      lockForDefinitionMutation: vi.fn(async () => {
        events.push('lock-graph');
      }),
    };
    const service = new DeleteDefinitionService(
      transactionManager as never,
      repository as never,
      permissionService as never,
      definitionLockRepository as never
    );

    await expect(
      service.deleteIndicateurPerso({ indicateurId: 42, collectiviteId: 1 }, {
        id: '00000000-0000-0000-0000-000000000001',
        role: AuthRole.AUTHENTICATED,
      } as never)
    ).resolves.toBeUndefined();

    expect(events).toEqual(['lock-graph', 'delete-definition']);
    expect(
      definitionLockRepository.lockForDefinitionMutation
    ).toHaveBeenCalledWith(tx);
    expect(repository.deletePersonalizedDefinition).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1 },
      tx
    );
  });
});
