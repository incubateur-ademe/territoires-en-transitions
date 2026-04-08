import { INestApplication } from '@nestjs/common';
import {
  getAnonUser,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import {
  AuthenticatedUser,
  AuthRole,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

describe('Route de récupération des données Trajectoire Leviers', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let anonUser: AuthUser<AuthRole.ANON>;
  let authenticatedUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    const db = await getTestDatabase(app);

    anonUser = getAnonUser();

    const testUserResult = await addTestUser(db);
    authenticatedUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Non autorisé si non authentifié ou anonyme', async () => {
    const caller = router.createCaller({ user: null });

    await expect(async () => {
      await caller.indicateurs.trajectoires.leviers.getData({
        collectiviteId: 1,
      });
    }).rejects.toThrowError(/not authenticated/i);

    const anonymousCaller = router.createCaller({ user: anonUser });

    await expect(async () => {
      await anonymousCaller.indicateurs.trajectoires.leviers.getData({
        collectiviteId: 1,
      });
    }).rejects.toThrowError(/not authenticated/i);
  });

  test('Commune collectivite not supported', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(async () => {
      await caller.indicateurs.trajectoires.leviers.getData({
        collectiviteId: 1,
      });
    }).rejects.toThrowError(/ doit être un epci/i);
  });

  test('Visite for collectivite with siren 246700488', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const siren = '246700488';
    // On récupère / recalule la trajectoire car nécessaire
    await caller.indicateurs.trajectoires.snbc.getOrCompute({
      siren: siren,
    });

    const result = await caller.indicateurs.trajectoires.leviers.getData({
      siren: siren,
    });

    expect(result).toBeDefined();
  }, 30000);
});
