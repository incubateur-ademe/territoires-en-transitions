import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import {
  ClassificationVoletsJob,
  ClassificationVoletsJobStatusEnum,
} from '../models/classification-volets-job';
import { VoletErrorEnum, type VoletError } from '../volet.errors';
import { GenerateClassificationService } from './generate-classification.service';

const jobId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 7;
const transaction = { marker: 'transaction' } as unknown as Transaction;

const job: ClassificationVoletsJob = {
  id: jobId,
  collectiviteId,
  enjeu: 'ges',
  etape: 'classification',
  createdBy: 'a-user',
  status: ClassificationVoletsJobStatusEnum.RUNNING,
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
    markFailed: vi.fn().mockResolvedValue(success(undefined)),
  };
  const ficheActionVoletGesRepository = {
    saveVolets: vi.fn().mockResolvedValue(saveOutcome),
  };
  const transactionManager = {
    executeSingle: vi.fn(
      async (operation: (tx: Transaction) => Promise<unknown>) =>
        operation(transaction)
    ),
  };

  const service = new GenerateClassificationService(
    jobRepository as never,
    ficheActionVoletGesRepository as never,
    transactionManager as never
  );

  return { service, jobRepository, ficheActionVoletGesRepository };
};

describe('GenerateClassificationService.persist', () => {
  it('ecrit les volets et le brouillon dans une seule et meme transaction', async () => {
    const { service, jobRepository, ficheActionVoletGesRepository } =
      toDependencies();

    const result = await service.persist(job, classifications);

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

  it('traduit les leviers nommes en identifiants pour la mobilisation', async () => {
    const { service } = toDependencies();

    const result = await service.persist(job, classifications);

    expect(result.success ? result.data.volets : undefined).toEqual([
      { ficheId: 1, levierId: 'covoiturage', categorie: 'amenagement' },
    ]);
  });

  it('additionne les jetons de toutes les fiches classees', async () => {
    const { service } = toDependencies();

    const result = await service.persist(job, classifications);

    expect(result.success ? result.data.tokens.promptTokens : undefined).toBe(
      30
    );
  });

  it('rend les fiches sources pour que la mobilisation nourrisse son prompt', async () => {
    const { service } = toDependencies();

    const result = await service.persist(job, classifications);

    expect(result.success ? result.data.fiches : undefined).toEqual([
      { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
      { ficheId: 2, titre: 'Bulletin municipal', description: null },
    ]);
  });

  it("n'enregistre pas le brouillon quand l'ecriture des volets echoue", async () => {
    const { service, jobRepository } = toDependencies({
      saveOutcome: failure(VoletErrorEnum.SAVE_VOLETS_ERROR),
    });

    const result = await service.persist(job, classifications);

    expect({
      errorKind: result.success ? undefined : result.error.kind,
      draftCalls: jobRepository.recordClassificationDraft.mock.calls.length,
      markFailedCalls: jobRepository.markFailed.mock.calls.length,
    }).toEqual({
      errorKind: 'interrupted',
      draftCalls: 0,
      markFailedCalls: 1,
    });
  });
});
