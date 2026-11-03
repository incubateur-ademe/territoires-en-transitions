import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { UpsertIndicateurServicesRepository } from './upsert-indicateur-services.repository';
import { UpsertIndicateurServicesService } from './upsert-indicateur-services.service';

describe('UpsertIndicateurServicesService', () => {
  it('delegates transaction ownership and reuses the caller transaction', async () => {
    const repository = {
      areServicesOwnedByCollectivite: vi.fn().mockResolvedValue(true),
      upsertIndicateurServices: vi.fn().mockResolvedValue(undefined),
    } as unknown as UpsertIndicateurServicesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (
          operation: (currentTx: Transaction) => Promise<unknown>,
          currentTx?: Transaction
        ) => operation(currentTx ?? tx)
      ),
    } as unknown as TransactionManager;
    const service = new UpsertIndicateurServicesService(
      repository,
      {} as PermissionService,
      transactionManager
    );

    const input = { indicateurId: 1, collectiviteId: 2, serviceIds: [] };

    await service.upsertIndicateurServices(input, tx);

    expect(transactionManager.executeSingle).toHaveBeenCalledWith(
      expect.any(Function),
      tx
    );
    expect(repository.upsertIndicateurServices).toHaveBeenCalledWith(input, tx);
  });

  it("refuse un service qui n'appartient pas à la collectivité", async () => {
    const repository = {
      areServicesOwnedByCollectivite: vi.fn().mockResolvedValue(false),
      upsertIndicateurServices: vi.fn(),
    } as unknown as UpsertIndicateurServicesRepository;
    const tx = {} as Transaction;
    const transactionManager = {
      executeSingle: vi.fn(
        async (operation: (currentTx: Transaction) => Promise<unknown>) =>
          operation(tx)
      ),
    } as unknown as TransactionManager;
    const service = new UpsertIndicateurServicesService(
      repository,
      {} as PermissionService,
      transactionManager
    );

    await expect(
      service.upsertIndicateurServices({
        indicateurId: 1,
        collectiviteId: 2,
        serviceIds: [3],
      })
    ).rejects.toThrow(/services doivent appartenir/i);
    expect(repository.upsertIndicateurServices).not.toHaveBeenCalled();
  });
});
