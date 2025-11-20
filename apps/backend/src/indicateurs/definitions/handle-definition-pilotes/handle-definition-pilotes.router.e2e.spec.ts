import { getAuthUser, getTestApp, YOLO_DODO } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { describe, expect } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';

const collectiviteId = 2;

describe('IndicateurDefinitionPiloteRouter', () => {
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

  test('list existing pilotes associated with an indicateur', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Test indicateur',
      },
    });

    // First add a pilote
    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        pilotes: [{ tagId: 3 }], // assume that the pilote tag 3 exists
      },
    });

    const {
      data: [indicateur],
    } = await caller.indicateurs.definitions.list({
      collectiviteId,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateur.pilotes).toHaveLength(1);
    expect(indicateur.pilotes).toContainEqual(
      expect.objectContaining({ tagId: 3 })
    );
  });

  test('list, update, delete pilotes associated with an indicateur and a collectivite', async () => {
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

    expect(indicateurBefore.pilotes).toHaveLength(0);

    // Check with new array of pilotes

    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        pilotes: [{ tagId: 1 }, { tagId: 3 }],
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

    expect(indicateurAfter.pilotes).toHaveLength(2);
    expect(indicateurAfter.pilotes).toContainEqual(
      expect.objectContaining({ tagId: 1 })
    );
    expect(indicateurAfter.pilotes).toContainEqual(
      expect.objectContaining({ tagId: 3 })
    );

    // Keep only one pilote

    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        pilotes: [{ tagId: 3 }],
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

    expect(indicateurFinal.pilotes).toHaveLength(1);
    expect(indicateurFinal.pilotes).toContainEqual(
      expect.objectContaining({ tagId: 3 })
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
        pilotes: [{ tagId: 1 }, { tagId: 3 }],
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

  test('cannot upsert pilotes of another collectivite', async () => {
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
          pilotes: [{ tagId: 1 }, { tagId: 3 }],
        },
      })
    ).rejects.toThrowError(/Droits insuffisants/);
  });
});
