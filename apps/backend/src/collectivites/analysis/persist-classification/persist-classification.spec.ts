import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisJob, AnalysisJobStatusEnum } from '../models/analysis-job';
import { ClassificationOutcome } from '../models/classification-outcome';
import { VoletErrorEnum, type VoletError } from '../volet.errors';
import { PersistClassificationService } from './persist-classification.service';

const jobId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 7;
const transaction = { marker: 'transaction' } as unknown as Transaction;

const job: AnalysisJob = {
  id: jobId,
  collectiviteId,
  enjeu: 'ges',
  etape: 'classification',
  createdBy: 'a-user',
  status: AnalysisJobStatusEnum.RUNNING,
  processedBatches: 0,
  totalBatches: 2,
  draft: null,
  tokenUsage: null,
  error: null,
  createdAt: '2026-09-15T00:00:00Z',
  modifiedAt: '2026-09-15T00:00:00Z',
};

const outcome: ClassificationOutcome = {
  draft: {
    fiches: [
      {
        ficheId: 1,
        justification: 'Piste cyclable protégée',
        isDescriptionTruncated: false,
        volets: [{ levier: 'Covoiturage', categorie: 'amenagement' }],
      },
      {
        ficheId: 2,
        justification: 'Aucun levier pertinent',
        isDescriptionTruncated: false,
        volets: [],
      },
    ],
  },
  fiches: [
    { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
    { ficheId: 2, titre: 'Bulletin municipal', description: null },
  ],
  volets: [{ ficheId: 1, levierId: 'covoiturage', categorie: 'amenagement' }],
};

const toDependencies = ({
  saveOutcome = success(undefined) as Result<undefined, VoletError>,
} = {}) => {
  const jobRepository = {
    recordClassificationDraft: vi.fn().mockResolvedValue(success(undefined)),
  };
  const ficheActionVoletGesRepository = {
    saveVolets: vi.fn().mockResolvedValue(saveOutcome),
  };
  const enjeuRepositories = {
    voletsOf: () => ficheActionVoletGesRepository,
  };

  const service = new PersistClassificationService(
    jobRepository as never,
    enjeuRepositories as never
  );

  return { service, jobRepository, ficheActionVoletGesRepository };
};

describe('PersistClassificationService.persist', () => {
  it('ecrit les volets et le brouillon dans la transaction recue', async () => {
    const { service, jobRepository, ficheActionVoletGesRepository } =
      toDependencies();

    const result = await service.persist({
      job,
      outcome,
      tx: transaction,
    });

    const [saveArgs] = ficheActionVoletGesRepository.saveVolets.mock.calls[0];
    const [draftArgs] = jobRepository.recordClassificationDraft.mock.calls[0];

    expect({
      success: result.success,
      saveTransaction: saveArgs.tx,
      draftTransaction: draftArgs.tx,
    }).toEqual({
      success: true,
      saveTransaction: transaction,
      draftTransaction: transaction,
    });
  });

  it("n'enregistre pas le brouillon quand l'ecriture des volets echoue", async () => {
    const { service, jobRepository } = toDependencies({
      saveOutcome: failure(VoletErrorEnum.SAVE_VOLETS_ERROR),
    });

    const result = await service.persist({
      job,
      outcome,
      tx: transaction,
    });

    expect({
      failure: result.success ? undefined : result.error,
      draftCalls: jobRepository.recordClassificationDraft.mock.calls.length,
    }).toEqual({
      failure: {
        step: 'save_volets',
        cause: VoletErrorEnum.SAVE_VOLETS_ERROR,
      },
      draftCalls: 0,
    });
  });
});
