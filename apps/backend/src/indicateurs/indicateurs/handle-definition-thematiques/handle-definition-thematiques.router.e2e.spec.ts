import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createThematique } from '@tet/backend/shared/shared.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { describe, expect, onTestFinished } from 'vitest';
import { createIndicateurPerso } from '../../definitions/definitions.test-fixture';

describe('IndicateurDefinitionThematiqueRouter', () => {
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let collectivite: Collectivite;
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
  });

  afterAll(async () => {
    await app.close();
  });

  test('list existing thematiques associated with an indicateur', async () => {
    const caller = router.createCaller({ user: testUser });

    const thematique = await createThematique({
      database: db,
      thematiqueData: { nom: 'Thematique test' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
        thematiques: [{ id: thematique.id }],
      },
    });

    const {
      data: [indicateur],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateur.thematiques).toHaveLength(1);
    expect(indicateur.thematiques).toContainEqual(
      expect.objectContaining({ id: thematique.id })
    );
  });

  test('list, update, delete thematiques associated with an indicateur and a collectivite', async () => {
    const caller = router.createCaller({ user: testUser });

    const thematique1 = await createThematique({
      database: db,
      thematiqueData: { nom: 'Thematique 1' },
    });
    const thematique2 = await createThematique({
      database: db,
      thematiqueData: { nom: 'Thematique 2' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
      },
    });

    const {
      data: [indicateurBefore],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurBefore.thematiques).toHaveLength(0);

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        thematiques: [{ id: thematique1.id }, { id: thematique2.id }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.thematiques).toHaveLength(2);
    expect(indicateurAfter.thematiques).toContainEqual(
      expect.objectContaining({ id: thematique1.id })
    );
    expect(indicateurAfter.thematiques).toContainEqual(
      expect.objectContaining({ id: thematique2.id })
    );

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        thematiques: [{ id: thematique2.id }],
      },
    });

    const {
      data: [indicateurEmpty],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurEmpty.thematiques).toHaveLength(1);
    expect(indicateurEmpty.thematiques).toContainEqual(
      expect.objectContaining({ id: thematique2.id })
    );
  });

  test('verify modified fields are updated', async () => {
    const caller = router.createCaller({ user: testUser });

    const thematique1 = await createThematique({
      database: db,
      thematiqueData: { nom: 'Thematique 1' },
    });
    const thematique2 = await createThematique({
      database: db,
      thematiqueData: { nom: 'Thematique 2' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
      },
    });

    const {
      data: [indicateurBefore],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        thematiques: [{ id: thematique1.id }, { id: thematique2.id }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.modifiedBy?.id).toEqual(testUser.id);
    expect(new Date(indicateurAfter.modifiedAt).getTime()).toBeGreaterThan(
      new Date(indicateurBefore.modifiedAt).getTime()
    );
  });

  test('cannot upsert thematiques of another collectivite', async () => {
    const caller = router.createCaller({ user: testUser });

    const { collectivite: otherCollectivite, cleanup } =
      await addTestCollectivite(db);
    onTestFinished(cleanup);

    const thematique1 = await createThematique({
      database: db,
      thematiqueData: { nom: 'Thematique 1' },
    });
    const thematique2 = await createThematique({
      database: db,
      thematiqueData: { nom: 'Thematique 2' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
      },
    });

    await expect(() =>
      caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: otherCollectivite.id,
        indicateurFields: {
          thematiques: [{ id: thematique1.id }, { id: thematique2.id }],
        },
      })
    ).rejects.toThrow(/Droits insuffisants/);
  });
});
