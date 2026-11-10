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
import {
  addTestTrajectoireSnbc3Valeurs,
  mockTrajectoireSnbc3Flag,
} from '../trajectoires/snbc3/trajectoire-snbc3.test-fixture';
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
  let restoreFlag: () => void;

  beforeAll(async () => {
    app = await getTestApp();
    // Chemin SNBC 2 : sans le flag SNBC 3.
    restoreFlag = mockTrajectoireSnbc3Flag(app, false);
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
    restoreFlag?.();
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

describe('Trajectoire Leviers avec le flag SNBC 3', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  const cleanups: (() => Promise<unknown>)[] = [];
  let restoreFlag: () => void;

  /** EPCI qui a une trajectoire SNBC 2 (avec RARE en 2019) et une SNBC 3. */
  let epci: Awaited<
    ReturnType<typeof addTestTrajectoireLeviers>
  >['collectivite'];
  let paris: Awaited<ReturnType<typeof addTestCollectivite>>['collectivite'];
  let epciDrom: Awaited<ReturnType<typeof addTestCollectivite>>['collectivite'];
  let epciAbsent: Awaited<
    ReturnType<typeof addTestCollectivite>
  >['collectivite'];
  let commune: Awaited<ReturnType<typeof addTestCollectivite>>['collectivite'];
  let petr: Awaited<ReturnType<typeof addTestCollectivite>>['collectivite'];

  /** Résidentiel : 120 en 2021, 70 en 2030. */
  const valeursResidentiel = [
    { identifiant: 'cae_1.c', annee: 2021, objectif: 120 },
    { identifiant: 'cae_1.c', annee: 2030, objectif: 70 },
  ];

  beforeAll(async () => {
    app = await getTestApp();
    restoreFlag = mockTrajectoireSnbc3Flag(app, true);
    router = app.get(TrpcRouter);
    const db = await getTestDatabase(app);

    const testUser = await addTestUser(db);
    cleanups.push(testUser.cleanup);
    authenticatedUser = getAuthUserFromUserCredentials(testUser.user);

    const leviers = await addTestTrajectoireLeviers(db);
    cleanups.push(leviers.cleanup);
    epci = leviers.collectivite;

    const addCollectivite = async (
      args: Parameters<typeof addTestCollectivite>[1]
    ) => {
      const fixture = await addTestCollectivite(db, args);
      cleanups.push(fixture.cleanup);
      return fixture.collectivite;
    };
    paris = await addCollectivite({ type: 'commune', regionCode: '11' });
    epciDrom = await addCollectivite({
      type: 'epci',
      natureInsee: 'CA',
      regionCode: '01',
    });
    epciAbsent = await addCollectivite({
      type: 'epci',
      natureInsee: 'CC',
      regionCode: '44',
    });
    commune = await addCollectivite({ type: 'commune', regionCode: '44' });
    petr = await addCollectivite({
      type: 'epci',
      natureInsee: 'PETR',
      regionCode: '44',
    });

    for (const collectivite of [epci, paris, epciDrom]) {
      const valeurs = await addTestTrajectoireSnbc3Valeurs(
        db,
        collectivite.id,
        valeursResidentiel
      );
      // Avant le nettoyage des collectivités.
      cleanups.unshift(valeurs.cleanup);
    }
  });

  afterAll(async () => {
    restoreFlag?.();
    for (const cleanup of cleanups) {
      await cleanup();
    }
    await app.close();
  });

  test('la base est la valeur snbc3 de 2021, sans émissions observées', async () => {
    const result = await router
      .createCaller({ user: authenticatedUser })
      .indicateurs.trajectoires.leviers.getData({ collectiviteId: epci.id });

    expect(result.sourcesResultats).toEqual([]);
    const residentiel = result.secteurs.find((s) => s.nom === 'Résidentiel');
    expect(residentiel).toMatchObject({
      resultat2019: null,
      objectif2019: 120,
      objectif2030: 70,
    });
    expect(residentiel?.leviers).toContainEqual(
      expect.objectContaining({
        nom: 'Changement chaudières fioul + rénovation (résidentiel)',
        // (70 - 120) × 43 %, contre (60 - 100) × 43 % avec la SNBC 2.
        objectifReduction: -21.5,
      })
    );
    // Seuls les secteurs sans valeur snbc3 sont manquants.
    expect(result.identifiantManquants).not.toContain('cae_1.c');
    expect(result.identifiantManquants).toContain('cae_1.d');
  });

  test('Paris, commune présente dans le millésime, a ses leviers', async () => {
    const result = await router
      .createCaller({ user: authenticatedUser })
      .indicateurs.trajectoires.leviers.getData({ collectiviteId: paris.id });

    expect(result.secteurs).toContainEqual(
      expect.objectContaining({
        nom: 'Résidentiel',
        objectif2019: 120,
        objectif2030: 70,
      })
    );
  });

  test("un EPCI des DROM n'a pas de leviers", async () => {
    await expect(
      router
        .createCaller({ user: authenticatedUser })
        .indicateurs.trajectoires.leviers.getData({
          collectiviteId: epciDrom.id,
        })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('un EPCI absent du millésime renvoie TRAJECTOIRE_NON_DISPONIBLE', async () => {
    await expect(
      router
        .createCaller({ user: authenticatedUser })
        .indicateurs.trajectoires.leviers.getData({
          collectiviteId: epciAbsent.id,
        })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message:
        "La trajectoire SNBC 3 n'est pas disponible pour cette collectivité",
    });
  });

  test("une commune absente du millésime n'est pas un EPCI", async () => {
    await expect(
      router
        .createCaller({ user: authenticatedUser })
        .indicateurs.trajectoires.leviers.getData({
          collectiviteId: commune.id,
        })
    ).rejects.toThrowError(/ doit être un epci/i);
  });

  test("un PETR absent du millésime n'est pas un EPCI", async () => {
    await expect(
      router
        .createCaller({ user: authenticatedUser })
        .indicateurs.trajectoires.leviers.getData({
          collectiviteId: petr.id,
        })
    ).rejects.toThrowError(/ doit être un epci/i);
  });

  test('un utilisateur sans droit de lecture des valeurs est refusé', async () => {
    const userNonVerifie = await addTestUser(await getTestDatabase(app), {
      verified: false,
    });
    cleanups.push(userNonVerifie.cleanup);

    await expect(
      router
        .createCaller({
          user: getAuthUserFromUserCredentials(userNonVerifie.user),
        })
        .indicateurs.trajectoires.leviers.getData({ collectiviteId: epci.id })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
