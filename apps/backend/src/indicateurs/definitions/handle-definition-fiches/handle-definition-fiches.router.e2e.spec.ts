import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { getAuthUser, getTestApp, YOLO_DODO } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
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
    let fiches = await caller.plans.fiches.listFiches({
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

    fiches = await caller.plans.fiches.listFiches({
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

    fiches = await caller.plans.fiches.listFiches({
      collectiviteId,
      filters: { indicateurIds: [indicateurId] },
    });

    expect(fiches.count).toEqual(1);
    expect(fiches.data[0].id).toEqual(ficheId2);
  });

  test('should not delete fiches from other collectivites when updating', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Get a referentiel indicateur that both collectivites can access
    const { data: indicateurs } = await caller.indicateurs.definitions.list({
      collectiviteId: 1,
      filters: {
        identifiantsReferentiel: ['cae_1.a'],
      },
    });

    const indicateurReferentiel = indicateurs[0];
    expect(indicateurReferentiel).toBeDefined();

    // Create fiches for collectivite 1
    const ficheC1_A = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: 1,
        titre: 'Collectivité 1 - Fiche A',
      },
    });

    const ficheC1_B = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: 1,
        titre: 'Collectivité 1 - Fiche B',
      },
    });

    // Create fiches for collectivite 2
    const ficheC2_A = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: 2,
        titre: 'Collectivité 2 - Fiche A',
      },
    });

    const ficheC2_B = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: 2,
        titre: 'Collectivité 2 - Fiche B',
      },
    });

    // Associate fiches from collectivite 1
    await caller.indicateurs.definitions.update({
      indicateurId: indicateurReferentiel.id,
      collectiviteId: 1,
      indicateurFields: {
        ficheIds: [ficheC1_A, ficheC1_B],
      },
    });

    // Associate fiches from collectivite 2
    await caller.indicateurs.definitions.update({
      indicateurId: indicateurReferentiel.id,
      collectiviteId: 2,
      indicateurFields: {
        ficheIds: [ficheC2_A, ficheC2_B],
      },
    });

    // Verify collectivite 1 has both fiches
    let fichesC1 = await caller.plans.fiches.listFiches({
      collectiviteId: 1,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC1.count).toEqual(2);
    expect(fichesC1.data.map((f) => f.id).sort()).toEqual(
      [ficheC1_A, ficheC1_B].sort()
    );

    // Verify collectivite 2 has both fiches
    let fichesC2 = await caller.plans.fiches.listFiches({
      collectiviteId: 2,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC2.count).toEqual(2);
    expect(fichesC2.data.map((f) => f.id).sort()).toEqual(
      [ficheC2_A, ficheC2_B].sort()
    );

    // Update collectivite 1: keep only ficheC1_A
    await caller.indicateurs.definitions.update({
      indicateurId: indicateurReferentiel.id,
      collectiviteId: 1,
      indicateurFields: {
        ficheIds: [ficheC1_A],
      },
    });

    // Verify collectivite 1 now has only ficheC1_A
    fichesC1 = await caller.plans.fiches.listFiches({
      collectiviteId: 1,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC1.count).toEqual(1);
    expect(fichesC1.data[0].id).toEqual(ficheC1_A);

    // IMPORTANT: Verify collectivite 2 STILL has both fiches (not affected)
    fichesC2 = await caller.plans.fiches.listFiches({
      collectiviteId: 2,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC2.count).toEqual(2);
    expect(fichesC2.data.map((f) => f.id).sort()).toEqual(
      [ficheC2_A, ficheC2_B].sort()
    );

    // Update collectivite 2: keep only ficheC2_B
    await caller.indicateurs.definitions.update({
      indicateurId: indicateurReferentiel.id,
      collectiviteId: 2,
      indicateurFields: {
        ficheIds: [ficheC2_B],
      },
    });

    // Verify collectivite 2 now has only ficheC2_B
    fichesC2 = await caller.plans.fiches.listFiches({
      collectiviteId: 2,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC2.count).toEqual(1);
    expect(fichesC2.data[0].id).toEqual(ficheC2_B);

    // IMPORTANT: Verify collectivite 1 STILL has ficheC1_A (not affected)
    fichesC1 = await caller.plans.fiches.listFiches({
      collectiviteId: 1,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC1.count).toEqual(1);
    expect(fichesC1.data[0].id).toEqual(ficheC1_A);
  });
});
