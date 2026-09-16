import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassificationVoletsErrorEnum } from '../classification-volets.errors';
import {
  CLASSIFY_BATCH_QUEUE_NAME,
  FICHES_PER_BATCH,
} from '../classify-batch/classify-batch.queue';
import { EnqueueAnalysisService } from './enqueue-analysis.service';

const collectiviteId = 7;
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
    createUnlessInFlight: vi.fn().mockResolvedValue(success({ id: jobId })),
    markRunning: vi
      .fn()
      .mockResolvedValue(
        markRunningFails
          ? failure(ClassificationVoletsErrorEnum.JOB_TRANSITION_REFUSED)
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
        error: ClassificationVoletsErrorEnum.NO_FICHE_TO_CLASSIFY,
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
      enfants: children.length,
      file: children[0]?.queueName,
      premierLot: children[0]?.data.fiches.length,
      dernierLot: children[2]?.data.fiches.length,
      remonteAuParent: children[0]?.opts.failParentOnFailure,
    }).toEqual({
      result: { success: true, data: { jobId } },
      enfants: Math.ceil(52 / FICHES_PER_BATCH),
      file: CLASSIFY_BATCH_QUEUE_NAME,
      premierLot: FICHES_PER_BATCH,
      dernierLot: 52 - 2 * FICHES_PER_BATCH,
      remonteAuParent: true,
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
      enfants: children.length,
      titres: children.flatMap(
        (child: { data: { fiches: { titre: string }[] } }) =>
          child.data.fiches.map(({ titre }) => titre)
      ),
    }).toEqual({ enfants: 1, titres: ['Fiche 1'] });
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
        error: ClassificationVoletsErrorEnum.UPDATE_JOB_ERROR,
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
        error: ClassificationVoletsErrorEnum.COLLECTIVITE_NOT_FOUND,
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
        error: ClassificationVoletsErrorEnum.CREATE_JOB_ERROR,
      },
      compensation: "L'enfilement du job a échoué",
    });
  });
});
