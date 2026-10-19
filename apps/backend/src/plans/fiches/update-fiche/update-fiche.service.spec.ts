import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { ApplicationSousScopesEnum } from '@tet/domain/utils';
import { describe, expect, it, vi } from 'vitest';
import UpdateFicheService from './update-fiche.service';

function createService() {
  const transaction = {} as Transaction;
  let committed = false;
  const database = {
    db: {
      transaction: async (operation: (tx: Transaction) => Promise<unknown>) => {
        const result = await operation(transaction);
        committed = true;
        return result;
      },
    },
  } as unknown as DatabaseService;
  const webhook = {
    sendWebhookNotification: vi.fn().mockResolvedValue(undefined),
  };
  const fiche = { id: 12, titre: 'Action mise à jour' };
  const dependencies = [
    webhook,
    { getFicheById: vi.fn().mockResolvedValue(success(fiche)) },
    { canWriteFiche: vi.fn().mockResolvedValue(undefined) },
    {},
    {},
    { applyUpdate: vi.fn().mockResolvedValue(success(undefined)) },
    new TransactionManager(database),
    {},
    database,
  ] as unknown as ConstructorParameters<typeof UpdateFicheService>;
  return {
    service: new UpdateFicheService(...dependencies),
    webhook,
    transaction,
    fiche,
    committed: () => committed,
  };
}

const request = {
  ficheId: 12,
  ficheFields: { titre: 'Action mise à jour' },
  isNotificationEnabled: false,
  user: { id: 'user' } as AuthenticatedUser,
};

describe('UpdateFicheService webhook transaction', () => {
  it('persiste la notification avant le commit de la fiche', async () => {
    const fixture = createService();
    fixture.webhook.sendWebhookNotification.mockImplementation(async () => {
      expect(fixture.committed()).toBe(false);
    });
    expect(await fixture.service.updateFiche(request)).toEqual(
      success(fixture.fiche)
    );
    expect(fixture.webhook.sendWebhookNotification).toHaveBeenCalledWith(
      ApplicationSousScopesEnum.FICHES,
      '12',
      fixture.fiche,
      fixture.transaction
    );
    expect(fixture.committed()).toBe(true);
  });

  it('annule la transaction si la notification ne peut pas être persistée', async () => {
    const fixture = createService();
    const cause = new Error('outbox unavailable');
    fixture.webhook.sendWebhookNotification.mockRejectedValue(cause);
    expect(await fixture.service.updateFiche(request)).toMatchObject({
      success: false,
      error: 'DATABASE_ERROR',
      cause,
    });
    expect(fixture.committed()).toBe(false);
  });
});
