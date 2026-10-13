import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { sql } from 'drizzle-orm';
import {
  addTestRecetteCollectivite,
  createTestRecetteTables,
} from '../reprise-tec.test-fixture';
import { ListCollectivitesErrorEnum } from './list-collectivites.errors';
import { ListCollectivitesService } from './list-collectivites.service';

describe('demarches.pcaet.repriseTec.listCollectivites', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    await createTestRecetteTables(databaseService);

    return async () => {
      await app.close();
    };
  });

  const addSuperAdmin = async () => {
    const { user } = await addTestUser(databaseService);
    const authUser = getAuthUserFromUserCredentials(user);
    const caller = router.createCaller({ user: authUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authUser.id,
    });
    onTestFinished(cleanup);
    return { authUser, caller };
  };

  test('un super admin lit la collectivité T&C et sa collectivité TeT', async () => {
    const { collectivite } = await addTestCollectivite(databaseService);
    const tecCollectiviteId = 900_000_000 + collectivite.id;
    const { cleanup } = await addTestRecetteCollectivite(databaseService, {
      tecCollectiviteId,
      tetCollectiviteId: collectivite.id,
      nom: 'Collectivité de T&C',
      siren: '123456789',
      population: 1000,
    });
    onTestFinished(cleanup);
    const { caller } = await addSuperAdmin();

    const collectivites =
      await caller.demarches.pcaet.repriseTec.listCollectivites();

    expect(
      collectivites.find((c) => c.tecCollectiviteId === tecCollectiviteId)
    ).toMatchObject({
      collectiviteId: collectivite.id,
      nom: 'Collectivité de T&C',
      siren: '123456789',
      population: 1000,
      nomTet: collectivite.nom,
    });
  });

  test('un compte sans la permission reçoit un refus', async () => {
    const { user } = await addTestUser(databaseService);
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    await expect(
      caller.demarches.pcaet.repriseTec.listCollectivites()
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('sans la table de recette, la route le dit', async () => {
    const { authUser } = await addSuperAdmin();
    const service = app.get(ListCollectivitesService);

    let result: Awaited<ReturnType<typeof service.listCollectivites>> | null =
      null;
    await databaseService.db
      .transaction(async (tx) => {
        await tx.execute(sql`drop table reprise_tec.recette_collectivite`);
        result = await service.listCollectivites({ user: authUser, tx });
        tx.rollback();
      })
      .catch(() => undefined);

    expect(result).toMatchObject({
      success: false,
      error: ListCollectivitesErrorEnum.RECETTE_NON_CONSTRUITE,
    });
  });
});
