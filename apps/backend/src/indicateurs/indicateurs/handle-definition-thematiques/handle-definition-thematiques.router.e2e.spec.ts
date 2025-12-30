import { getAuthUser, getTestApp, YOLO_DODO } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { describe, expect } from 'vitest';
import { createIndicateurPerso } from '../../definitions/definitions.test-fixture';

const collectiviteId = 2;

describe('IndicateurDefinitionThematiqueRouter', () => {
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

  test('list existing thematiques associated with an indicateur', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
        thematiques: [{ id: 3 }], // assume that the thematique 3 exists
      },
    });

    const {
      data: [indicateur],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateur.thematiques).toHaveLength(1);
    expect(indicateur.thematiques).toContainEqual(
      expect.objectContaining({ id: 3 })
    );
  });

  test('list, update, delete thematiques associated with an indicateur and a collectivite', async () => {
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
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurBefore.thematiques).toHaveLength(0);

    // Check with new array of thematiques

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        thematiques: [{ id: 4 }, { id: 5 }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.thematiques).toHaveLength(2);
    expect(indicateurAfter.thematiques).toContainEqual(
      expect.objectContaining({ id: 4 })
    );
    expect(indicateurAfter.thematiques).toContainEqual(
      expect.objectContaining({ id: 5 })
    );

    // Keep only one thematique

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        thematiques: [{ id: 5 }],
      },
    });

    const {
      data: [indicateurEmpty],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurEmpty.thematiques).toHaveLength(1);
    expect(indicateurEmpty.thematiques).toContainEqual(
      expect.objectContaining({ id: 5 })
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
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        thematiques: [{ id: 4 }, { id: 5 }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.indicateurs.list({
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

  test('cannot upsert thematiques of another collectivite', async () => {
    const callerYoloDodo = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller: callerYoloDodo,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    await expect(() =>
      callerYoloDodo.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: 100,
        indicateurFields: {
          thematiques: [{ id: 4 }, { id: 5 }],
        },
      })
    ).rejects.toThrowError(/Droits insuffisants/);
  });
});
