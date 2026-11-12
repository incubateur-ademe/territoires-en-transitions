import { INestApplication } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { inferProcedureInput, TRPCError } from '@trpc/server';
import { eq, ilike, inArray } from 'drizzle-orm';

type UpsertInput = inferProcedureInput<
  AppRouter['collectivites']['collectivites']['upsert']
>;

const sirenEPCI = '255600793';

describe('Test upsert collectivite', () => {
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testUserResult = await addTestUser(databaseService);
    authenticatedUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Test utilisateur support mais sans le mode super-admin actif', async () => {
    const { cleanup } = await addUserRoleSupport({
      databaseService,
      userId: authenticatedUser.id,
    });
    onTestFinished(cleanup);

    const caller = router.createCaller({ user: authenticatedUser });
    const input: UpsertInput = {
      type: collectiviteTypeEnum.EPCI,
      siren: sirenEPCI,
    };
    await expect(() =>
      caller.collectivites.collectivites.upsert(input)
    ).rejects.toThrowError();

    await expect(() =>
      caller.collectivites.collectivites.getAdditionalInformation(input)
    ).rejects.toThrowError();
  });

  test('Test upsert', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authenticatedUser.id,
    });

    onTestFinished(cleanup);

    const input: UpsertInput = {
      type: collectiviteTypeEnum.EPCI,
      siren: sirenEPCI,
      nom: 'Test',
    };
    // Test insert
    const insert = await caller.collectivites.collectivites.upsert(input);
    expect(insert.id).not.toBeNull();
    expect(insert.nom).toEqual('Test');
    // Test update
    insert.nom = 'Test2';
    const update = await caller.collectivites.collectivites.upsert(insert);
    expect(update.id).toEqual(insert.id);
    expect(update.nom).toEqual('Test2');
    // Test insert an existing collectivité
    const colError: UpsertInput = { ...update, id: undefined };
    await expect(() =>
      caller.collectivites.collectivites.upsert(colError)
    ).rejects.toThrowError('COLLECTIVITE_EXISTE_DEJA');

    onTestFinished(async () => {
      try {
        const [col] = await databaseService.db
          .select({ id: collectiviteTable.id })
          .from(collectiviteTable)
          .where(eq(collectiviteTable.siren, sirenEPCI));
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(eq(collectiviteBucketTable.collectiviteId, col.id));
        await databaseService.db
          .delete(collectiviteTable)
          .where(eq(collectiviteTable.id, col.id));
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });

  test('Un SIREN qui ne fait pas 9 chiffres est refusé avec un code lisible', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authenticatedUser.id,
    });

    onTestFinished(cleanup);

    const error = await caller.collectivites.collectivites
      .upsert({
        type: collectiviteTypeEnum.EPCI,
        siren: '12345',
        nom: 'EPCI au SIREN invalide',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'SIREN_INVALIDE',
    });
    expect((error as TRPCError).message).not.toContain('Failed query');

    // Trop long : refusé avant d'atteindre la base (varchar(9)).
    await expect(() =>
      caller.collectivites.collectivites.upsert({
        type: collectiviteTypeEnum.EPCI,
        siren: '1234567890',
        nom: 'EPCI au SIREN invalide',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'SIREN_INVALIDE' });
  });

  test('Test upsert structure sans statut juridique sans SIREN', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authenticatedUser.id,
    });

    onTestFinished(cleanup);

    const input: UpsertInput = {
      type: collectiviteTypeEnum.STRUCTURE_SANS_STATUT_JURIDIQUE,
      nom: 'Structure sans statut juridique test',
    };

    const insert = await caller.collectivites.collectivites.upsert(input);
    expect(insert.id).not.toBeNull();
    expect(insert.nom).toEqual(input.nom);
    expect(insert.siren).toBeNull();

    await expect(() =>
      caller.collectivites.collectivites.upsert(input)
    ).rejects.toThrowError('COLLECTIVITE_EXISTE_DEJA');

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(eq(collectiviteBucketTable.collectiviteId, insert.id));
        await databaseService.db
          .delete(collectiviteTable)
          .where(eq(collectiviteTable.id, insert.id));
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });

  test('Test upsert structure sans statut juridique avec nom en casse différente', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authenticatedUser.id,
    });

    onTestFinished(cleanup);

    const input = {
      type: collectiviteTypeEnum.STRUCTURE_SANS_STATUT_JURIDIQUE,
      nom: 'Organisation XYZ duplicate case test',
    } satisfies UpsertInput;

    const insert = await caller.collectivites.collectivites.upsert(input);
    expect(insert.id).not.toBeNull();

    onTestFinished(async () => {
      try {
        const rows = await databaseService.db
          .select({ id: collectiviteTable.id })
          .from(collectiviteTable)
          .where(ilike(collectiviteTable.nom, input.nom));
        const ids = rows.map(({ id }) => id);

        if (ids.length > 0) {
          await databaseService.db
            .delete(collectiviteBucketTable)
            .where(inArray(collectiviteBucketTable.collectiviteId, ids));
          await databaseService.db
            .delete(collectiviteTable)
            .where(inArray(collectiviteTable.id, ids));
        }
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });

    await expect(() =>
      caller.collectivites.collectivites.upsert({
        ...input,
        nom: input.nom.toLowerCase(),
      })
    ).rejects.toThrowError('COLLECTIVITE_EXISTE_DEJA');
  });

  test('La base empêche deux structures sans statut juridique avec le même nom', async () => {
    const nom = 'Structure unique database duplicate test';

    const cleanupCollectivites = async () => {
      const rows = await databaseService.db
        .select({ id: collectiviteTable.id })
        .from(collectiviteTable)
        .where(ilike(collectiviteTable.nom, nom));
      const ids = rows.map(({ id }) => id);

      if (ids.length > 0) {
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(inArray(collectiviteBucketTable.collectiviteId, ids));
        await databaseService.db
          .delete(collectiviteTable)
          .where(inArray(collectiviteTable.id, ids));
      }
    };

    await cleanupCollectivites();
    onTestFinished(cleanupCollectivites);

    const values = {
      type: collectiviteTypeEnum.STRUCTURE_SANS_STATUT_JURIDIQUE,
      nom,
      preferences: defaultCollectivitePreferences,
    };

    await databaseService.db.insert(collectiviteTable).values(values);

    await expect(() =>
      databaseService.db.insert(collectiviteTable).values({
        ...values,
        nom: nom.toLowerCase(),
      })
    ).rejects.toThrowError();
  });

  test('Test upsert DREAL sans SIREN ni code département', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authenticatedUser.id,
    });

    onTestFinished(cleanup);

    // Espace disjoint : codes réels à deux chiffres, `pickFreeRegionCode` à deux
    // lettres, les specs à une lettre puis un chiffre — l'index unique « une DREAL
    // par région » ne tolère pas deux occupants.
    const regionCode = 'C2';

    const input: UpsertInput = {
      type: collectiviteTypeEnum.DREAL,
      nom: 'DREAL Pays de la Loire test',
      regionCode,
    };

    const cleanupCollectivites = async () => {
      const rows = await databaseService.db
        .select({ id: collectiviteTable.id })
        .from(collectiviteTable)
        .where(ilike(collectiviteTable.nom, input.nom as string));
      const ids = rows.map(({ id }) => id);

      if (ids.length > 0) {
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(inArray(collectiviteBucketTable.collectiviteId, ids));
        await databaseService.db
          .delete(collectiviteTable)
          .where(inArray(collectiviteTable.id, ids));
      }
    };

    await cleanupCollectivites();
    onTestFinished(cleanupCollectivites);

    const insert = await caller.collectivites.collectivites.upsert(input);
    expect(insert.id).not.toBeNull();
    expect(insert.nom).toEqual(input.nom);
    expect(insert.siren).toBeNull();
    expect(insert.departementCode).toBeNull();
    expect(insert.regionCode).toEqual(regionCode);
  });

  test('Test upsert de deux DREAL : régions différentes acceptées, même région refusée', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authenticatedUser.id,
    });

    onTestFinished(cleanup);

    const nomA = 'DREAL région A test';
    const nomB = 'DREAL région B test';
    const nomDoublon = 'DREAL doublon même région test';
    // L'unicité porte sur (type, region_code) : ces deux codes doivent rester
    // libres de toute DREAL, d'où l'espace « lettre + chiffre » propre aux specs.
    const regionA = 'C3';
    const regionB = 'C4';

    const cleanupCollectivites = async () => {
      const rows = await databaseService.db
        .select({ id: collectiviteTable.id })
        .from(collectiviteTable)
        .where(inArray(collectiviteTable.nom, [nomA, nomB, nomDoublon]));
      const ids = rows.map(({ id }) => id);

      if (ids.length > 0) {
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(inArray(collectiviteBucketTable.collectiviteId, ids));
        await databaseService.db
          .delete(collectiviteTable)
          .where(inArray(collectiviteTable.id, ids));
      }
    };

    await cleanupCollectivites();
    onTestFinished(cleanupCollectivites);

    const insertA = await caller.collectivites.collectivites.upsert({
      type: collectiviteTypeEnum.DREAL,
      nom: nomA,
      regionCode: regionA,
    });
    expect(insertA.id).not.toBeNull();

    const insertB = await caller.collectivites.collectivites.upsert({
      type: collectiviteTypeEnum.DREAL,
      nom: nomB,
      regionCode: regionB,
    });
    expect(insertB.id).not.toBeNull();
    expect(insertB.id).not.toEqual(insertA.id);

    await expect(() =>
      caller.collectivites.collectivites.upsert({
        type: collectiviteTypeEnum.DREAL,
        nom: nomDoublon,
        regionCode: regionA,
      })
    ).rejects.toThrowError('COLLECTIVITE_EXISTE_DEJA');
  });

  test('La base empêche deux DREAL sur la même région', async () => {
    const nom = 'DREAL unique database duplicate test';

    const cleanupCollectivites = async () => {
      const rows = await databaseService.db
        .select({ id: collectiviteTable.id })
        .from(collectiviteTable)
        .where(ilike(collectiviteTable.nom, `${nom}%`));
      const ids = rows.map(({ id }) => id);

      if (ids.length > 0) {
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(inArray(collectiviteBucketTable.collectiviteId, ids));
        await databaseService.db
          .delete(collectiviteTable)
          .where(inArray(collectiviteTable.id, ids));
      }
    };

    await cleanupCollectivites();
    onTestFinished(cleanupCollectivites);

    const values = {
      // Un code par spec, dans l'espace « lettre + chiffre » : les autres specs
      // tournent en parallèle sur la même base.
      type: collectiviteTypeEnum.DREAL,
      nom,
      regionCode: 'C5',
      preferences: defaultCollectivitePreferences,
    };

    await databaseService.db.insert(collectiviteTable).values(values);

    await expect(() =>
      databaseService.db.insert(collectiviteTable).values({
        ...values,
        nom: `${nom} bis`,
      })
    ).rejects.toThrowError();
  });

  test('Une mise à jour qui heurte un index unique est refusée comme doublon', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authenticatedUser.id,
    });

    onTestFinished(cleanup);

    const nomA = 'DREAL index unique A test';
    const nomB = 'DREAL index unique B test';
    // Codes propres à ce test, dans l'espace « lettre + chiffre » des specs.
    const regionA = 'C6';
    const regionB = 'C7';

    const cleanupCollectivites = async () => {
      const rows = await databaseService.db
        .select({ id: collectiviteTable.id })
        .from(collectiviteTable)
        .where(inArray(collectiviteTable.nom, [nomA, nomB]));
      const ids = rows.map(({ id }) => id);

      if (ids.length > 0) {
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(inArray(collectiviteBucketTable.collectiviteId, ids));
        await databaseService.db
          .delete(collectiviteTable)
          .where(inArray(collectiviteTable.id, ids));
      }
    };

    await cleanupCollectivites();
    onTestFinished(cleanupCollectivites);

    await caller.collectivites.collectivites.upsert({
      type: collectiviteTypeEnum.DREAL,
      nom: nomA,
      regionCode: regionA,
    });
    const insertB = await caller.collectivites.collectivites.upsert({
      type: collectiviteTypeEnum.DREAL,
      nom: nomB,
      regionCode: regionB,
    });

    // Avec un id, find() n'est pas consulté : seul l'index unique refuse.
    const error = await caller.collectivites.collectivites
      .upsert({ ...insertB, regionCode: regionA })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error).toMatchObject({
      code: 'CONFLICT',
      message: 'COLLECTIVITE_EXISTE_DEJA',
    });
  });

  test('Une erreur de base imprévue renvoie un code, jamais la requête', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: authenticatedUser.id,
    });

    onTestFinished(cleanup);

    const nom = 'Service public NIC trop long test';
    onTestFinished(async () => {
      const rows = await databaseService.db
        .select({ id: collectiviteTable.id })
        .from(collectiviteTable)
        .where(eq(collectiviteTable.nom, nom));
      const ids = rows.map(({ id }) => id);
      if (ids.length > 0) {
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(inArray(collectiviteBucketTable.collectiviteId, ids));
        await databaseService.db
          .delete(collectiviteTable)
          .where(inArray(collectiviteTable.id, ids));
      }
    });

    // Le NIC dépasse la colonne varchar(5) : erreur 22001, non prévue.
    const error = await caller.collectivites.collectivites
      .upsert({
        type: collectiviteTypeEnum.SERVICE_PUBLIC,
        nom,
        siren: '999999998',
        nic: '123456',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    // La cause fournit `data.errorKey` au client : le code, pas le SQL.
    expect((error as TRPCError).cause?.message).toBe('DATABASE_ERROR');
    expect((error as TRPCError).message).not.toContain('Failed query');
  });

  describe('Test getAdditionalInformation', async () => {
    test('EPCI', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: authenticatedUser.id,
      });

      onTestFinished(cleanup);

      const input: UpsertInput = {
        type: collectiviteTypeEnum.EPCI,
        siren: sirenEPCI,
      };
      const result =
        await caller.collectivites.collectivites.getAdditionalInformation(
          input
        );
      expect(result).toEqual({
        type: collectiviteTypeEnum.EPCI,
        siren: sirenEPCI,
        nom: 'Syndicat de la vallée du Blavet',
        regionCode: '53',
        departementCode: '56',
        natureInsee: 'SMF',
        population: 176457,
      });
    });

    test('Commune', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: authenticatedUser.id,
      });

      onTestFinished(cleanup);

      const input: UpsertInput = {
        type: collectiviteTypeEnum.COMMUNE,
        communeCode: '01001',
      };
      const result =
        await caller.collectivites.collectivites.getAdditionalInformation(
          input
        );
      expect(result).toEqual({
        type: collectiviteTypeEnum.COMMUNE,
        communeCode: '01001',
        nom: "L' Abergement-Clémenciat",
        regionCode: '84',
        departementCode: '01',
        population: 798,
      });
    });

    test('Département', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: authenticatedUser.id,
      });
      onTestFinished(cleanup);

      const input: UpsertInput = {
        type: collectiviteTypeEnum.DEPARTEMENT,
        departementCode: '31',
      };
      const result =
        await caller.collectivites.collectivites.getAdditionalInformation(
          input
        );
      expect(result).toEqual({
        type: collectiviteTypeEnum.DEPARTEMENT,
        departementCode: '31',
        nom: 'Haute-Garonne',
        regionCode: '76',
        population: 1423290,
      });
    });

    test('Region', async () => {
      const caller = router.createCaller({ user: authenticatedUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: authenticatedUser.id,
      });
      onTestFinished(cleanup);

      const input: UpsertInput = {
        type: collectiviteTypeEnum.REGION,
        regionCode: '76',
      };
      const result =
        await caller.collectivites.collectivites.getAdditionalInformation(
          input
        );
      expect(result).toEqual({
        type: collectiviteTypeEnum.REGION,
        regionCode: '76',
        nom: 'Occitanie',
        population: 6057827,
      });
    });
  });
});
