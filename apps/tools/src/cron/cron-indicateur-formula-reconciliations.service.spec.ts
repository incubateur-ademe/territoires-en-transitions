import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CronIndicateurFormulaReconciliationsService } from './cron-indicateur-formula-reconciliations.service';

describe('CronIndicateurFormulaReconciliationsService', () => {
  const mutate = vi.fn();
  const trpcClientService = {
    getClient: vi.fn(() => ({
      indicateurs: {
        formulaReconciliations: { drain: { mutate } },
      },
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('draine un lot global borné via la procédure de service', async () => {
    const result = {
      processedCount: 2,
      obsoleteCount: 1,
      failedCount: 0,
      remainingCount: 4,
      complete: false,
      identifiants: ['target_a'],
    };
    mutate.mockResolvedValue(result);
    const service = new CronIndicateurFormulaReconciliationsService(
      trpcClientService as never
    );

    await expect(service.drain()).resolves.toEqual(result);
    expect(mutate).toHaveBeenCalledExactlyOnceWith({});
  });

  it('propage un échec pour activer les retries et la supervision BullMQ', async () => {
    mutate.mockResolvedValue({
      processedCount: 0,
      obsoleteCount: 0,
      failedCount: 1,
      remainingCount: 3,
      complete: false,
      identifiants: [],
    });
    const service = new CronIndicateurFormulaReconciliationsService(
      trpcClientService as never
    );

    await expect(service.drain()).rejects.toThrow(
      '1 indicateur formula reconciliation(s) failed; 3 pending'
    );
  });
});
