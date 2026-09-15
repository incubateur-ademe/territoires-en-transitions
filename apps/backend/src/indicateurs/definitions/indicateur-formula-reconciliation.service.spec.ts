import { IndicateurDefinition } from '@tet/domain/indicateurs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import { IndicateurDefinitionLockRepository } from './indicateur-definition-lock.repository';
import {
  IndicateurFormulaReconciliationRepository,
  type IndicateurFormulaReconciliationWorkItem,
} from './indicateur-formula-reconciliation.repository';
import { IndicateurFormulaReconciliationService } from './indicateur-formula-reconciliation.service';
import { ListPlatformDefinitionsRepository } from './list-platform-definitions/list-platform-definitions.repository';

const workItem = (
  id: string,
  indicateurId: number,
  expectedFormula: string | null,
  collectiviteId = 10
): IndicateurFormulaReconciliationWorkItem => ({
  id,
  generation: `00000000-0000-4000-8000-${id.padStart(12, '0')}`,
  indicateurId,
  collectiviteId,
  expectedFormula,
  createdAt: '2026-09-03T00:00:00.000Z',
  nextAttemptAt: '2026-09-03T00:00:00.000Z',
  failureCount: 0,
  lastFailedAt: null,
  lastError: null,
});

const definition = (
  id: number,
  valeurCalcule: string | null
): IndicateurDefinition =>
  ({
    id,
    identifiantReferentiel: `target_${id}`,
    valeurCalcule,
    periodicite: 'mensuelle',
    collectiviteId: null,
  } as IndicateurDefinition);

describe('IndicateurFormulaReconciliationService', () => {
  const tx = { name: 'tx' };
  const transactionManager = {
    executeSingle: vi.fn(
      (operation: (transaction: typeof tx) => Promise<unknown>) => operation(tx)
    ),
  };
  const repository = {
    claimNext: vi.fn(),
    complete: vi.fn(),
    recordFailure: vi.fn(),
    countPending: vi.fn(),
  };
  const definitionLockRepository = {
    lockForValueWrite: vi.fn(),
  };
  const definitionsRepository = {
    listPlatformDefinitions: vi.fn(),
  };
  const crudValeursService = {
    reconcileCollectiviteCalculatedIndicateurValeurs: vi.fn(),
  };

  let service: IndicateurFormulaReconciliationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new IndicateurFormulaReconciliationService(
      transactionManager as never,
      repository as unknown as IndicateurFormulaReconciliationRepository,
      definitionLockRepository as unknown as IndicateurDefinitionLockRepository,
      definitionsRepository as unknown as ListPlatformDefinitionsRepository,
      crudValeursService as unknown as CrudValeursService
    );
    definitionLockRepository.lockForValueWrite.mockResolvedValue(undefined);
    repository.complete.mockResolvedValue(undefined);
    repository.recordFailure.mockResolvedValue(undefined);
  });

  it('réconcilie et acquitte une intention dans la même transaction bornée', async () => {
    const pending = workItem('1', 21, 'val(source_a)');
    const target = definition(21, ' VAL(SOURCE_A) ');
    repository.claimNext
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(null);
    definitionsRepository.listPlatformDefinitions.mockResolvedValue([target]);
    crudValeursService.reconcileCollectiviteCalculatedIndicateurValeurs.mockResolvedValue(
      {
        collectiviteId: pending.collectiviteId,
        valeursCount: 1,
        identifiants: ['target_21'],
      }
    );
    repository.countPending.mockResolvedValue(0);

    await expect(
      service.drain({ indicateurIds: [21], includeDeferred: true })
    ).resolves.toEqual({
      processedCount: 1,
      obsoleteCount: 0,
      failedCount: 0,
      remainingCount: 0,
      complete: true,
      identifiants: ['target_21'],
    });
    expect(definitionLockRepository.lockForValueWrite).toHaveBeenCalledBefore(
      repository.claimNext
    );
    expect(
      crudValeursService.reconcileCollectiviteCalculatedIndicateurValeurs
    ).toHaveBeenCalledWith(pending.collectiviteId, [target], tx);
    expect(repository.complete).toHaveBeenCalledWith(pending.id, tx);
    expect(transactionManager.executeSingle).toHaveBeenCalledTimes(2);
  });

  it("n'acquitte pas la nouvelle génération en écartant une intention obsolète", async () => {
    const obsolete = workItem('1', 21, 'val(old_source)');
    const current = workItem('2', 21, 'val(new_source)');
    const target = definition(21, 'val(new_source)');
    repository.claimNext
      .mockResolvedValueOnce(obsolete)
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(null);
    definitionsRepository.listPlatformDefinitions.mockResolvedValue([target]);
    crudValeursService.reconcileCollectiviteCalculatedIndicateurValeurs.mockResolvedValue(
      {
        collectiviteId: current.collectiviteId,
        valeursCount: 1,
        identifiants: ['target_21'],
      }
    );
    repository.countPending.mockResolvedValue(0);

    await expect(service.drain({ limit: 3 })).resolves.toMatchObject({
      processedCount: 1,
      obsoleteCount: 1,
      complete: true,
    });
    expect(repository.complete).toHaveBeenNthCalledWith(1, obsolete.id, tx);
    expect(repository.complete).toHaveBeenNthCalledWith(2, current.id, tx);
    expect(
      crudValeursService.reconcileCollectiviteCalculatedIndicateurValeurs
    ).toHaveBeenCalledOnce();
  });

  it('diffère une intention en échec sans bloquer la collectivité suivante', async () => {
    const poison = workItem('1', 21, 'val(source_a)', 10);
    const healthy = workItem('2', 21, 'val(source_a)', 11);
    const target = definition(21, 'val(source_a)');
    repository.claimNext
      .mockResolvedValueOnce(poison)
      .mockResolvedValueOnce(healthy)
      .mockResolvedValueOnce(null);
    definitionsRepository.listPlatformDefinitions.mockResolvedValue([target]);
    crudValeursService.reconcileCollectiviteCalculatedIndicateurValeurs
      .mockRejectedValueOnce(new Error('invalid calculation'))
      .mockResolvedValueOnce({
        collectiviteId: healthy.collectiviteId,
        valeursCount: 1,
        identifiants: ['target_21'],
      });
    repository.countPending.mockResolvedValue(1);

    await expect(
      service.drain({ limit: 3, includeDeferred: true })
    ).resolves.toMatchObject({
      processedCount: 1,
      failedCount: 1,
      remainingCount: 1,
      complete: false,
    });
    expect(repository.recordFailure).toHaveBeenCalledWith(
      poison.id,
      poison.generation,
      'invalid calculation'
    );
    expect(repository.complete).toHaveBeenCalledOnce();
    expect(repository.complete).toHaveBeenCalledWith(healthy.id, tx);
    expect(repository.claimNext).toHaveBeenNthCalledWith(
      2,
      tx,
      expect.objectContaining({ excludedIds: [poison.id] })
    );
  });

  it("interrompt le drain si l'infrastructure échoue avant tout claim", async () => {
    repository.claimNext.mockRejectedValueOnce(
      new Error('database unavailable')
    );

    await expect(service.drain()).rejects.toThrow('database unavailable');
    expect(repository.recordFailure).not.toHaveBeenCalled();
    expect(repository.countPending).not.toHaveBeenCalled();
    expect(transactionManager.executeSingle).toHaveBeenCalledOnce();
  });
});
