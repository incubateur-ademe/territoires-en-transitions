import { INestApplication } from '@nestjs/common';
import { createServiceTag } from '@tet/backend/collectivites/collectivites.test-fixture';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { describe, expect, onTestFinished } from 'vitest';
import { createIndicateurPerso } from '../../definitions/definitions.test-fixture';

describe('IndicateurDefinitionServiceRouter', () => {
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

  test('list, update, delete services associated with an indicateur and a collectivite', async () => {
    const caller = router.createCaller({ user: testUser });

    const service1 = await createServiceTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Service 1' },
    });
    const service2 = await createServiceTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Service 2' },
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

    expect(indicateurBefore.services).toHaveLength(0);

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        services: [{ id: service1.id }, { id: service2.id }],
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

    expect(indicateurAfter.services).toHaveLength(2);
    expect(indicateurAfter.services).toContainEqual(
      expect.objectContaining({ id: service1.id })
    );
    expect(indicateurAfter.services).toContainEqual(
      expect.objectContaining({ id: service2.id })
    );

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        services: [{ id: service2.id }],
      },
    });

    const {
      data: [indicateurFinal],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurFinal.services).toHaveLength(1);
    expect(indicateurFinal.services).toContainEqual(
      expect.objectContaining({ id: service2.id })
    );
  });

  test('verify modified fields are updated', async () => {
    const caller = router.createCaller({ user: testUser });

    const service1 = await createServiceTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Service 1' },
    });
    const service2 = await createServiceTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Service 2' },
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
        services: [{ id: service1.id }, { id: service2.id }],
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

  test('User with lecture rights on collectivite cannot update/delete services', async () => {
    const caller = router.createCaller({ user: testUser });

    const service = await createServiceTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Service lecture' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
      },
    });

    const { user, cleanup } = await addTestUser(db, {
      collectiviteId: collectivite.id,
      role: CollectiviteRole.LECTURE,
    });
    onTestFinished(cleanup);

    const lectureUser = getAuthUserFromUserCredentials(user);
    const lectureCaller = router.createCaller({ user: lectureUser });

    await expect(() =>
      lectureCaller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          services: [{ id: service.id }],
        },
      })
    ).rejects.toThrow(/Droits insuffisants/);

    await expect(() =>
      lectureCaller.indicateurs.indicateurs.delete({
        indicateurId,
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow(/Droits insuffisants/);
  });

  test('User with limited edition rights on collectivite cannot update/delete services', async () => {
    const adminCaller = router.createCaller({ user: testUser });

    const service = await createServiceTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Service edition' },
    });

    const indicateurId = await createIndicateurPerso({
      caller: adminCaller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
      },
    });

    const { user, cleanup } = await addTestUser(db, {
      collectiviteId: collectivite.id,
      role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
    });
    onTestFinished(cleanup);

    const limitedEditionUser = getAuthUserFromUserCredentials(user);
    const limitedEditionCaller = router.createCaller({
      user: limitedEditionUser,
    });

    await expect(() =>
      limitedEditionCaller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: {
          services: [{ id: service.id }],
        },
      })
    ).rejects.toThrow(/Droits insuffisants/);

    await expect(() =>
      limitedEditionCaller.indicateurs.indicateurs.delete({
        indicateurId,
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow(/Droits insuffisants/);

    await adminCaller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        pilotes: [{ userId: limitedEditionUser.id }],
      },
    });

    await limitedEditionCaller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        services: [{ id: service.id }],
      },
    });

    await expect(() =>
      limitedEditionCaller.indicateurs.indicateurs.delete({
        indicateurId,
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow(/Droits insuffisants/);

    await adminCaller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        pilotes: [],
      },
    });
  });

  test('cannot upsert services of another collectivite', async () => {
    const caller = router.createCaller({ user: testUser });

    const { collectivite: otherCollectivite, cleanup } =
      await addTestCollectivite(db);
    onTestFinished(cleanup);

    const service1 = await createServiceTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Service 1' },
    });
    const service2 = await createServiceTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Service 2' },
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
          services: [{ id: service1.id }, { id: service2.id }],
        },
      })
    ).rejects.toThrow(/Droits insuffisants/);
  });
});
