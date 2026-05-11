import { INestApplication } from '@nestjs/common';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { planActionTypeCategorieTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type-categorie.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';

describe('ListPlanTypesRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let testUser: AuthenticatedUser;
  let categorie: string;
  const typeSecond = 'zebra_e2e_type';
  const typeFirst = 'alpha_e2e_type';

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testUserResult = await addTestUser(databaseService);
    testUser = getAuthUserFromUserCredentials(testUserResult.user);

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    categorie = `e2e_plan_action_type_cat_${suffix}`;

    await databaseService.db.insert(planActionTypeCategorieTable).values({
      categorie,
    });

    // Insert in reverse type order; listTypes must return ascending by (categorie, type, id).
    await databaseService.db.insert(planActionTypeTable).values([
      { categorie, type: typeSecond, detail: null },
      {
        categorie,
        type: typeFirst,
        detail: 'e2e detail',
      },
    ]);
  });

  afterAll(async () => {
    await databaseService.db
      .delete(planActionTypeTable)
      .where(eq(planActionTypeTable.categorie, categorie));
    await databaseService.db
      .delete(planActionTypeCategorieTable)
      .where(eq(planActionTypeCategorieTable.categorie, categorie));
    await app.close();
  });

  test('refuse listTypes si non authentifié', async () => {
    const caller = router.createCaller({ user: null });
    await expect(() => caller.plans.plans.listTypes()).rejects.toThrowError(
      /not authenticated/i
    );
  });

  test('listTypes renvoie le bon ordre (categorie, type, id) et la forme attendue', async () => {
    const caller = router.createCaller({ user: testUser });
    const types = await caller.plans.plans.listTypes();

    const ours = types.filter((t) => t.categorie === categorie);
    expect(ours).toHaveLength(2);
    expect(ours[0]).toMatchObject({
      categorie,
      type: typeFirst,
      detail: 'e2e detail',
    });
    expect(ours[1]).toMatchObject({
      categorie,
      type: typeSecond,
      detail: null,
    });
    expect(ours.map((t) => t.type)).toEqual([typeFirst, typeSecond]);

    for (const row of ours) {
      expect(typeof row.id).toBe('number');
      expect(typeof row.categorie).toBe('string');
      expect(typeof row.type).toBe('string');
      expect(row.detail === null || typeof row.detail === 'string').toBe(true);
    }
  });
});
