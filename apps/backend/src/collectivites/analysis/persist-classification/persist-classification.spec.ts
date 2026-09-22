import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import { AnalysisJob, AnalysisJobStatusEnum } from '../models/analysis-job';
import { VoletErrorEnum, type VoletError } from '../volet.errors';
import {
  PersistClassificationService,
  toClassificationOutcome,
} from './persist-classification.service';

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

const toTokens = (promptTokens: number) => ({
  promptTokens,
  cachedTokens: 0,
  candidatesTokens: 1,
  thoughtsTokens: 0,
  totalTokens: promptTokens + 1,
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
      {
        ficheId: 2,
        justification: 'Aucun levier pertinent',
        isDescriptionTruncated: false,
        volets: [],
      },
    ],
    sources: [
      { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
      { ficheId: 2, titre: 'Bulletin municipal', description: null },
    ],
    tokens: toTokens(10),
  },
  {
    classified: [],
    sources: [],
    tokens: toTokens(20),
  },
];

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

describe('toClassificationOutcome', () => {
  it('traduit les leviers nommes en identifiants pour la mobilisation', () => {
    expect(toClassificationOutcome(classifications).volets).toEqual([
      { ficheId: 1, levierId: 'covoiturage', categorie: 'amenagement' },
    ]);
  });

  it('rend les fiches sources pour que la mobilisation nourrisse son prompt', () => {
    expect(toClassificationOutcome(classifications).fiches).toEqual([
      { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
      { ficheId: 2, titre: 'Bulletin municipal', description: null },
    ]);
  });

  it("n'ecrit rien par lui-meme", () => {
    const { ficheActionVoletGesRepository, jobRepository } = toDependencies();

    toClassificationOutcome(classifications);

    expect({
      saveCalls: ficheActionVoletGesRepository.saveVolets.mock.calls.length,
      draftCalls: jobRepository.recordClassificationDraft.mock.calls.length,
    }).toEqual({ saveCalls: 0, draftCalls: 0 });
  });
});

describe('PersistClassificationService.persist', () => {
  it('ecrit les volets et le brouillon dans la transaction recue', async () => {
    const { service, jobRepository, ficheActionVoletGesRepository } =
      toDependencies();

    const result = await service.persist({
      job,
      outcome: toClassificationOutcome(classifications),
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
      outcome: toClassificationOutcome(classifications),
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
