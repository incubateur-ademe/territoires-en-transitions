import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassificationVoletsErrorEnum } from '../classification-volets.errors';
import {
  ClassificationVoletsJob,
  ClassificationVoletsJobStatus,
  ClassificationVoletsJobStatusEnum,
} from '../models/classification-volets-job';
import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { GenerateMobilisationService } from './generate-mobilisation.service';

const jobId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 7;

const transaction = { marker: 'transaction' } as unknown as Transaction;

const tokens = {
  promptTokens: 10,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

const toJobRow = (
  status: ClassificationVoletsJobStatus = ClassificationVoletsJobStatusEnum.PENDING
): ClassificationVoletsJob => ({
  id: jobId,
  collectiviteId,
  enjeu: 'ges',
  etape: 'mobilisation',
  createdBy: 'a-user',
  status,
  processedBatches: 0,
  totalBatches: 0,
  draft: null,
  tokenUsage: null,
  error: null,
  createdAt: '2026-09-15T00:00:00Z',
  modifiedAt: '2026-09-15T00:00:00Z',
});

const oneVoletOnVelo: FicheVolet[] = [
  { ficheId: 1, levierId: 'velo_transport_commun', categorie: 'amenagement' },
];

const toDependencies = ({
  job = toJobRow(),
  fiches = [
    { id: 1, collectiviteId, titre: 'Pistes cyclables', description: 'Dix km' },
  ],
  volets = oneVoletOnVelo,
  scoringFails = false,
}: {
  job?: ClassificationVoletsJob;
  fiches?: {
    id: number;
    collectiviteId: number;
    titre: string | null;
    description: string | null;
  }[];
  volets?: FicheVolet[];
  scoringFails?: boolean;
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
  const ficheVoletRepository = {
    listVoletsOfFiches: vi.fn().mockResolvedValue(success(volets)),
  };
  const gridRepository = {
    replaceGrid: vi.fn().mockResolvedValue(success(undefined)),
  };
  const collectivitesService = {
    getCollectiviteAvecType: vi
      .fn()
      .mockResolvedValue({ nom: 'Ville de test', population: 3000 }),
  };
  const llm = {
    generateStructured: vi.fn(async (_args: { prompt: string }) =>
      scoringFails
        ? failure({ kind: 'llm_error' })
        : success({
            data: { '1': 3, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
            tokens,
          })
    ),
  };
  const transactionManager = {
    executeSingle: vi.fn(
      async (operation: (tx: Transaction) => Promise<unknown>) =>
        operation(transaction)
    ),
  };

  const service = new GenerateMobilisationService(
    jobRepository as never,
    listFichesService as never,
    ficheVoletRepository as never,
    gridRepository as never,
    collectivitesService as never,
    llm as never,
    transactionManager as never
  );

  return { service, jobRepository, gridRepository, llm, listFichesService };
};

describe('GenerateMobilisationService.generate', () => {
  it('interrompt une collectivité sans aucun volet classé, sans appeler le modèle', async () => {
    const { service, llm, jobRepository, gridRepository } = toDependencies({
      volets: [],
    });

    const result = await service.generate(jobId);

    expect({
      success: result.success,
      llmCalls: llm.generateStructured.mock.calls.length,
      gridWrites: gridRepository.replaceGrid.mock.calls.length,
      failureMessage: jobRepository.markFailed.mock.calls[0]?.[1],
    }).toEqual({
      success: false,
      llmCalls: 0,
      gridWrites: 0,
      failureMessage:
        "Aucun volet classé sur cette collectivité : lancez d'abord la classification.",
    });
  });

  it('avorte sans écrire quand un levier échoue, laissant la grille précédente', async () => {
    const { service, gridRepository, jobRepository } = toDependencies({
      scoringFails: true,
    });

    const result = await service.generate(jobId);

    expect({
      success: result.success,
      gridWrites: gridRepository.replaceGrid.mock.calls.length,
      doneCalls: jobRepository.markDone.mock.calls.length,
      failureMentionsGrid: jobRepository.markFailed.mock.calls[0]?.[1].includes(
        'grille précédente est conservée'
      ),
    }).toEqual({
      success: false,
      gridWrites: 0,
      doneCalls: 0,
      failureMentionsGrid: true,
    });
  });

  it('écrit la grille et clôt le job dans une seule et même transaction', async () => {
    const { service, gridRepository, jobRepository } = toDependencies();

    await service.generate(jobId);

    expect({
      gridTx: gridRepository.replaceGrid.mock.calls[0]?.[0].tx,
      doneTx: jobRepository.markDone.mock.calls[0]?.[0].tx,
    }).toEqual({ gridTx: transaction, doneTx: transaction });
  });

  it("clôt le job avec un draft nul, la mobilisation n'en produisant pas", async () => {
    const { service, jobRepository } = toDependencies();

    await service.generate(jobId);

    expect(jobRepository.markDone.mock.calls[0]?.[0].draft).toBeNull();
  });

  it('remonte un echec quand le job ne peut pas etre clos', async () => {
    const { service, jobRepository } = toDependencies();
    jobRepository.markDone.mockResolvedValue(
      failure(ClassificationVoletsErrorEnum.JOB_TRANSITION_REFUSED)
    );

    const result = await service.generate(jobId);

    expect(result.success).toBe(false);
  });

  it("ignore une re-livraison d'un job déjà terminé sans rappeler le modèle", async () => {
    const { service, llm, gridRepository } = toDependencies({
      job: toJobRow(ClassificationVoletsJobStatusEnum.DONE),
    });

    const result = await service.generate(jobId);

    expect({
      success: result.success,
      llmCalls: llm.generateStructured.mock.calls.length,
      gridWrites: gridRepository.replaceGrid.mock.calls.length,
    }).toEqual({ success: true, llmCalls: 0, gridWrites: 0 });
  });

  it('ne note que les fiches que la collectivité possède', async () => {
    const { service, llm } = toDependencies({
      fiches: [
        {
          id: 1,
          collectiviteId,
          titre: 'Pistes cyclables',
          description: 'Dix km',
        },
        {
          id: 2,
          collectiviteId: collectiviteId + 1,
          titre: 'Plan velo de la voisine',
          description: 'Quinze km chez elle',
        },
      ],
      volets: [
        ...oneVoletOnVelo,
        {
          ficheId: 2,
          levierId: 'velo_transport_commun',
          categorie: 'amenagement',
        },
      ],
    });

    await service.generate(jobId);

    const [{ prompt }] = llm.generateStructured.mock.calls[0];

    expect({
      hasOwned: prompt.includes('Pistes cyclables'),
      hasShared: prompt.includes('Plan velo de la voisine'),
    }).toEqual({ hasOwned: true, hasShared: false });
  });
});
