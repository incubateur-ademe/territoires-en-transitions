import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassificationVoletsErrorEnum } from '../classification-volets.errors';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import {
  ClassificationVoletsJob,
  ClassificationVoletsJobStatus,
  ClassificationVoletsJobStatusEnum,
} from '../models/classification-volets-job';
import { GenerateAnalysisService } from './generate-analysis.service';

const jobId = '00000000-0000-0000-0000-000000000001';

const toJobRow = (
  status: ClassificationVoletsJobStatus = ClassificationVoletsJobStatusEnum.RUNNING
): ClassificationVoletsJob => ({
  id: jobId,
  collectiviteId: 7,
  enjeu: 'ges',
  etape: 'classification',
  createdBy: 'a-user',
  status,
  processedBatches: 0,
  totalBatches: 1,
  draft: null,
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
  persistFails = false,
  jobIsUnreadable = false,
} = {}) => {
  const jobRepository = {
    getById: vi
      .fn()
      .mockResolvedValue(
        jobIsUnreadable
          ? failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR)
          : success(job)
      ),
    markFailed: vi.fn().mockResolvedValue(success(undefined)),
  };
  const classificationService = {
    persist: vi.fn().mockResolvedValue(
      persistFails
        ? failure({ kind: 'interrupted', jobId, message: 'ecriture refusee' })
        : success({
            draft: { fiches: classifications.flatMap((c) => c.classified) },
            fiches: classifications.flatMap((c) => c.sources),
            volets: [],
            tokens: classifications[0].tokens,
          })
    ),
  };
  const mobilisationService = {
    score: vi.fn().mockResolvedValue(success(undefined)),
  };

  const service = new GenerateAnalysisService(
    jobRepository as never,
    classificationService as never,
    mobilisationService as never
  );

  return { service, jobRepository, classificationService, mobilisationService };
};

describe('GenerateAnalysisService.generate', () => {
  it('persiste le classement puis enchaîne la mobilisation', async () => {
    const { service, classificationService, mobilisationService } =
      toDependencies();

    const result = await service.generate(jobId, classifications);

    expect({
      success: result.success,
      persistCalls: classificationService.persist.mock.calls.length,
      scoreCalls: mobilisationService.score.mock.calls.length,
    }).toEqual({ success: true, persistCalls: 1, scoreCalls: 1 });
  });

  it("n'entame pas la mobilisation quand le classement n'a pas pu être écrit", async () => {
    const { service, mobilisationService } = toDependencies({
      persistFails: true,
    });

    const result = await service.generate(jobId, classifications);

    expect({
      success: result.success,
      scoreCalls: mobilisationService.score.mock.calls.length,
    }).toEqual({ success: false, scoreCalls: 0 });
  });

  it('passe à la mobilisation ce que la persistance vient de rendre', async () => {
    const { service, classificationService, mobilisationService } =
      toDependencies();

    await service.generate(jobId, classifications);

    const [, outcome] = mobilisationService.score.mock.calls[0];
    const persisted = await classificationService.persist.mock.results[0].value;

    expect(outcome).toBe(persisted.data);
  });

  it('renonce sans rien classer quand le job lui-meme est illisible', async () => {
    const { service, classificationService } = toDependencies({
      jobIsUnreadable: true,
    });

    const result = await service.generate(jobId, classifications);

    expect({
      errorKind: result.success ? undefined : result.error.kind,
      persistCalls: classificationService.persist.mock.calls.length,
    }).toEqual({ errorKind: 'job_unreadable', persistCalls: 0 });
  });

  it("ignore une re-livraison d'un job déjà terminé sans rien relancer", async () => {
    const { service, classificationService, mobilisationService } =
      toDependencies({ job: toJobRow(ClassificationVoletsJobStatusEnum.DONE) });

    const result = await service.generate(jobId, classifications);

    expect({
      success: result.success,
      persistCalls: classificationService.persist.mock.calls.length,
      scoreCalls: mobilisationService.score.mock.calls.length,
    }).toEqual({ success: true, persistCalls: 0, scoreCalls: 0 });
  });
});
