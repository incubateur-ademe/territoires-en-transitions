import { getAuthUser, getTestApp, YOLO_DODO } from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { describe, expect } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';

const collectiviteId = 2;

describe('IndicateurDefinitionServiceRouter', () => {
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(TrpcRouter);

    yoloDodo = await getAuthUser(YOLO_DODO);

    return async () => {
      await app.close();
    };
  });

  test('list, update, delete services associated with an indicateur and a collectivite', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    const {
      data: [indicateurBefore],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurBefore.services).toHaveLength(0);

    // Check with new array of services

    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        services: [{ id: 2 }, { id: 3 }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.services).toHaveLength(2);
    expect(indicateurAfter.services).toContainEqual(
      expect.objectContaining({ id: 2 })
    );
    expect(indicateurAfter.services).toContainEqual(
      expect.objectContaining({ id: 3 })
    );

    // Keep only one service

    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        services: [{ id: 3 }],
      },
    });

    const {
      data: [indicateurFinal],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurFinal.services).toHaveLength(1);
    expect(indicateurFinal.services).toContainEqual(
      expect.objectContaining({ id: 3 })
    );
  });

  test('verify modified fields are updated', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    const {
      data: [indicateurBefore],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        services: [{ id: 2 }, { id: 3 }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.modifiedBy?.id).toEqual(yoloDodo.id);
    expect(new Date(indicateurAfter.modifiedAt).getTime()).toBeGreaterThan(
      new Date(indicateurBefore.modifiedAt).getTime()
    );
  });

  test('cannot upsert services of another collectivite', async () => {
    const callerYoloDodo = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller: callerYoloDodo,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    await expect(() =>
      callerYoloDodo.indicateurs.definitions.update({
        indicateurId,
        collectiviteId: 100,
        indicateurFields: {
          services: [{ id: 2 }, { id: 3 }],
        },
      })
    ).rejects.toThrowError(/Droits insuffisants/);
  });
});
