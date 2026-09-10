import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassificationLeviersErrorEnum } from '../classification-leviers.errors';
import { EnqueueClassificationService } from './enqueue-classification.service';

const planId = 42;
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
  parent = null,
  isAllowed = true,
}: {
  ficheCount?: number;
  parent?: number | null;
  isAllowed?: boolean;
} = {}) => {
  const getAxeRepository = {
    getAxe: vi.fn().mockResolvedValue(success({ collectiviteId, parent })),
  };
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
    getAxeRepository as never,
    jobRepository as never,
    listFichesService as never,
    queue as never
  );

  return { service, jobRepository, queue };
};

describe('EnqueueClassificationService.enqueue', () => {
  it('refuse un plan sans aucune fiche a classer', async () => {
    const { service, queue } = toDependencies({ ficheCount: 0 });

    const result = await service.enqueue({ planId }, { user });

    expect({ result, queueCalls: queue.add.mock.calls.length }).toEqual({
      result: {
        success: false,
        error: ClassificationLeviersErrorEnum.NO_FICHE_TO_CLASSIFY,
      },
      queueCalls: 0,
    });
  });

  it('enfile un job pour un plan qui a des fiches', async () => {
    const { service } = toDependencies({ ficheCount: 900 });

    const result = await service.enqueue({ planId }, { user });

    expect(result).toEqual({ success: true, data: { jobId } });
  });

  it("presente un sous-axe d'une autre collectivite comme un plan introuvable", async () => {
    const { service } = toDependencies({ parent: 12, isAllowed: false });

    const result = await service.enqueue({ planId }, { user });

    expect(result).toEqual({
      success: false,
      error: ClassificationLeviersErrorEnum.PLAN_NOT_FOUND,
    });
  });

  it("compense le job quand l'enfilement dans la queue echoue", async () => {
    const { service, jobRepository, queue } = toDependencies();
    queue.add.mockRejectedValue(new Error('redis down'));

    const result = await service.enqueue({ planId }, { user });

    expect({
      result,
      markFailedArgs: jobRepository.markFailed.mock.calls[0],
    }).toEqual({
      result: {
        success: false,
        error: ClassificationLeviersErrorEnum.CREATE_JOB_ERROR,
      },
      markFailedArgs: [jobId, "L'enfilement du job a échoué"],
    });
  });
});
