import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { setUserCollectiviteRole } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { describe, expect } from 'vitest';
import { createIndicateurPerso } from '../../definitions/definitions.test-fixture';

describe('IndicateurDefinitionFichesRouter', () => {
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let otherCollectivite: Collectivite;
  let db: DatabaseService;
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = app.get(TrpcRouter);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testCollectiviteAndUserResult.collectivite;
    testUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );

    const otherCollectiviteResult = await addTestCollectivite(db);
    otherCollectivite = otherCollectiviteResult.collectivite;

    await setUserCollectiviteRole(db, {
      userId: testUser.id,
      collectiviteId: otherCollectivite.id,
      role: CollectiviteRole.ADMIN,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('should update indicateur linked fiches', async () => {
    const caller = router.createCaller({ user: testUser });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Indicator with fiches',
      },
    });

    const ficheId1 = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: collectivite.id,
        titre: 'Fiche A',
      },
    });

    const ficheId2 = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: collectivite.id,
        titre: 'Fiche B',
      },
    });

    let fiches = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { indicateurIds: [indicateurId] },
    });

    expect(fiches.count).toEqual(0);
    expect(fiches.data).toHaveLength(0);

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        ficheIds: [ficheId1, ficheId2],
      },
    });

    fiches = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { indicateurIds: [indicateurId] },
    });

    expect(fiches.count).toEqual(2);
    expect(fiches.data.map((f) => f.id).sort()).toEqual(
      [ficheId1, ficheId2].sort()
    );

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        ficheIds: [ficheId2],
      },
    });

    fiches = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { indicateurIds: [indicateurId] },
    });

    expect(fiches.count).toEqual(1);
    expect(fiches.data[0].id).toEqual(ficheId2);
  });

  test('should not delete fiches from other collectivites when updating', async () => {
    const caller = router.createCaller({ user: testUser });

    const { data: indicateurs } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        identifiantsReferentiel: ['cae_1.a'],
      },
    });

    const indicateurReferentiel = indicateurs[0];
    expect(indicateurReferentiel).toBeDefined();

    const ficheC1_A = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: collectivite.id,
        titre: 'Collectivité 1 - Fiche A',
      },
    });

    const ficheC1_B = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: collectivite.id,
        titre: 'Collectivité 1 - Fiche B',
      },
    });

    const ficheC2_A = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: otherCollectivite.id,
        titre: 'Collectivité 2 - Fiche A',
      },
    });

    const ficheC2_B = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: otherCollectivite.id,
        titre: 'Collectivité 2 - Fiche B',
      },
    });

    await caller.indicateurs.indicateurs.update({
      indicateurId: indicateurReferentiel.id,
      collectiviteId: collectivite.id,
      indicateurFields: {
        ficheIds: [ficheC1_A, ficheC1_B],
      },
    });

    await caller.indicateurs.indicateurs.update({
      indicateurId: indicateurReferentiel.id,
      collectiviteId: otherCollectivite.id,
      indicateurFields: {
        ficheIds: [ficheC2_A, ficheC2_B],
      },
    });

    let fichesC1 = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC1.count).toEqual(2);
    expect(fichesC1.data.map((f) => f.id).sort()).toEqual(
      [ficheC1_A, ficheC1_B].sort()
    );

    let fichesC2 = await caller.plans.fiches.listFiches({
      collectiviteId: otherCollectivite.id,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC2.count).toEqual(2);
    expect(fichesC2.data.map((f) => f.id).sort()).toEqual(
      [ficheC2_A, ficheC2_B].sort()
    );

    await caller.indicateurs.indicateurs.update({
      indicateurId: indicateurReferentiel.id,
      collectiviteId: collectivite.id,
      indicateurFields: {
        ficheIds: [ficheC1_A],
      },
    });

    fichesC1 = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC1.count).toEqual(1);
    expect(fichesC1.data[0].id).toEqual(ficheC1_A);

    fichesC2 = await caller.plans.fiches.listFiches({
      collectiviteId: otherCollectivite.id,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC2.count).toEqual(2);
    expect(fichesC2.data.map((f) => f.id).sort()).toEqual(
      [ficheC2_A, ficheC2_B].sort()
    );

    await caller.indicateurs.indicateurs.update({
      indicateurId: indicateurReferentiel.id,
      collectiviteId: otherCollectivite.id,
      indicateurFields: {
        ficheIds: [ficheC2_B],
      },
    });

    fichesC2 = await caller.plans.fiches.listFiches({
      collectiviteId: otherCollectivite.id,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC2.count).toEqual(1);
    expect(fichesC2.data[0].id).toEqual(ficheC2_B);

    fichesC1 = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { indicateurIds: [indicateurReferentiel.id] },
    });

    expect(fichesC1.count).toEqual(1);
    expect(fichesC1.data[0].id).toEqual(ficheC1_A);
  });
});
