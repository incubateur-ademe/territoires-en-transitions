import {
  getAnonUser,
  getServiceRoleUser,
  importCollectiviteRelationsUnderLock,
} from '@tet/backend/test';
import { AuthRole, AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase, getTestRouter } from '../../../test/app-utils';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe("Route d'import des relations entre collectivités", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let database: DatabaseService;
  let anonUser: AuthUser<AuthRole.ANON>;
  let serviceRoleUser: AuthUser<AuthRole.SERVICE_ROLE>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    database = await getTestDatabase(app);
    anonUser = getAnonUser();
    serviceRoleUser = getServiceRoleUser();
  });

  test('Non autorisé si pas service role', async () => {
    const noUserCaller = router.createCaller({ user: null });

    await expect(async () => {
      await noUserCaller.collectivites.relations.importEpciCommunesRelations();
    }).rejects.toThrowError(/not service role/i);
    await expect(async () => {
      await noUserCaller.collectivites.relations.importSyndicatEpciRelations();
    }).rejects.toThrowError(/not service role/i);

    const anonCaller = router.createCaller({ user: anonUser });
    await expect(async () => {
      await anonCaller.collectivites.relations.importEpciCommunesRelations();
    }).rejects.toThrowError(/not service role/i);
    await expect(async () => {
      await anonCaller.collectivites.relations.importSyndicatEpciRelations();
    }).rejects.toThrowError(/not service role/i);
  });

  test('Relations correctement créées', async () => {
    const serviceRoleCaller = router.createCaller({ user: serviceRoleUser });
    const { epci, syndicat } = await importCollectiviteRelationsUnderLock(
      database,
      serviceRoleCaller.collectivites.relations
    );

    expect(epci.processed).toBeGreaterThan(0);
    expect(epci.created).toBeGreaterThan(0);
    expect(syndicat.processed).toBeGreaterThan(0);
    expect(syndicat.created).toBeGreaterThan(0);
  });
});
