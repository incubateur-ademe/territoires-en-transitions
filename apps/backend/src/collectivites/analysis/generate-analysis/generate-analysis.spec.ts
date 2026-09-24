import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisJobErrorEnum } from '../analysis-job.errors';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import {
  AnalysisJob,
  AnalysisJobStatus,
  AnalysisJobStatusEnum,
} from '../models/analysis-job';
import { GenerateAnalysisService } from './generate-analysis.service';

const jobId = '00000000-0000-0000-0000-000000000001';

const transaction = { marker: 'transaction' } as unknown as Transaction;

const toJobRow = (
  status: AnalysisJobStatus = AnalysisJobStatusEnum.RUNNING
): AnalysisJob => ({
  id: jobId,
  collectiviteId: 7,
  enjeu: 'ges',
  etape: 'classification',
  createdBy: 'a-user',
  status,
  processedBatches: 0,
  totalBatches: 1,
  report: null,
  tokenUsage: null,
  error: null,
  createdAt: '2026-09-15T00:00:00Z',
  modifiedAt: '2026-09-15T00:00:00Z',
});

const classifications: ClassifyBatchOutcome[] = [
  {
    classified: [
      {
        ficheId: 1,
        justification: 'Piste cyclable protégée',
        isDescriptionTruncated: false,
        volets: [{ levier: 'Covoiturage', categorie: 'amenagement' }],
      },
    ],
    sources: [{ ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' }],
    tokens: {
      promptTokens: 10,
      cachedTokens: 0,
      candidatesTokens: 5,
      thoughtsTokens: 1,
      totalTokens: 16,
    },
  },
];

const toDependencies = ({
  job = toJobRow(),
  scoringFails = false,
  classificationWriteFails = false,
  jobIsUnreadable = false,
} = {}) => {
  const jobRepository = {
    getById: vi
      .fn()
      .mockResolvedValue(
        jobIsUnreadable
          ? failure(AnalysisJobErrorEnum.GET_JOB_ERROR)
          : success(job)
      ),
    markFailed: vi.fn().mockResolvedValue(success(undefined)),
  };
  const classificationService = {
    persist: vi
      .fn()
      .mockResolvedValue(
        classificationWriteFails
          ? failure({ step: 'save_volets', cause: 'SAVE_VOLETS_ERROR' })
          : success(undefined)
      ),
  };
  const scoreMobilisationService = {
    score: vi.fn().mockResolvedValue(
      scoringFails
        ? failure({
            kind: 'interrupted',
            jobId,
            message: 'modele indisponible',
          })
        : success({ leviers: [] })
    ),
  };
  const persistMobilisationService = {
    persist: vi.fn().mockResolvedValue(success(undefined)),
  };
  const transactionManager = {
    executeSingle: vi.fn(
      async (operation: (tx: Transaction) => Promise<unknown>) =>
        operation(transaction)
    ),
  };

  const service = new GenerateAnalysisService(
    jobRepository as never,
    classificationService as never,
    scoreMobilisationService as never,
    persistMobilisationService as never,
    transactionManager as never
  );

  return {
    service,
    jobRepository,
    classificationService,
    scoreMobilisationService,
    persistMobilisationService,
    transactionManager,
  };
};

describe('GenerateAnalysisService.generate', () => {
  it('note la mobilisation avant toute ecriture, puis ecrit les deux phases dans une seule transaction', async () => {
    const { service, classificationService, persistMobilisationService } =
      toDependencies();

    const result = await service.generate(jobId, classifications);

    expect({
      success: result.success,
      classificationTx: classificationService.persist.mock.calls[0]?.[0].tx,
      mobilisationTx: persistMobilisationService.persist.mock.calls[0]?.[0].tx,
    }).toEqual({
      success: true,
      classificationTx: transaction,
      mobilisationTx: transaction,
    });
  });

  it("n'ecrit aucun volet quand la mobilisation n'aboutit pas", async () => {
    const { service, classificationService, persistMobilisationService } =
      toDependencies({ scoringFails: true });

    const result = await service.generate(jobId, classifications);

    expect({
      success: result.success,
      classificationWrites: classificationService.persist.mock.calls.length,
      mobilisationWrites: persistMobilisationService.persist.mock.calls.length,
    }).toEqual({
      success: false,
      classificationWrites: 0,
      mobilisationWrites: 0,
    });
  });

  it("n'ecrit pas la mobilisation quand l'ecriture des volets echoue", async () => {
    const { service, persistMobilisationService, jobRepository } =
      toDependencies({
        classificationWriteFails: true,
      });

    const result = await service.generate(jobId, classifications);

    expect({
      success: result.success,
      mobilisationWrites: persistMobilisationService.persist.mock.calls.length,
      failureMessage: jobRepository.markFailed.mock.calls[0]?.[1],
    }).toEqual({
      success: false,
      mobilisationWrites: 0,
      failureMessage:
        "Écriture de l'analyse impossible (save_volets: SAVE_VOLETS_ERROR). Aucune écriture n'a eu lieu.",
    });
  });

  it("renonce sans rien noter quand des lots manquent a l'appel", async () => {
    const { service, scoreMobilisationService, jobRepository } = toDependencies(
      {
        job: { ...toJobRow(), totalBatches: 2 },
      }
    );

    const result = await service.generate(jobId, classifications);

    expect({
      success: result.success,
      scoreCalls: scoreMobilisationService.score.mock.calls.length,
      failureMessage: jobRepository.markFailed.mock.calls[0]?.[1],
    }).toEqual({
      success: false,
      scoreCalls: 0,
      failureMessage: 'Analyse interrompue : 1 lot(s) classés sur 2.',
    });
  });

  it('passe a la mobilisation les fiches que les lots viennent de classer', async () => {
    const { service, scoreMobilisationService } = toDependencies();

    await service.generate(jobId, classifications);

    const [, outcome] = scoreMobilisationService.score.mock.calls[0];

    expect(outcome.fiches).toEqual([
      { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
    ]);
  });

  it('renonce sans rien noter quand le job lui-meme est illisible', async () => {
    const { service, scoreMobilisationService } = toDependencies({
      jobIsUnreadable: true,
    });

    const result = await service.generate(jobId, classifications);

    expect({
      errorKind: result.success ? undefined : result.error.kind,
      scoreCalls: scoreMobilisationService.score.mock.calls.length,
    }).toEqual({ errorKind: 'job_unreadable', scoreCalls: 0 });
  });

  it("ignore une re-livraison d'un job déjà terminé sans rien relancer", async () => {
    const { service, classificationService, scoreMobilisationService } =
      toDependencies({
        job: toJobRow(AnalysisJobStatusEnum.DONE),
      });

    const result = await service.generate(jobId, classifications);

    expect({
      success: result.success,
      classificationWrites: classificationService.persist.mock.calls.length,
      scoreCalls: scoreMobilisationService.score.mock.calls.length,
    }).toEqual({ success: true, classificationWrites: 0, scoreCalls: 0 });
  });
});
