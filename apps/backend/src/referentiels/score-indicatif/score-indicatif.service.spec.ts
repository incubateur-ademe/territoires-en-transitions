import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
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

const user = { id: 'user-id' } as AuthenticatedUser;

const createService = () => {
  const tx = {} as Transaction;
  const repository = {
    getFormules: vi
      .fn()
      .mockResolvedValue({
        success: true,
        data: [{ actionId: selectionInput.actionId, exprScore: null }],
      }),
    listValeursUtiliseesParActionId: vi
      .fn()
      .mockResolvedValue({ success: true, data: {} }),
    lockSelectionScope: vi.fn().mockResolvedValue(undefined),
    filterIndicateurValeurIdsBelongingTo: vi
      .fn()
      .mockResolvedValue({ success: true, data: [101, 102] }),
    replaceValeursUtiliseesForAction: vi
      .fn()
      .mockResolvedValue({ success: true, data: undefined }),
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
  const indicateurValeursService = {
    listIndicateurValeurs: vi.fn().mockResolvedValue({ indicateurs: [] }),
  };
  const getIndicateursAssociesService = {
    getIndicateursAssocies: vi.fn().mockResolvedValue({
      success: true,
      data: {
        indicateursAssocies: [
          {
            actionId: selectionInput.actionId,
            indicateurId: selectionInput.indicateurId,
            identifiantReferentiel: 'cae_7',
            periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          },
        ],
      },
    }),
  };
  const service = new ScoreIndicatifService(
    repository as unknown as ScoreIndicatifRepository,
    transactionManager as unknown as TransactionManager,
    {} as never,
    indicateurValeursService as never,
    permissionService as never,
    getIndicateursAssociesService as never,
    {} as never
  );

  return {
    permissionService,
    repository,
    service,
    transactionManager,
    tx,
    indicateurValeursService,
    getIndicateursAssociesService,
  };
};

describe('ScoreIndicatifService', () => {
  it('requests annual values with the authenticated context after association', async () => {
    const { service, indicateurValeursService } = createService();
    await expect(
      service.getValeursUtilisables(
        {
          collectiviteId: selectionInput.collectiviteId,
          actionIds: [selectionInput.actionId],
        },
        { user }
      )
    ).resolves.toEqual({ success: true, data: [] });
    expect(indicateurValeursService.listIndicateurValeurs).toHaveBeenCalledWith(
      {
        collectiviteId: selectionInput.collectiviteId,
        indicateurIds: [selectionInput.indicateurId],
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      },
      { user }
    );
  });

  describe('setValeursUtilisees', () => {
    it('passes the caller transaction to the guarded selection replacement', async () => {
      const { service, transactionManager, tx } = createService();
      await service.setValeursUtilisees(selectionInput, { user, tx });
      expect(transactionManager.executeSingle).toHaveBeenCalledWith(
        expect.any(Function),
        tx
      );
    });

    it('locks the complete selection scope before replacing its values', async () => {
      const { repository, service, tx } = createService();

      await expect(
        service.setValeursUtilisees(selectionInput, { user })
      ).resolves.toEqual({ success: true, data: undefined });

      expect(repository.lockSelectionScope).toHaveBeenCalledWith(
        selectionInput,
        tx
      );
      expect(repository.replaceValeursUtiliseesForAction).toHaveBeenCalledWith(
        selectionInput,
        tx
      );
      expect(
        repository.lockSelectionScope.mock.invocationCallOrder[0]
      ).toBeLessThan(
        repository.replaceValeursUtiliseesForAction.mock.invocationCallOrder[0]
      );
    });

    it('validates every selected value before replacing the current selection', async () => {
      const { repository, service } = createService();
      repository.filterIndicateurValeurIdsBelongingTo.mockResolvedValue({
        success: true,
        data: [101],
      });

      const result = await service.setValeursUtilisees(selectionInput, {
        user,
      });

      expect(result).toMatchObject({
        success: false,
        error: 'NOT_FOUND',
      });
      expect(
        repository.replaceValeursUtiliseesForAction
      ).not.toHaveBeenCalled();
    });

    it('rejects an indicator unrelated to the action formula', async () => {
      const { repository, service, getIndicateursAssociesService } =
        createService();
      repository.getFormules.mockResolvedValue({
        success: true,
        data: [
          { actionId: selectionInput.actionId, exprScore: 'val(ind_test)' },
        ],
      });
      getIndicateursAssociesService.getIndicateursAssocies.mockResolvedValue({
        success: true,
        data: { indicateursAssocies: [] },
      });
      const result = await service.setValeursUtilisees(selectionInput, {
        user,
      });
      expect(result).toMatchObject({ success: false, error: 'NOT_FOUND' });
      expect(
        repository.replaceValeursUtiliseesForAction
      ).not.toHaveBeenCalled();
    });

    it('serializes and clears an empty selection without requiring a definition read', async () => {
      const { repository, service, tx } = createService();
      const clearInput: SetValeursUtiliseesRequest = {
        ...selectionInput,
        valeurs: [{ indicateurValeurId: null, typeScore: 'fait' }],
      };

      await expect(
        service.setValeursUtilisees(clearInput, { user })
      ).resolves.toEqual({ success: true, data: undefined });

      expect(repository.lockSelectionScope).toHaveBeenCalledWith(
        clearInput,
        tx
      );
      expect(
        repository.filterIndicateurValeurIdsBelongingTo
      ).not.toHaveBeenCalled();
      expect(repository.replaceValeursUtiliseesForAction).toHaveBeenCalledWith(
        clearInput,
        tx
      );
    });
  });
});
