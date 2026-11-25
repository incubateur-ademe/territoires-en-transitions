import { ListIndicateursService } from '@tet/backend/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ListActionsService } from '@tet/backend/referentiels/list-actions/list-actions.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { UsersMetricsService } from './users-metrics.service';

const collectiviteId = 12;
const userId = '00000000-0000-0000-0000-000000000001';
const user = buildRequesterUser(userId);

const toServiceWithMocks = ({
  permission = success(undefined),
  isApiKeyAllowed = success(undefined),
  piloteCount = success(5),
  countPiloteFiches = vi.fn().mockResolvedValue(success(1)),
  countPiloteActions = vi.fn().mockResolvedValue(6),
}: {
  permission?: Result<void, 'UNAUTHORIZED'>;
  isApiKeyAllowed?: Result<void, 'UNAUTHORIZED'>;
  piloteCount?: Result<number, 'DATABASE_ERROR'>;
  countPiloteFiches?: ReturnType<typeof vi.fn>;
  countPiloteActions?: ReturnType<typeof vi.fn>;
}) => {
  const permissionsService = {
    isAllowed: vi.fn().mockResolvedValue(permission),
    isApiKeyAllowed: vi.fn().mockReturnValue(isApiKeyAllowed),
  } as unknown as PermissionService;
  const listFichesService = {
    countPiloteFiches,
    countPiloteSubFiches: vi.fn().mockResolvedValue(success(2)),
    countPiloteFichesIndicateurs: vi.fn().mockResolvedValue(success(3)),
  } as unknown as ListFichesService;
  const listIndicateursService = {
    getMesIndicateursCount: vi.fn().mockResolvedValue(piloteCount),
  } as unknown as ListIndicateursService;
  const listActionsService = {
    countPiloteActions,
  } as unknown as ListActionsService;
  return new UsersMetricsService(
    permissionsService,
    listFichesService,
    listIndicateursService,
    listActionsService
  );
};

describe('UsersMetricsService.getMetrics', () => {
  it("retourne les métriques personnelles de l'utilisateur", async () => {
    const result = await toServiceWithMocks({}).getMetrics(
      collectiviteId,
      user
    );

    expect(result).toEqual(
      success({
        plans: {
          piloteFichesCount: 1,
          piloteSubFichesCount: 2,
          piloteFichesIndicateursCount: 3,
        },
        indicateurs: { piloteCount: 5 },
        referentiels: { piloteMesuresCount: 6 },
      })
    );
  });

  it("refuse l'utilisateur sans droit de lecture avec le message du refus de permission", async () => {
    const result = await toServiceWithMocks({
      permission: failure('UNAUTHORIZED'),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          `Droits insuffisants, l'utilisateur ${userId} n'a pas l'autorisation collectivites.read sur la ressource Collectivité ${collectiviteId}`
        )
      )
    );
  });

  it("refuse la clé d'api sans l'autorisation de lecture avec le message de la clé", async () => {
    const result = await toServiceWithMocks({
      permission: failure('UNAUTHORIZED'),
      isApiKeyAllowed: failure('UNAUTHORIZED'),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          "Droits insuffisants, la clé d'api n'a pas l'autorisation collectivites.read."
        )
      )
    );
  });

  it("propage l'échec du comptage des indicateurs pilotés avec sa cause", async () => {
    const cause = new Error('lecture impossible');

    const result = await toServiceWithMocks({
      piloteCount: failure('DATABASE_ERROR', cause),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it("convertit l'exception d'un comptage en DATABASE_ERROR avec sa cause", async () => {
    const cause = new Error('connexion perdue');

    const result = await toServiceWithMocks({
      countPiloteFiches: vi.fn().mockRejectedValue(cause),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it("convertit l'échec d'un comptage des fiches pilotées en DATABASE_ERROR avec sa cause", async () => {
    const cause = new Error('requête des fiches pilotées en échec');

    const result = await toServiceWithMocks({
      countPiloteFiches: vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', cause)),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it("convertit l'exception du comptage des mesures pilotées en DATABASE_ERROR avec sa cause", async () => {
    const cause = new Error("l'utilisateur n'a pas d'identifiant");

    const result = await toServiceWithMocks({
      countPiloteActions: vi.fn().mockRejectedValue(cause),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });
});
