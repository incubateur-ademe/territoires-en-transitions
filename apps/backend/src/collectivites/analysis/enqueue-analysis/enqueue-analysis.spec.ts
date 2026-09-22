import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisJobErrorEnum } from '../analysis-job.errors';
import {
  CLASSIFY_BATCH_QUEUE_NAME,
  FICHES_PER_BATCH,
} from '../classify-batch/classify-batch.queue';
import { EnqueueAnalysisService } from './enqueue-analysis.service';

const collectiviteId = 7;
const jobCreatedAt = '2026-09-21T10:00:00.000Z';

const jobId = '00000000-0000-0000-0000-000000000001';

const user: AuthenticatedUser = {
  id: 'a-user',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
} as AuthenticatedUser;

const toOwnedFiches = (count: number) =>
  Array.from({ length: count }, (unused, index) => ({
    id: index + 1,
    collectiviteId,
    titre: `Fiche ${index + 1}`,
    description: 'Un descriptif',
  }));

const toDependencies = ({
  fiches = toOwnedFiches(1),
  isAllowed = true,
  markRunningFails = false,
}: {
  fiches?: {
    id: number;
    collectiviteId: number;
    titre: string | null;
    description: string | null;
  }[];
  isAllowed?: boolean;
  markRunningFails?: boolean;
} = {}) => {
  const permissions = {
    isAllowed: vi
      .fn()
      .mockResolvedValue(
        isAllowed ? success(undefined) : failure('UNAUTHORIZED')
      ),
  };
  const jobRepository = {
    createUnlessInFlight: vi
      .fn()
      .mockResolvedValue(success({ id: jobId, createdAt: jobCreatedAt })),
    markRunning: vi
      .fn()
      .mockResolvedValue(
        markRunningFails
          ? failure(AnalysisJobErrorEnum.JOB_TRANSITION_REFUSED)
          : success(undefined)
      ),
    markFailed: vi.fn().mockResolvedValue(success(undefined)),
  };
  const listFichesService = {
    getFichesActionResumes: vi
      .fn()
      .mockResolvedValue({ count: fiches.length, data: fiches }),
  };
  const flow = { add: vi.fn().mockResolvedValue(undefined) };

  const service = new EnqueueAnalysisService(
    permissions as never,
    jobRepository as never,
    listFichesService as never,
    flow as never
  );

  return { service, jobRepository, listFichesService, flow };
};

const toSpawnedChildren = (flow: { add: ReturnType<typeof vi.fn> }) =>
  flow.add.mock.calls[0]?.[0].children ?? [];

describe('EnqueueAnalysisService.enqueue', () => {
  it('refuse une collectivite sans aucune fiche a classer', async () => {
    const { service, flow } = toDependencies({ fiches: [] });

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({ result, flowCalls: flow.add.mock.calls.length }).toEqual({
      result: {
        success: false,
        error: AnalysisJobErrorEnum.NO_FICHE_TO_CLASSIFY,
      },
      flowCalls: 0,
    });
  });

  it('essaime un enfant par lot de fiches a classer', async () => {
    const { service, flow } = toDependencies({ fiches: toOwnedFiches(52) });

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );
    const children = toSpawnedChildren(flow);

    expect({
      result,
      childCount: children.length,
      queueName: children[0]?.queueName,
      firstBatchSize: children[0]?.data.fiches.length,
      lastBatchSize: children[2]?.data.fiches.length,
      failsParent: children[0]?.opts.failParentOnFailure,
    }).toEqual({
      result: { success: true, data: { jobId } },
      childCount: Math.ceil(52 / FICHES_PER_BATCH),
      queueName: CLASSIFY_BATCH_QUEUE_NAME,
      firstBatchSize: FICHES_PER_BATCH,
      lastBatchSize: 52 - 2 * FICHES_PER_BATCH,
      failsParent: true,
    });
  });

  it('ne demande que les fiches rattachees a un plan et non restreintes', async () => {
    const { service, listFichesService } = toDependencies();

    await service.enqueue({ collectiviteId, enjeu: 'ges' }, { user });

    expect(listFichesService.getFichesActionResumes.mock.calls[0]?.[0]).toEqual(
      {
        collectiviteId,
        filters: { noPlan: false, restreint: false },
        queryOptions: { limit: 'all' },
      }
    );
  });

  it("n'essaime jamais d'enfant pour une fiche partagee par une autre collectivite", async () => {
    const { service, flow } = toDependencies({
      fiches: [
        ...toOwnedFiches(1),
        {
          id: 2,
          collectiviteId: collectiviteId + 1,
          titre: 'Plan velo de la voisine',
          description: 'Quinze km chez elle',
        },
      ],
    });

    await service.enqueue({ collectiviteId, enjeu: 'ges' }, { user });
    const children = toSpawnedChildren(flow);

    expect({
      childCount: children.length,
      titles: children.flatMap(
        (child: { data: { fiches: { titre: string }[] } }) =>
          child.data.fiches.map(({ titre }) => titre)
      ),
    }).toEqual({ childCount: 1, titles: ['Fiche 1'] });
  });

  it('annonce le nombre de lots comme total du job', async () => {
    const { service, jobRepository } = toDependencies({
      fiches: toOwnedFiches(52),
    });

    await service.enqueue({ collectiviteId, enjeu: 'ges' }, { user });

    expect(jobRepository.markRunning.mock.calls[0]).toEqual([
      jobId,
      Math.ceil(52 / FICHES_PER_BATCH),
    ]);
  });

  it('libere le job quand son demarrage echoue, sans bloquer un nouvel essai', async () => {
    const { service, jobRepository, flow } = toDependencies({
      markRunningFails: true,
    });

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({
      result,
      compensation: jobRepository.markFailed.mock.calls[0]?.[1],
      flowCalls: flow.add.mock.calls.length,
    }).toEqual({
      result: {
        success: false,
        error: AnalysisJobErrorEnum.UPDATE_JOB_ERROR,
      },
      compensation: 'Le demarrage du job a echoue',
      flowCalls: 0,
    });
  });

  it('presente une collectivite hors perimetre comme introuvable', async () => {
    const { service, flow } = toDependencies({ isAllowed: false });

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({ result, flowCalls: flow.add.mock.calls.length }).toEqual({
      result: {
        success: false,
        error: AnalysisJobErrorEnum.COLLECTIVITE_NOT_FOUND,
      },
      flowCalls: 0,
    });
  });

  it("compense le job quand l'essaimage echoue", async () => {
    const { service, jobRepository, flow } = toDependencies();
    flow.add.mockRejectedValue(new Error('redis down'));

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({
      result,
      compensation: jobRepository.markFailed.mock.calls[0]?.[1],
    }).toEqual({
      result: {
        success: false,
        error: AnalysisJobErrorEnum.CREATE_JOB_ERROR,
      },
      compensation: "L'enfilement du job a échoué",
    });
  });
});
