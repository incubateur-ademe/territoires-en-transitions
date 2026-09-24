import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { HandleDefinitionPilotesRepository } from './handle-definition-pilotes.repository';
import { HandleDefinitionPilotesService } from './handle-definition-pilotes.service';

describe('HandleDefinitionPilotesService', () => {
  it('retains an assigned user without requiring active membership again', async () => {
    const userId = crypto.randomUUID();
    const repository = {
      listIndicateurPiloteUserIds: vi.fn().mockResolvedValue([userId]),
      arePilotesInCollectivite: vi.fn().mockResolvedValue(true),
      upsertIndicateurPilotes: vi.fn().mockResolvedValue(undefined),
    } as unknown as HandleDefinitionPilotesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (operation: (currentTx: Transaction) => Promise<unknown>) =>
          operation(tx)
      ),
    } as unknown as TransactionManager;
    const service = new HandleDefinitionPilotesService(
      repository,
      {} as PermissionService,
      transactionManager
    );
    const input = {
      indicateurId: 1,
      collectiviteId: 2,
      pilotes: [{ userId }],
    };

    await service.upsertIndicateurPilotes(input, tx);

    expect(repository.listIndicateurPiloteUserIds).toHaveBeenCalledWith(
      { indicateurId: 1, collectiviteId: 2 },
      tx
    );
    expect(repository.arePilotesInCollectivite).toHaveBeenCalledWith([], 2, tx);
    expect(repository.upsertIndicateurPilotes).toHaveBeenCalledWith(input, tx);
  });

  it('still validates additions when retaining a departed pilote', async () => {
    const previousUserId = crypto.randomUUID();
    const newUserId = crypto.randomUUID();
    const repository = {
      listIndicateurPiloteUserIds: vi.fn().mockResolvedValue([previousUserId]),
      arePilotesInCollectivite: vi.fn().mockResolvedValue(false),
      upsertIndicateurPilotes: vi.fn(),
    } as unknown as HandleDefinitionPilotesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (operation: (currentTx: Transaction) => Promise<unknown>) =>
          operation(tx)
      ),
    } as unknown as TransactionManager;
    const service = new HandleDefinitionPilotesService(
      repository,
      {} as PermissionService,
      transactionManager
    );

    await expect(
      service.upsertIndicateurPilotes({
        indicateurId: 1,
        collectiviteId: 2,
        pilotes: [{ userId: previousUserId }, { userId: newUserId }],
      })
    ).rejects.toThrow(/pilotes doivent appartenir/i);

    expect(repository.arePilotesInCollectivite).toHaveBeenCalledWith(
      [{ userId: newUserId }],
      2,
      tx
    );
    expect(repository.upsertIndicateurPilotes).not.toHaveBeenCalled();
  });

  it('delegates transaction ownership and reuses the caller transaction', async () => {
    const repository = {
      arePilotesInCollectivite: vi.fn().mockResolvedValue(true),
      upsertIndicateurPilotes: vi.fn().mockResolvedValue(undefined),
    } as unknown as HandleDefinitionPilotesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (
          operation: (currentTx: Transaction) => Promise<unknown>,
          currentTx?: Transaction
        ) => operation(currentTx ?? tx)
      ),
    } as unknown as TransactionManager;
    const service = new HandleDefinitionPilotesService(
      repository,
      {} as PermissionService,
      transactionManager
    );

    const input = {
      indicateurId: 1,
      collectiviteId: 2,
      pilotes: [],
    };

    await service.upsertIndicateurPilotes(input, tx);

    expect(transactionManager.executeSingle).toHaveBeenCalledWith(
      expect.any(Function),
      tx
    );
    expect(repository.upsertIndicateurPilotes).toHaveBeenCalledWith(input, tx);
  });

  it("refuse un pilote qui n'appartient pas à la collectivité", async () => {
    const repository = {
      arePilotesInCollectivite: vi.fn().mockResolvedValue(false),
      upsertIndicateurPilotes: vi.fn(),
    } as unknown as HandleDefinitionPilotesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (operation: (currentTx: Transaction) => Promise<unknown>) =>
          operation(tx)
      ),
    } as unknown as TransactionManager;
    const service = new HandleDefinitionPilotesService(
      repository,
      {} as PermissionService,
      transactionManager
    );

    await expect(
      service.upsertIndicateurPilotes({
        indicateurId: 1,
        collectiviteId: 2,
        pilotes: [{ tagId: 3 }],
      })
    ).rejects.toThrow(/pilotes doivent appartenir/i);
    expect(repository.upsertIndicateurPilotes).not.toHaveBeenCalled();
  });
});
