import { INestApplication } from '@nestjs/common';
import { departementTable } from '@tet/backend/collectivites/shared/models/imports-departement.table';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { getTestApp, getTestDatabase, getTestRouter } from '@tet/backend/test';
import { effetAttenduTable } from '@tet/backend/shared/effet-attendu/effet-attendu.table';
import { tempsDeMiseEnOeuvreTable } from '@tet/backend/shared/models/temps-de-mise-en-oeuvre.table';
import { sousThematiqueTable } from '@tet/backend/shared/thematiques/sous-thematique.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { eq } from 'drizzle-orm';

describe('SharedRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let testUser: AuthenticatedUser;
  let thematiqueId: number;
  let sousThematiqueId: number;
  let effetAttenduId: number;
  let tempsDeMiseEnOeuvreId: number;
  let regionCode: string;
  let departementCode: string;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testUserResult = await addTestUser(databaseService);
    testUser = getAuthUserFromUserCredentials(testUserResult.user);

    const suffix = Date.now();
    // Some reference tables are seeded with explicit ids while their sequence
    // can lag behind in tests. Use explicit negative ids to avoid PK collisions.
    const baseId = -Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 1000);
    thematiqueId = baseId;
    sousThematiqueId = baseId - 1;
    effetAttenduId = baseId - 2;
    tempsDeMiseEnOeuvreId = baseId - 3;
    regionCode = '9Z';
    departementCode = '9ZZ';

    await databaseService.db.insert(thematiqueTable).values({
      id: thematiqueId,
      nom: `Thematique e2e ${suffix}`,
      mdId: `thematique-e2e-${suffix}`,
    });

    await databaseService.db.insert(sousThematiqueTable).values({
      id: sousThematiqueId,
      nom: `Sous-thematique e2e ${suffix}`,
      thematiqueId,
    });

    await databaseService.db.insert(effetAttenduTable).values({
      id: effetAttenduId,
      nom: `Effet attendu e2e ${suffix}`,
      notice: `Notice e2e ${suffix}`,
    });

    await databaseService.db.insert(tempsDeMiseEnOeuvreTable).values({
      id: tempsDeMiseEnOeuvreId,
      nom: `Temps de mise en oeuvre e2e ${suffix}`,
    });

    await databaseService.db
      .delete(departementTable)
      .where(eq(departementTable.code, departementCode));
    await databaseService.db
      .delete(regionTable)
      .where(eq(regionTable.code, regionCode));

    await databaseService.db.insert(regionTable).values({
      code: regionCode,
      population: 1000,
      libelle: `Region e2e ${suffix}`,
      drom: false,
    });

    await databaseService.db.insert(departementTable).values({
      code: departementCode,
      population: 500,
      libelle: `Departement e2e ${suffix}`,
      regionCode,
    });
  });

  afterAll(async () => {
    await databaseService.db
      .delete(sousThematiqueTable)
      .where(eq(sousThematiqueTable.id, sousThematiqueId));
    await databaseService.db
      .delete(thematiqueTable)
      .where(eq(thematiqueTable.id, thematiqueId));
    await databaseService.db
      .delete(effetAttenduTable)
      .where(eq(effetAttenduTable.id, effetAttenduId));
    await databaseService.db
      .delete(tempsDeMiseEnOeuvreTable)
      .where(eq(tempsDeMiseEnOeuvreTable.id, tempsDeMiseEnOeuvreId));
    await databaseService.db
      .delete(departementTable)
      .where(eq(departementTable.code, departementCode));
    await databaseService.db
      .delete(regionTable)
      .where(eq(regionTable.code, regionCode));

    await app.close();
  });

  test('refuse les routes shared si non authentifie', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() => caller.shared.thematiques.list()).rejects.toThrowError(
      /not authenticated/i
    );
    await expect(() =>
      caller.shared.thematiques.listSousThematiques()
    ).rejects.toThrowError(/not authenticated/i);
    await expect(() => caller.shared.effetsAttendus.list()).rejects.toThrowError(
      /not authenticated/i
    );
    await expect(() =>
      caller.shared.tempsDeMiseEnOeuvre.list()
    ).rejects.toThrowError(/not authenticated/i);
    await expect(() => caller.shared.regions.list()).rejects.toThrowError(
      /not authenticated/i
    );
    await expect(() => caller.shared.departements.list()).rejects.toThrowError(
      /not authenticated/i
    );
  });

  test('liste les thematiques et sous-thematiques', async () => {
    const caller = router.createCaller({ user: testUser });

    const thematiques = await caller.shared.thematiques.list();
    const sousThematiques = await caller.shared.thematiques.listSousThematiques();

    expect(thematiques).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: thematiqueId,
        }),
      ])
    );
    expect(sousThematiques).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: sousThematiqueId,
          thematiqueId,
        }),
      ])
    );
  });

  test('liste les effets attendus', async () => {
    const caller = router.createCaller({ user: testUser });
    const effetsAttendus = await caller.shared.effetsAttendus.list();

    expect(effetsAttendus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: effetAttenduId,
        }),
      ])
    );
  });

  test('liste les temps de mise en oeuvre', async () => {
    const caller = router.createCaller({ user: testUser });
    const tempsDeMiseEnOeuvre = await caller.shared.tempsDeMiseEnOeuvre.list();

    expect(tempsDeMiseEnOeuvre).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: tempsDeMiseEnOeuvreId,
        }),
      ])
    );
  });

  test('liste les regions et departements', async () => {
    const caller = router.createCaller({ user: testUser });
    const regions = await caller.shared.regions.list();
    const departements = await caller.shared.departements.list();

    expect(regions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: regionCode,
        }),
      ])
    );
    expect(departements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: departementCode,
          regionCode,
        }),
      ])
    );
  });
});
