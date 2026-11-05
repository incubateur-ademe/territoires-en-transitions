import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { FicheAccessModeEnum } from '@tet/backend/plans/fiches/share-fiches/fiche-access-mode.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { UpsertIndicateurFichesRepository } from './upsert-indicateur-fiches.repository';
import { UpsertIndicateurFichesService } from './upsert-indicateur-fiches.service';

describe('UpsertIndicateurFichesService', () => {
  const tx = {} as Transaction;
  const user = { id: 'user-id' } as AuthenticatedUser;
  const input = { indicateurId: 1, collectiviteId: 2, ficheIds: [3] };

  function setup(existingFicheIds: number[] = []) {
    const repository = {
      areFichesInCollectiviteScope: vi.fn().mockResolvedValue(true),
      listIndicateurFicheIds: vi.fn().mockResolvedValue(existingFicheIds),
      upsertIndicateurFiches: vi.fn().mockResolvedValue(undefined),
    };
    const transactionManager = {
      executeSingle: vi.fn(
        async (
          operation: (currentTx: Transaction) => Promise<unknown>,
          currentTx?: Transaction
        ) => operation(currentTx ?? tx)
      ),
    };
    const permissions = {
      canWriteFiche: vi.fn().mockResolvedValue(FicheAccessModeEnum.SHARED),
    };
    const service = new UpsertIndicateurFichesService(
      repository as unknown as UpsertIndicateurFichesRepository,
      transactionManager as unknown as TransactionManager,
      permissions as unknown as FicheActionPermissionsService
    );

    return { service, repository, transactionManager, permissions };
  }

  it('reuses the caller transaction for scope, permission checks and writes', async () => {
    const { service, repository, transactionManager, permissions } = setup();

    await service.upsertIndicateurFiches(input, { user, tx });

    expect(transactionManager.executeSingle).toHaveBeenCalledWith(
      expect.any(Function),
      tx
    );
    expect(repository.areFichesInCollectiviteScope).toHaveBeenCalledWith(
      [3],
      2,
      tx
    );
    expect(repository.listIndicateurFicheIds).toHaveBeenCalledWith(
      { indicateurId: 1, collectiviteId: 2 },
      tx
    );
    expect(permissions.canWriteFiche).toHaveBeenCalledWith(3, user, tx, true);
    expect(repository.upsertIndicateurFiches).toHaveBeenCalledWith(
      { ...input, ficheIdsToUnlink: [], createdBy: user.id },
      tx
    );
  });

  it('rejects a fiche outside the owned or shared scope before writing', async () => {
    const { service, repository, permissions } = setup();
    repository.areFichesInCollectiviteScope.mockResolvedValue(false);

    await expect(
      service.upsertIndicateurFiches(input, { user })
    ).resolves.toEqual({ success: false, error: 'FICHES_OUT_OF_SCOPE' });

    expect(permissions.canWriteFiche).not.toHaveBeenCalled();
    expect(repository.upsertIndicateurFiches).not.toHaveBeenCalled();
  });

  it('only authorizes changed links and preserves a retained read-only fiche', async () => {
    const { service, repository, permissions } = setup([3, 4]);
    permissions.canWriteFiche.mockImplementation(async (ficheId) =>
      ficheId === 3 ? null : FicheAccessModeEnum.SHARED
    );

    await service.upsertIndicateurFiches(
      { ...input, ficheIds: [3, 5, 5] },
      { user }
    );

    expect(permissions.canWriteFiche.mock.calls).toEqual([
      [5, user, tx, true],
      [4, user, tx, true],
    ]);
    expect(repository.upsertIndicateurFiches).toHaveBeenCalledWith(
      { ...input, ficheIds: [5], ficheIdsToUnlink: [4], createdBy: user.id },
      tx
    );
  });

  it.each(['link', 'unlink'])(
    'requires write permission to %s a shared fiche',
    async (operation) => {
      const { service, repository, permissions } = setup(
        operation === 'unlink' ? [3] : []
      );
      permissions.canWriteFiche.mockResolvedValue(null);

      await expect(
        service.upsertIndicateurFiches(
          { ...input, ficheIds: operation === 'unlink' ? [] : [3] },
          { user }
        )
      ).resolves.toEqual({ success: false, error: 'UNAUTHORIZED' });

      expect(repository.upsertIndicateurFiches).not.toHaveBeenCalled();
    }
  );
});
