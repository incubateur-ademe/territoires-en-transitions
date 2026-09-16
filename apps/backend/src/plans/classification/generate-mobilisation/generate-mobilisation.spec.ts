import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassificationVoletsErrorEnum } from '../classification-volets.errors';
import { VoletErrorEnum } from '../volet.errors';
import { ClassificationOutcome } from '../models/classification-outcome';
import {
  ClassificationVoletsJob,
  ClassificationVoletsJobStatusEnum,
} from '../models/classification-volets-job';
import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { GenerateMobilisationService } from './generate-mobilisation.service';

const jobId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 7;

const transaction = { marker: 'transaction' } as unknown as Transaction;

const classificationTokens = {
  promptTokens: 100,
  cachedTokens: 0,
  candidatesTokens: 50,
  thoughtsTokens: 10,
  totalTokens: 160,
};

const mobilisationTokens = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

const job: ClassificationVoletsJob = {
  id: jobId,
  collectiviteId,
  enjeu: 'ges',
  etape: 'classification',
  createdBy: 'a-user',
  status: ClassificationVoletsJobStatusEnum.RUNNING,
  processedBatches: 0,
  totalBatches: 0,
  draft: null,
  tokenUsage: null,
  error: null,
  createdAt: '2026-09-15T00:00:00Z',
  modifiedAt: '2026-09-15T00:00:00Z',
};

const oneVoletOnVelo: FicheVolet[] = [
  { ficheId: 1, levierId: 'velo_transport_commun', categorie: 'amenagement' },
];

const toOutcome = (
  volets: FicheVolet[] = oneVoletOnVelo
): ClassificationOutcome => ({
  draft: { fiches: [] },
  fiches: [{ ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' }],
  volets,
  tokens: classificationTokens,
});

const toDependencies = ({
  scoringFails = false,
  collectiviteIsUnreadable = false,
  phaseIsRefused = false,
  gridWriteFails = false,
} = {}) => {
  const jobRepository = {
    startMobilisationPhase: vi
      .fn()
      .mockResolvedValue(
        phaseIsRefused
          ? failure(ClassificationVoletsErrorEnum.JOB_TRANSITION_REFUSED)
          : success(undefined)
      ),
    recordProcessedBatches: vi.fn().mockResolvedValue(undefined),
    markDone: vi.fn().mockResolvedValue(success(undefined)),
    markFailed: vi.fn().mockResolvedValue(success(undefined)),
  };
  const gridRepository = {
    replaceGrid: vi
      .fn()
      .mockResolvedValue(
        gridWriteFails
          ? failure(VoletErrorEnum.SAVE_VOLETS_ERROR)
          : success(undefined)
      ),
  };
  const collectivitesService = {
    getCollectiviteAvecType: vi.fn().mockImplementation(async () => {
      if (collectiviteIsUnreadable) {
        throw new Error('collectivite injoignable');
      }
      return { nom: 'Ville de test', population: 3000 };
    }),
  };
  const llm = {
    generateStructured: vi.fn(async (_args: { prompt: string }) =>
      scoringFails
        ? failure({ kind: 'llm_error' })
        : success({
            data: { '1': 3, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
            tokens: mobilisationTokens,
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
    gridRepository as never,
    collectivitesService as never,
    llm as never,
    transactionManager as never
  );

  return { service, jobRepository, gridRepository, llm };
};

describe('GenerateMobilisationService.score', () => {
  it('interrompt une classification qui ne rattache aucun levier, sans appeler le modèle', async () => {
    const { service, llm, jobRepository, gridRepository } = toDependencies();

    const result = await service.score(job, toOutcome([]));

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
        "La classification n'a rattaché aucune action à un levier : il n'y a rien à évaluer.",
    });
  });

  it('bascule le job sur la phase mobilisation avant de noter', async () => {
    const { service, jobRepository } = toDependencies();

    await service.score(job, toOutcome());

    expect(jobRepository.startMobilisationPhase.mock.calls[0]).toEqual([
      jobId,
      1,
    ]);
  });

  it('avorte sans écrire quand un levier échoue, laissant la grille précédente', async () => {
    const { service, gridRepository, jobRepository } = toDependencies({
      scoringFails: true,
    });

    const result = await service.score(job, toOutcome());

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

    await service.score(job, toOutcome());

    expect({
      gridTx: gridRepository.replaceGrid.mock.calls[0]?.[0].tx,
      doneTx: jobRepository.markDone.mock.calls[0]?.[0].tx,
    }).toEqual({ gridTx: transaction, doneTx: transaction });
  });

  it('additionne les jetons des deux phases sur le job terminé', async () => {
    const { service, jobRepository } = toDependencies();

    await service.score(job, toOutcome());

    expect(jobRepository.markDone.mock.calls[0]?.[0].tokenUsage).toEqual({
      promptTokens: 110,
      cachedTokens: 0,
      candidatesTokens: 55,
      thoughtsTokens: 11,
      totalTokens: 176,
    });
  });

  it('interrompt sans appeler le modele quand la collectivite est illisible', async () => {
    const { service, llm, jobRepository } = toDependencies({
      collectiviteIsUnreadable: true,
    });

    const result = await service.score(job, toOutcome());

    expect({
      success: result.success,
      llmCalls: llm.generateStructured.mock.calls.length,
      failureMessage: jobRepository.markFailed.mock.calls[0]?.[1],
    }).toEqual({
      success: false,
      llmCalls: 0,
      failureMessage: `La collectivité ${collectiviteId} est introuvable.`,
    });
  });

  it('renonce sans appeler le modele quand la bascule de phase est refusee', async () => {
    const { service, llm } = toDependencies({ phaseIsRefused: true });

    const result = await service.score(job, toOutcome());

    expect({
      errorKind: result.success ? undefined : result.error.kind,
      llmCalls: llm.generateStructured.mock.calls.length,
    }).toEqual({ errorKind: 'transition_failed', llmCalls: 0 });
  });

  it("nomme l'etape fautive quand l'ecriture de la grille echoue", async () => {
    const { service, jobRepository } = toDependencies({ gridWriteFails: true });

    const result = await service.score(job, toOutcome());

    expect({
      success: result.success,
      doneCalls: jobRepository.markDone.mock.calls.length,
      failureMessage: jobRepository.markFailed.mock.calls[0]?.[1],
    }).toEqual({
      success: false,
      doneCalls: 0,
      failureMessage:
        'Écriture de la grille impossible (replace_grid). La grille précédente est conservée.',
    });
  });

  it('remonte un echec quand le job ne peut pas etre clos', async () => {
    const { service, jobRepository } = toDependencies();
    jobRepository.markDone.mockResolvedValue(
      failure(ClassificationVoletsErrorEnum.JOB_TRANSITION_REFUSED)
    );

    const result = await service.score(job, toOutcome());

    expect(result.success).toBe(false);
  });

  it('nourrit le prompt avec les fiches que la classification vient de traiter', async () => {
    const { service, llm } = toDependencies();

    await service.score(job, toOutcome());

    const [{ prompt }] = llm.generateStructured.mock.calls[0];

    expect(prompt).toContain('Pistes cyclables');
  });
});
