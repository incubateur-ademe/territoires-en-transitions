import { AuthRole } from '@tet/backend/users/models/auth.models';
import { describe, expect, it, vi } from 'vitest';
import { DeleteIndicateurService } from './delete-indicateur.service';

describe('DeleteIndicateurService', () => {
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
      deleteIndicateurPerso: vi.fn(async () => {
        events.push('delete-indicateur');
        return true;
      }),
    };
    const permissionService = {
      assertAllowed: vi.fn().mockResolvedValue(undefined),
    };
    const indicateurLockRepository = {
      lockForIndicateurMutation: vi.fn(async () => {
        events.push('lock-graph');
      }),
    };
    const service = new DeleteIndicateurService(
      transactionManager as never,
      repository as never,
      permissionService as never,
      indicateurLockRepository as never
    );

    await expect(
      service.deleteIndicateurPerso({ indicateurId: 42, collectiviteId: 1 }, {
        id: '00000000-0000-0000-0000-000000000001',
        role: AuthRole.AUTHENTICATED,
      } as never)
    ).resolves.toBeUndefined();

    expect(events).toEqual(['lock-graph', 'delete-indicateur']);
    expect(
      indicateurLockRepository.lockForIndicateurMutation
    ).toHaveBeenCalledWith(tx);
    expect(repository.deleteIndicateurPerso).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1 },
      tx
    );
  });
});
