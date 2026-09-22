import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisJobErrorEnum } from '../analysis-job.errors';
import { VoletErrorEnum } from '../volet.errors';
import { ClassificationOutcome } from '../models/classification-outcome';
import { AnalysisJob, AnalysisJobStatusEnum } from '../models/analysis-job';
import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { ScoreMobilisationService } from './score-mobilisation.service';

const jobId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 7;

const mobilisationTokens = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

const job: AnalysisJob = {
  id: jobId,
  collectiviteId,
  enjeu: 'ges',
  etape: 'classification',
  createdBy: 'a-user',
  status: AnalysisJobStatusEnum.RUNNING,
  processedBatches: 0,
  totalBatches: 0,
  draft: null,
  tokenUsage: null,
  error: null,
  createdAt: '2026-09-15T00:00:00Z',
  modifiedAt: '2026-09-15T00:00:00Z',
};

const voletsOnTwoLeviers: FicheVolet[] = [
  { ficheId: 1, levierId: 'velo_transport_commun', categorie: 'amenagement' },
  { ficheId: 2, levierId: 'covoiturage', categorie: 'amenagement' },
];

const oneVoletOnVelo: FicheVolet[] = [
  { ficheId: 1, levierId: 'velo_transport_commun', categorie: 'amenagement' },
];

const toOutcome = (
  volets: FicheVolet[] = oneVoletOnVelo
): ClassificationOutcome => ({
  draft: { fiches: [] },
  fiches: [{ ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' }],
  volets,
});

const toDependencies = ({
  scoringFails = false,
  collectiviteIsUnreadable = false,
  phaseIsRefused = false,
  mobilisationWriteFails = false,
  scoringFailsAfterFirstLevier = false,
} = {}) => {
  const jobRepository = {
    startMobilisationPhase: vi
      .fn()
      .mockResolvedValue(
        phaseIsRefused
          ? failure(AnalysisJobErrorEnum.JOB_TRANSITION_REFUSED)
          : success(undefined)
      ),
    recordProcessedBatches: vi.fn().mockResolvedValue(undefined),
    addTokenUsage: vi.fn().mockResolvedValue(undefined),
    markDone: vi.fn().mockResolvedValue(success(undefined)),
    markFailed: vi.fn().mockResolvedValue(success(undefined)),
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
  const collectivitesService = {
    getCollectiviteAvecType: vi.fn().mockImplementation(async () => {
      if (collectiviteIsUnreadable) {
        throw new Error('collectivite injoignable');
      }
      return { nom: 'Ville de test', population: 3000 };
    }),
  };
  const scoredLevier = success({
    data: { '1': 3, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
    tokens: mobilisationTokens,
  });
  const unscoredLevier = failure({ kind: 'rate_limited' });

  const generateStructured = vi.fn().mockResolvedValue(scoredLevier);
  if (scoringFails) {
    generateStructured.mockResolvedValue(unscoredLevier);
  }
  if (scoringFailsAfterFirstLevier) {
    generateStructured
      .mockResolvedValueOnce(scoredLevier)
      .mockResolvedValue(unscoredLevier);
  }
  const llm = { generateStructured };

  const service = new ScoreMobilisationService(
    jobRepository as never,
    mobilisationRepository as never,
    collectivitesService as never,
    llm as never
  );

  return { service, jobRepository, mobilisationRepository, llm };
};

describe('ScoreMobilisationService.score', () => {
  it('interrompt une classification qui ne rattache aucun levier, sans appeler le modèle', async () => {
    const { service, llm, jobRepository } = toDependencies();

    const result = await service.score(job, toOutcome([]));

    expect({
      success: result.success,
      llmCalls: llm.generateStructured.mock.calls.length,
      failureMessage: jobRepository.markFailed.mock.calls[0]?.[1],
    }).toEqual({
      success: false,
      llmCalls: 0,
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

  it("n'ecrit aucune mobilisation par lui-meme", async () => {
    const { service, mobilisationRepository, jobRepository } = toDependencies();

    await service.score(job, toOutcome());

    expect({
      mobilisationWrites:
        mobilisationRepository.replaceMobilisation.mock.calls.length,
      doneCalls: jobRepository.markDone.mock.calls.length,
    }).toEqual({ mobilisationWrites: 0, doneCalls: 0 });
  });

  it("avorte quand un levier échoue, sans qu'aucune écriture ait eu lieu", async () => {
    const { service, jobRepository } = toDependencies({ scoringFails: true });

    const result = await service.score(job, toOutcome());

    expect({
      success: result.success,
      failureMessage: jobRepository.markFailed.mock.calls[0]?.[1],
    }).toEqual({
      success: false,
      failureMessage:
        "Mobilisation abandonnée : 1 levier(s) en échec sur 1 — Vélo et transport en commun (rate_limited). Aucune écriture n'a eu lieu.",
    });
  });

  it('enregistre les jetons deja depenses meme quand un levier echoue', async () => {
    const { service, jobRepository } = toDependencies({
      scoringFailsAfterFirstLevier: true,
    });

    await service.score(job, toOutcome(voletsOnTwoLeviers));

    expect(jobRepository.addTokenUsage.mock.calls).toEqual([
      [jobId, mobilisationTokens],
    ]);
  });

  it('rend les leviers notes, sans les jetons qui vont en base', async () => {
    const { service } = toDependencies();

    const result = await service.score(job, toOutcome());

    expect(result.success ? result.data : undefined).toEqual({
      leviers: [
        {
          levierId: 'velo_transport_commun',
          volets: [
            { categorie: 'amenagement', note: 3, ficheIds: [1] },
            { categorie: 'planification', note: 0, ficheIds: [] },
            { categorie: 'financement', note: 0, ficheIds: [] },
            { categorie: 'gouvernance', note: 0, ficheIds: [] },
            { categorie: 'exemplarite', note: 0, ficheIds: [] },
            { categorie: 'sensibilisation', note: 0, ficheIds: [] },
          ],
        },
      ],
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

  it('nourrit le prompt avec les fiches que la classification vient de traiter', async () => {
    const { service, llm } = toDependencies();

    await service.score(job, toOutcome());

    const [{ prompt }] = llm.generateStructured.mock.calls[0];

    expect(prompt).toContain('Pistes cyclables');
  });
});
