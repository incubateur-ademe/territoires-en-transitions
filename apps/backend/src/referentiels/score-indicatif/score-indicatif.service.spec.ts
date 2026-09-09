import { AuthUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { describe, expect, it, vi } from 'vitest';
import { SetValeursUtiliseesRequest } from './set-valeurs-utilisees.request';
import { ScoreIndicatifRepository } from './score-indicatif.repository';
import { ScoreIndicatifService } from './score-indicatif.service';

const selectionInput: SetValeursUtiliseesRequest = {
  actionId: 'cae_1.2.3.3.4',
  collectiviteId: 42,
  indicateurId: 7,
  valeurs: [
    { indicateurValeurId: 101, typeScore: 'fait' },
    { indicateurValeurId: 102, typeScore: 'programme' },
  ],
};
const selectionScope = {
  actionId: selectionInput.actionId,
  collectiviteId: selectionInput.collectiviteId,
  indicateurId: selectionInput.indicateurId,
};

const user = { id: 'user-id' } as AuthUser;

const createService = () => {
  const tx = {} as Transaction;
  const repository = {
    lockSelectionScope: vi.fn().mockResolvedValue(undefined),
    getDefinitionForShare: vi.fn().mockResolvedValue({
      identifiantReferentiel: 'cae_7',
      periodicite: 'annuelle',
    }),
    listCompatibleValeurIds: vi.fn().mockResolvedValue([101, 102]),
    replaceValeursUtilisees: vi.fn().mockResolvedValue(undefined),
    listValeursUtilisees: vi.fn().mockResolvedValue([]),
  };
  const transactionManager = {
    executeSingle: vi
      .fn()
      .mockImplementation(
        (operation: (transaction: Transaction) => Promise<unknown>) =>
          operation(tx)
      ),
  };
  const permissionService = {
    isAllowed: vi.fn().mockResolvedValue({ success: true, data: undefined }),
  };
  const service = new ScoreIndicatifService(
    repository as unknown as ScoreIndicatifRepository,
    transactionManager as unknown as TransactionManager,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    permissionService as never
  );

  return { permissionService, repository, service, transactionManager, tx };
};

describe('ScoreIndicatifService', () => {
  describe('setValeursUtilisees', () => {
    it('locks the complete selection scope before replacing its values', async () => {
      const { repository, service, tx } = createService();

      await expect(
        service.setValeursUtilisees(selectionInput, user)
      ).resolves.toEqual({ success: true, data: undefined });

      expect(repository.lockSelectionScope).toHaveBeenCalledWith(
        selectionScope,
        tx
      );
      expect(repository.replaceValeursUtilisees).toHaveBeenCalledWith(
        selectionScope,
        selectionInput.valeurs,
        tx
      );
      expect(
        repository.lockSelectionScope.mock.invocationCallOrder[0]
      ).toBeLessThan(
        repository.replaceValeursUtilisees.mock.invocationCallOrder[0]
      );
    });

    it('validates every selected value before replacing the current selection', async () => {
      const { repository, service } = createService();
      repository.listCompatibleValeurIds.mockResolvedValue([101]);

      const result = await service.setValeursUtilisees(selectionInput, user);

      expect(result).toMatchObject({ success: false, error: 'DATABASE_ERROR' });
      expect(repository.replaceValeursUtilisees).not.toHaveBeenCalled();
    });

    it('rejects a non-annual definition without replacing its selection', async () => {
      const { repository, service } = createService();
      repository.getDefinitionForShare.mockResolvedValue({
        identifiantReferentiel: 'mensuel',
        periodicite: 'mensuelle',
      });

      const result = await service.setValeursUtilisees(selectionInput, user);

      expect(result).toMatchObject({ success: false, error: 'DATABASE_ERROR' });
      expect(repository.listCompatibleValeurIds).not.toHaveBeenCalled();
      expect(repository.replaceValeursUtilisees).not.toHaveBeenCalled();
    });

    it('serializes and clears an empty selection without requiring a definition read', async () => {
      const { repository, service, tx } = createService();
      const clearInput: SetValeursUtiliseesRequest = {
        ...selectionInput,
        valeurs: [{ indicateurValeurId: null, typeScore: 'fait' }],
      };

      await expect(
        service.setValeursUtilisees(clearInput, user)
      ).resolves.toEqual({ success: true, data: undefined });

      expect(repository.lockSelectionScope).toHaveBeenCalledWith(
        selectionScope,
        tx
      );
      expect(repository.getDefinitionForShare).not.toHaveBeenCalled();
      expect(repository.listCompatibleValeurIds).not.toHaveBeenCalled();
      expect(repository.replaceValeursUtilisees).toHaveBeenCalledWith(
        selectionScope,
        [],
        tx
      );
    });
  });

  describe('getValeursUtiliseesParActionId', () => {
    it('maps result/program values in the application layer and preserves zero', async () => {
      const { repository, service } = createService();
      repository.listValeursUtilisees.mockResolvedValue([
        {
          actionId: selectionInput.actionId,
          indicateurValeurId: 101,
          typeScore: 'fait',
          indicateurId: selectionInput.indicateurId,
          dateValeur: '2025-01-01',
          resultat: 0,
          objectif: 12,
          sourceLibelle: 'CITEPA',
          sourceMetadonnee: null,
        },
        {
          actionId: selectionInput.actionId,
          indicateurValeurId: 102,
          typeScore: 'programme',
          indicateurId: selectionInput.indicateurId,
          dateValeur: '2026-01-01',
          resultat: 34,
          objectif: 0,
          sourceLibelle: null,
          sourceMetadonnee: null,
        },
        {
          actionId: selectionInput.actionId,
          indicateurValeurId: 103,
          typeScore: 'fait',
          indicateurId: selectionInput.indicateurId,
          dateValeur: '2027-01-01',
          resultat: null,
          objectif: 99,
          sourceLibelle: null,
          sourceMetadonnee: null,
        },
      ]);

      await expect(
        service.getValeursUtiliseesParActionId({
          actionIds: [selectionInput.actionId],
          collectiviteId: selectionInput.collectiviteId,
        })
      ).resolves.toEqual({
        [selectionInput.actionId]: [
          expect.objectContaining({ indicateurValeurId: 101, valeur: 0 }),
          expect.objectContaining({ indicateurValeurId: 102, valeur: 0 }),
        ],
      });
    });
  });
});
