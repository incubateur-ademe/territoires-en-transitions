import { createFiche } from '@/backend/plans/fiches/fiches.test-fixture';
import { getAuthUser, getTestApp, YOLO_DODO } from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { describe, expect } from 'vitest';
import { createIndicateurPerso } from '../definitions.test-fixture';

const collectiviteId = 2;

describe('IndicateurDefinitionFichesRouter', () => {
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

  test('should update indicateur linked fiches', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'Indicator with fiches',
      },
    });

    const ficheId1 = await createFiche({
      caller,
      ficheInput: {
        collectiviteId,
        titre: 'Fiche A',
      },
    });

    const ficheId2 = await createFiche({
      caller,
      ficheInput: {
        collectiviteId,
        titre: 'Fiche B',
      },
    });

    // Initially no fiches linked
    let fiches = await caller.plans.fiches.listResumes({
      collectiviteId,
      filters: { indicateurIds: [indicateurId] },
    });

    expect(fiches.count).toEqual(0);
    expect(fiches.data).toHaveLength(0);

    // Link two fiches
    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        ficheIds: [ficheId1, ficheId2],
      },
    });

    fiches = await caller.plans.fiches.listResumes({
      collectiviteId,
      filters: { indicateurIds: [indicateurId] },
    });

    expect(fiches.count).toEqual(2);
    expect(fiches.data.map((f) => f.id).sort()).toEqual(
      [ficheId1, ficheId2].sort()
    );

    // Keep only one fiche
    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        ficheIds: [ficheId2],
      },
    });

    fiches = await caller.plans.fiches.listResumes({
      collectiviteId,
      filters: { indicateurIds: [indicateurId] },
    });

    expect(fiches.count).toEqual(1);
    expect(fiches.data[0].id).toEqual(ficheId2);
  });
});
