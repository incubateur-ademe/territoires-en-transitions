import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassificationVoletsErrorEnum } from '../classification-volets.errors';
import { EnqueueClassificationService } from './enqueue-classification.service';

const collectiviteId = 7;
const jobId = '00000000-0000-0000-0000-000000000001';

const user: AuthenticatedUser = {
  id: 'a-user',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
} as AuthenticatedUser;

const toFiches = (count: number) =>
  Array.from({ length: count }, (unused, index) => ({
    ficheId: index + 1,
    titre: `Fiche ${index + 1}`,
    description: 'Un descriptif',
  }));

const toDependencies = ({
  ficheCount = 1,
  isAllowed = true,
}: {
  ficheCount?: number;
  isAllowed?: boolean;
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
    markFailed: vi.fn().mockResolvedValue(success(undefined)),
  };
  const listFichesService = {
    getFichesActionResumes: vi
      .fn()
      .mockResolvedValue({ count: ficheCount, data: toFiches(ficheCount) }),
  };
  const queue = { add: vi.fn().mockResolvedValue(undefined) };

  const service = new EnqueueClassificationService(
    permissions as never,
    jobRepository as never,
    listFichesService as never,
    queue as never
  );

  return { service, jobRepository, listFichesService, queue };
};

describe('EnqueueClassificationService.enqueue', () => {
  it('refuse une collectivite sans aucune fiche a classer', async () => {
    const { service, queue } = toDependencies({ ficheCount: 0 });

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({ result, queueCalls: queue.add.mock.calls.length }).toEqual({
      result: {
        success: false,
        error: ClassificationVoletsErrorEnum.NO_FICHE_TO_CLASSIFY,
      },
      queueCalls: 0,
    });
  });

  it('enfile un job de classification pour une collectivite qui a des fiches', async () => {
    const { service, jobRepository } = toDependencies({ ficheCount: 900 });

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({
      result,
      createArgs: jobRepository.createUnlessInFlight.mock.calls[0]?.[0],
    }).toEqual({
      result: { success: true, data: { jobId } },
      createArgs: {
        collectiviteId,
        enjeu: 'ges',
        createdBy: user.id,
      },
    });
  });

  it('ne compte que les fiches rattachees a un plan et non restreintes', async () => {
    const { service, listFichesService } = toDependencies();

    await service.enqueue({ collectiviteId, enjeu: 'ges' }, { user });

    expect(listFichesService.getFichesActionResumes.mock.calls[0]?.[0]).toEqual(
      {
        collectiviteId,
        filters: { noPlan: false, restreint: false },
        queryOptions: { limit: 1, page: 1 },
      }
    );
  });

  it('presente une collectivite hors perimetre comme introuvable', async () => {
    const { service, queue } = toDependencies({ isAllowed: false });

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({ result, queueCalls: queue.add.mock.calls.length }).toEqual({
      result: {
        success: false,
        error: ClassificationVoletsErrorEnum.COLLECTIVITE_NOT_FOUND,
      },
      queueCalls: 0,
    });
  });

  it("compense le job quand l'enfilement dans la queue echoue", async () => {
    const { service, jobRepository, queue } = toDependencies();
    queue.add.mockRejectedValue(new Error('redis down'));

    const result = await service.enqueue(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect({
      result,
      markFailedArgs: jobRepository.markFailed.mock.calls[0],
    }).toEqual({
      result: {
        success: false,
        error: ClassificationVoletsErrorEnum.CREATE_JOB_ERROR,
      },
      markFailedArgs: [jobId, "L'enfilement du job a échoué"],
    });
  });
});
