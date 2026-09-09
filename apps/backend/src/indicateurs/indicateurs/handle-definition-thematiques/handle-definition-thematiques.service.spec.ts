import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { HandleDefinitionThematiquesRepository } from './handle-definition-thematiques.repository';
import { HandleDefinitionThematiquesService } from './handle-definition-thematiques.service';

describe('HandleDefinitionThematiquesService', () => {
  it('delegates transaction ownership and reuses the caller transaction', async () => {
    const repository = {
      upsertIndicateurThematiques: vi.fn().mockResolvedValue(undefined),
    } as unknown as HandleDefinitionThematiquesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (
          operation: (currentTx: Transaction) => Promise<unknown>,
          currentTx?: Transaction
        ) => operation(currentTx ?? tx)
      ),
    } as unknown as TransactionManager;
    const service = new HandleDefinitionThematiquesService(
      repository,
      {} as PermissionService,
      transactionManager
    );

    const input = { indicateurId: 1, thematiqueIds: [] };

    await service.upsertIndicateurThematiques(input, tx);

    expect(transactionManager.executeSingle).toHaveBeenCalledWith(
      expect.any(Function),
      tx
    );
    expect(repository.upsertIndicateurThematiques).toHaveBeenCalledWith(
      input,
      tx
    );
  });
});
