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

  describe('listSousIndicateursBecomingAutonomous', () => {
    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      role: AuthRole.AUTHENTICATED,
    } as never;

    const createService = ({ isAllowed }: { isAllowed: boolean }) => {
      const repository = {
        listSousIndicateurs: vi.fn(async () => [
          { id: 7, parentId: 42 },
          { id: 8, parentId: 42 },
        ]),
      };
      const permissionService = {
        isAllowed: vi
          .fn()
          .mockResolvedValue(
            isAllowed
              ? { success: true, data: undefined }
              : { success: false, error: 'FORBIDDEN' }
          ),
      };
      const service = new DeleteIndicateurService(
        {} as never,
        repository as never,
        permissionService as never,
        {} as never
      );
      return { service, repository };
    };

    it('renvoie les identifiants des sous-indicateurs du parent', async () => {
      const { service, repository } = createService({ isAllowed: true });

      await expect(
        service.listSousIndicateursBecomingAutonomous(
          { indicateurId: 42, collectiviteId: 1 },
          { user }
        )
      ).resolves.toEqual({ success: true, data: [7, 8] });

      expect(repository.listSousIndicateurs).toHaveBeenCalledWith(
        { parentId: 42, collectiviteId: 1 },
        undefined
      );
    });

    it('refuse sans le droit de supprimer et ne lit rien', async () => {
      const { service, repository } = createService({ isAllowed: false });

      await expect(
        service.listSousIndicateursBecomingAutonomous(
          { indicateurId: 42, collectiviteId: 1 },
          { user }
        )
      ).resolves.toEqual({ success: false, error: 'UNAUTHORIZED' });

      expect(repository.listSousIndicateurs).not.toHaveBeenCalled();
    });
  });
});
