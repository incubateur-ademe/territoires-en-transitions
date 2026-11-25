import { ListIndicateursService } from '@tet/backend/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import PlanActionsService from '@tet/backend/plans/fiches/plan-actions.service';
import { ListLabellisationsService } from '@tet/backend/referentiels/labellisations/list-labellisations.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { CollectivitesMetricsService } from './collectivites-metrics.service';

const collectiviteId = 12;
const userId = '00000000-0000-0000-0000-000000000001';
const user = buildRequesterUser(userId);

const toServiceWithMocks = ({
  permission = success(undefined),
  isApiKeyAllowed = success(undefined),
  favorisCount = success(3),
  personnalisesCount = success(2),
  planCount = vi.fn().mockResolvedValue(4),
}: {
  permission?: Result<void, 'UNAUTHORIZED'>;
  isApiKeyAllowed?: Result<void, 'UNAUTHORIZED'>;
  favorisCount?: Result<number, 'DATABASE_ERROR'>;
  personnalisesCount?: Result<number, 'DATABASE_ERROR'>;
  planCount?: ReturnType<typeof vi.fn>;
}) => {
  const permissionsService = {
    isAllowed: vi.fn().mockResolvedValue(permission),
    isApiKeyAllowed: vi.fn().mockReturnValue(isApiKeyAllowed),
  } as unknown as PermissionService;
  const listLabellisationService = {
    listCollectiviteLabellisations: vi.fn().mockResolvedValue({ data: [] }),
  } as unknown as ListLabellisationsService;
  const planActionsService = {
    count: planCount,
  } as unknown as PlanActionsService;
  const listFichesService = {
    count: vi.fn().mockResolvedValue(success(7)),
  } as unknown as ListFichesService;
  const listIndicateursService = {
    getFavorisCount: vi.fn().mockResolvedValue(favorisCount),
    getPersonnalisesCount: vi.fn().mockResolvedValue(personnalisesCount),
  } as unknown as ListIndicateursService;
  return new CollectivitesMetricsService(
    permissionsService,
    listLabellisationService,
    planActionsService,
    listFichesService,
    listIndicateursService
  );
};

describe('CollectivitesMetricsService.getMetrics', () => {
  it('retourne les métriques de la collectivité', async () => {
    const result = await toServiceWithMocks({}).getMetrics(
      collectiviteId,
      user
    );

    expect(result).toEqual(
      success({
        labellisations: {},
        plans: { count: 4, fiches: 7 },
        indicateurs: { favoris: 3, personnalises: 2 },
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

  it("propage l'échec du comptage des indicateurs favoris avec sa cause", async () => {
    const cause = new Error('lecture impossible');

    const result = await toServiceWithMocks({
      favorisCount: failure('DATABASE_ERROR', cause),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it("propage l'échec du comptage des indicateurs personnalisés avec sa cause", async () => {
    const cause = new Error('lecture impossible');

    const result = await toServiceWithMocks({
      personnalisesCount: failure('DATABASE_ERROR', cause),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it("convertit l'exception d'un comptage en DATABASE_ERROR avec sa cause", async () => {
    const cause = new Error('connexion perdue');

    const result = await toServiceWithMocks({
      planCount: vi.fn().mockRejectedValue(cause),
    }).getMetrics(collectiviteId, user);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });
});
