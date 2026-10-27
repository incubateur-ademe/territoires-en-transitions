import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { addTestTrajectoireLeviers } from './trajectoire-leviers.test-fixture';

describe('Route de récupération des données Trajectoire Leviers', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let anonUser: AuthUser<AuthRole.ANON>;
  let authenticatedUser: AuthenticatedUser;
  let fixture: Awaited<ReturnType<typeof addTestTrajectoireLeviers>>;
  let commune: Awaited<ReturnType<typeof addTestCollectivite>>;
  let epciSansTrajectoire: Awaited<ReturnType<typeof addTestCollectivite>>;
  let cleanupUser: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    const db = await getTestDatabase(app);

    anonUser = getAnonUser();

    const testUserResult = await addTestUser(db);
    cleanupUser = testUserResult.cleanup;
    authenticatedUser = getAuthUserFromUserCredentials(testUserResult.user);
    fixture = await addTestTrajectoireLeviers(db);
    commune = await addTestCollectivite(db, { type: 'commune' });
    epciSansTrajectoire = await addTestCollectivite(db, { type: 'epci' });
  });

  afterAll(async () => {
    await fixture?.cleanup();
    await commune?.cleanup();
    await epciSansTrajectoire?.cleanup();
    await cleanupUser?.();
    await app.close();
  });

  test('Non autorisé si non authentifié ou anonyme', async () => {
    const caller = router.createCaller({ user: null });

    await expect(async () => {
      await caller.indicateurs.trajectoires.leviers.getData({
        collectiviteId: fixture.collectivite.id,
      });
    }).rejects.toThrowError(/not authenticated/i);

    const anonymousCaller = router.createCaller({ user: anonUser });

    await expect(async () => {
      await anonymousCaller.indicateurs.trajectoires.leviers.getData({
        collectiviteId: fixture.collectivite.id,
      });
    }).rejects.toThrowError(/not authenticated/i);
  });

  test('Commune collectivite not supported', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(async () => {
      await caller.indicateurs.trajectoires.leviers.getData({
        collectiviteId: commune.collectivite.id,
      });
    }).rejects.toThrowError(/ doit être un epci/i);
  });

  test("Un EPCI dont la trajectoire SNBC n'a pas été calculée renvoie NOT_FOUND", async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.trajectoires.leviers.getData({
        collectiviteId: epciSansTrajectoire.collectivite.id,
      })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: "La trajectoire SNBC de la collectivité n'a pas été calculée",
    });
  });

  test('Un visiteur lit les données et les réductions des leviers par SIREN', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const result = await caller.indicateurs.trajectoires.leviers.getData({
      siren: fixture.collectivite.siren,
    });

    expect(result.sourcesResultats).toEqual(['rare']);
    expect(result.secteurs).toContainEqual(
      expect.objectContaining({
        nom: 'Résidentiel',
        resultat2019: 100,
        objectif2019: 100,
        objectif2030: 60,
        leviers: expect.arrayContaining([
          expect.objectContaining({
            nom: 'Changement chaudières fioul + rénovation (résidentiel)',
            objectifReduction: -17.2,
          }),
        ]),
      })
    );
  }, 30000);
});
