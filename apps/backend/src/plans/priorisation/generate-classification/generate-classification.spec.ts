import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { GenerateStructuredArgs } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ZodType } from 'zod';
import { ClassificationLeviersErrorEnum } from '../classification-leviers.errors';
import { FicheLeviersErrorEnum } from '../fiche-leviers.errors';
import {
  ClassificationLeviersJob,
  ClassificationLeviersJobStatus,
  ClassificationLeviersJobStatusEnum,
} from '../models/classification-leviers-job';
import { FicheClassification } from '../pipeline/classify-fiches/classify-fiches.schema';
import { GenerateClassificationService } from './generate-classification.service';

const jobId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 7;
const planId = 42;

const tokens = {
  promptTokens: 10,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

const transaction = { marker: 'transaction' } as unknown as Transaction;

const toJobRow = (
  status: ClassificationLeviersJobStatus = ClassificationLeviersJobStatusEnum.PENDING
): ClassificationLeviersJob => ({
  id: jobId,
  collectiviteId,
  planId,
  createdBy: 'a-user',
  status,
  processedBatches: 0,
  totalBatches: 0,
  draft: null,
  tokenUsage: null,
  error: null,
  createdAt: '2026-09-08T00:00:00Z',
  modifiedAt: '2026-09-08T00:00:00Z',
});

const toClassification = (index: number): FicheClassification => ({
  index,
  justification: 'Le texte decrit un amenagement cyclable.',
  hasNoRelevantLevier: false,
  volets: [
    { levier: 'Vélo et transport en commun', categories: ['amenagement'] },
  ],
});

const toClassifyingLlm = () => ({
  generateStructured: vi.fn(async (args: GenerateStructuredArgs<ZodType>) => {
    const actionCount = (args.prompt.match(/<action index=/g) ?? []).length;
    return success({
      data: Array.from({ length: actionCount }, (unused, index) =>
        toClassification(index)
      ),
      tokens,
    });
  }),
});

const toDependencies = ({
  job = toJobRow(),
  fiches = [{ id: 1, titre: 'Pistes cyclables', description: 'Dix km' }],
  saveOutcome = success(undefined),
}: {
  job?: ReturnType<typeof toJobRow>;
  fiches?: { id: number; titre: string | null; description: string | null }[];
  saveOutcome?: unknown;
} = {}) => {
  const jobRepository = {
    getById: vi.fn().mockResolvedValue(success(job)),
    markRunning: vi.fn().mockResolvedValue(success(undefined)),
    recordProcessedBatches: vi.fn().mockResolvedValue(undefined),
    markDone: vi.fn().mockResolvedValue(success(undefined)),
    markFailed: vi.fn().mockResolvedValue(success(undefined)),
  };
  const listFichesService = {
    getFichesActionResumes: vi
      .fn()
      .mockResolvedValue({ count: fiches.length, data: fiches }),
  };
  const llm = toClassifyingLlm();
  const ficheLeviersRepository = {
    saveLeviers: vi.fn().mockResolvedValue(saveOutcome),
  };
  const transactionManager = {
    executeSingle: vi.fn(
      async (operation: (tx: Transaction) => Promise<unknown>) =>
        operation(transaction)
    ),
  };

  const service = new GenerateClassificationService(
    jobRepository as never,
    listFichesService as never,
    llm as never,
    ficheLeviersRepository as never,
    transactionManager as never
  );

  return {
    service,
    jobRepository,
    listFichesService,
    llm,
    ficheLeviersRepository,
  };
};

describe('GenerateClassificationService.generate', () => {
  it("ignore une re-livraison d'un job deja termine sans rappeler le modele", async () => {
    const { service, llm, jobRepository } = toDependencies({
      job: toJobRow(ClassificationLeviersJobStatusEnum.DONE),
    });

    const result = await service.generate(jobId);

    expect({
      success: result.success,
      llmCalls: llm.generateStructured.mock.calls.length,
      markRunningCalls: jobRepository.markRunning.mock.calls.length,
    }).toEqual({ success: true, llmCalls: 0, markRunningCalls: 0 });
  });

  it('interrompt un plan sans aucune fiche a classer', async () => {
    const { service, jobRepository } = toDependencies({ fiches: [] });

    const result = await service.generate(jobId);

    expect({
      result,
      markFailedArgs: jobRepository.markFailed.mock.calls[0],
    }).toEqual({
      result: {
        success: false,
        error: {
          kind: 'interrupted',
          jobId,
          message: 'Aucune fiche à classer dans ce plan',
        },
      },
      markFailedArgs: [jobId, 'Aucune fiche à classer dans ce plan'],
    });
  });

  it('ecrit le classement et clot le job dans une seule et meme transaction', async () => {
    const { service, ficheLeviersRepository, jobRepository } =
      toDependencies();

    const result = await service.generate(jobId);

    const [saveArgs] = ficheLeviersRepository.saveLeviers.mock.calls[0];
    const [markDoneArgs] = jobRepository.markDone.mock.calls[0];

    expect({
      success: result.success,
      saveTransaction: saveArgs.tx,
      markDoneTransaction: markDoneArgs.tx,
    }).toEqual({
      success: true,
      saveTransaction: transaction,
      markDoneTransaction: transaction,
    });
  });

  it("ne clot pas le job quand l'ecriture du classement echoue", async () => {
    const { service, jobRepository } = toDependencies({
      saveOutcome: failure(FicheLeviersErrorEnum.SAVE_LEVIERS_ERROR),
    });

    const result = await service.generate(jobId);

    expect({
      errorKind: result.success ? undefined : result.error.kind,
      markDoneCalls: jobRepository.markDone.mock.calls.length,
      markFailedCalls: jobRepository.markFailed.mock.calls.length,
    }).toEqual({ errorKind: 'interrupted', markDoneCalls: 0, markFailedCalls: 1 });
  });

  it("remonte l'echec de passage en cours sans appeler le modele", async () => {
    const { service, jobRepository, llm } = toDependencies();
    jobRepository.markRunning.mockResolvedValue(
      failure(ClassificationLeviersErrorEnum.JOB_TRANSITION_REFUSED)
    );

    const result = await service.generate(jobId);

    expect({
      result,
      llmCalls: llm.generateStructured.mock.calls.length,
    }).toEqual({
      result: {
        success: false,
        error: {
          kind: 'transition_failed',
          jobId,
          cause: ClassificationLeviersErrorEnum.JOB_TRANSITION_REFUSED,
        },
      },
      llmCalls: 0,
    });
  });
});
