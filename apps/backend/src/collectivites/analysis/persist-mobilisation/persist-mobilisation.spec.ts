import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisJobErrorEnum } from '../analysis-job.errors';
import { AnalysisJob, AnalysisJobStatusEnum } from '../models/analysis-job';
import { VoletErrorEnum } from '../volet.errors';
import { PersistMobilisationService } from './persist-mobilisation.service';

const jobId = '00000000-0000-0000-0000-000000000001';

const transaction = { marker: 'transaction' } as unknown as Transaction;

const job: AnalysisJob = {
  id: jobId,
  collectiviteId: 7,
  enjeu: 'ges',
  etape: 'mobilisation',
  createdBy: 'a-user',
  status: AnalysisJobStatusEnum.RUNNING,
  processedBatches: 0,
  totalBatches: 1,
  draft: null,
  tokenUsage: null,
  error: null,
  createdAt: '2026-09-15T00:00:00Z',
  modifiedAt: '2026-09-15T00:00:00Z',
};

const toDependencies = ({ mobilisationWriteFails = false } = {}) => {
  const jobRepository = {
    markDone: vi.fn().mockResolvedValue(success(undefined)),
  };
  const mobilisationRepository = {
    replaceMobilisation: vi
      .fn()
      .mockResolvedValue(
        mobilisationWriteFails
          ? failure(VoletErrorEnum.SAVE_VOLETS_ERROR)
          : success(undefined)
      ),
  };

  const service = new PersistMobilisationService(
    jobRepository as never,
    mobilisationRepository as never
  );

  return { service, jobRepository, mobilisationRepository };
};

describe('PersistMobilisationService.persist', () => {
  it('ecrit la mobilisation puis clot le job dans la transaction recue', async () => {
    const { service, mobilisationRepository, jobRepository } = toDependencies();

    const result = await service.persist({
      job,
      leviers: [],
      tx: transaction,
    });

    expect({
      success: result.success,
      mobilisationTx:
        mobilisationRepository.replaceMobilisation.mock.calls[0]?.[0].tx,
      doneTx: jobRepository.markDone.mock.calls[0]?.[0].tx,
    }).toEqual({
      success: true,
      mobilisationTx: transaction,
      doneTx: transaction,
    });
  });

  it("nomme l'etape et la cause quand l'ecriture de la mobilisation echoue", async () => {
    const { service, jobRepository } = toDependencies({
      mobilisationWriteFails: true,
    });

    const result = await service.persist({
      job,
      leviers: [],
      tx: transaction,
    });

    expect({
      failure: result.success ? undefined : result.error,
      doneCalls: jobRepository.markDone.mock.calls.length,
    }).toEqual({
      failure: {
        step: 'replace_mobilisation',
        cause: VoletErrorEnum.SAVE_VOLETS_ERROR,
      },
      doneCalls: 0,
    });
  });

  it('nomme l etape quand le job ne peut pas etre clos', async () => {
    const { service, jobRepository } = toDependencies();
    jobRepository.markDone.mockResolvedValue(
      failure(AnalysisJobErrorEnum.JOB_TRANSITION_REFUSED)
    );

    const result = await service.persist({
      job,
      leviers: [],
      tx: transaction,
    });

    expect(result.success ? undefined : result.error).toEqual({
      step: 'mark_done',
      cause: AnalysisJobErrorEnum.JOB_TRANSITION_REFUSED,
    });
  });
});
