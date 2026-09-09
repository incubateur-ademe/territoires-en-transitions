import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { HandleDefinitionFichesRepository } from './handle-definition-fiches.repository';
import { HandleDefinitionFichesService } from './handle-definition-fiches.service';

describe('HandleDefinitionFichesService', () => {
  it('delegates transaction ownership and reuses the caller transaction', async () => {
    const repository = {
      areFichesOwnedByCollectivite: vi.fn().mockResolvedValue(true),
      upsertIndicateurFiches: vi.fn().mockResolvedValue(undefined),
    } as unknown as HandleDefinitionFichesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (
          operation: (currentTx: Transaction) => Promise<unknown>,
          currentTx?: Transaction
        ) => operation(currentTx ?? tx)
      ),
    } as unknown as TransactionManager;
    const service = new HandleDefinitionFichesService(
      repository,
      transactionManager
    );

    const input = { indicateurId: 1, collectiviteId: 2, ficheIds: [] };

    await service.upsertIndicateurFiches(input, tx);

    expect(transactionManager.executeSingle).toHaveBeenCalledWith(
      expect.any(Function),
      tx
    );
    expect(repository.upsertIndicateurFiches).toHaveBeenCalledWith(input, tx);
  });

  it("refuse une fiche qui n'appartient pas à la collectivité", async () => {
    const repository = {
      areFichesOwnedByCollectivite: vi.fn().mockResolvedValue(false),
      upsertIndicateurFiches: vi.fn(),
    } as unknown as HandleDefinitionFichesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (operation: (currentTx: Transaction) => Promise<unknown>) =>
          operation(tx)
      ),
    } as unknown as TransactionManager;
    const service = new HandleDefinitionFichesService(
      repository,
      transactionManager
    );

    await expect(
      service.upsertIndicateurFiches({
        indicateurId: 1,
        collectiviteId: 2,
        ficheIds: [3],
      })
    ).rejects.toThrow(/fiches doivent appartenir/i);
    expect(repository.upsertIndicateurFiches).not.toHaveBeenCalled();
  });
});
