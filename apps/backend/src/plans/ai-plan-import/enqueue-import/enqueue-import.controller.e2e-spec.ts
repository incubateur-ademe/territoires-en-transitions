import { INestApplication } from '@nestjs/common';
import {
  getAuthToken,
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
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aiPlanImportJobTable } from '../models/ai-plan-import-job.table';

const TEST_COLLECTIVITE_ID = 1;
const ENQUEUE_URL = `/collectivites/${TEST_COLLECTIVITE_ID}/plans/import-ia`;
const csvFile = () => Buffer.from('axe,titre\n1,Action', 'utf-8');

describe('Enqueue import IA (controller)', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let supportToken: string;
  let outsiderToken: string;
  let disableSupport: () => Promise<void>;

  const deleteJobs = () =>
    db.db
      .delete(aiPlanImportJobTable)
      .where(eq(aiPlanImportJobTable.collectiviteId, TEST_COLLECTIVITE_ID));

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const support = await addTestUser(db, {
      collectiviteId: TEST_COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    const supportUser = getAuthUserFromUserCredentials(support.user);
    supportToken = await getAuthToken({
      email: support.user.email ?? '',
      password: support.user.password,
    });
    const caller = router.createCaller({ user: supportUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: supportUser.id,
    });
    disableSupport = cleanup;

    const outsider = await addTestUser(db);
    outsiderToken = await getAuthToken({
      email: outsider.user.email ?? '',
      password: outsider.user.password,
    });

    await deleteJobs();
  });

  afterAll(async () => {
    await deleteJobs();
    await disableSupport();
    await app.close();
  });

  it('rejette un type de plan inconnu avant de créer un job (400)', async () => {
    const response = await request(app.getHttpServer())
      .post(ENQUEUE_URL)
      .set('Authorization', `Bearer ${supportToken}`)
      .field('planName', 'Plan import IA e2e')
      .field('planType', '999999')
      .attach('file', csvFile(), {
        filename: 'plan.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(400);

    const jobs = await db.db
      .select()
      .from(aiPlanImportJobTable)
      .where(eq(aiPlanImportJobTable.collectiviteId, TEST_COLLECTIVITE_ID));
    expect(jobs).toHaveLength(0);
  });

  it('rejette un utilisateur sans droit sur la collectivité (403)', async () => {
    const response = await request(app.getHttpServer())
      .post(ENQUEUE_URL)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .field('planName', 'Plan import IA e2e')
      .attach('file', csvFile(), {
        filename: 'plan.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(403);
  });

  it('rejette un formulaire sans nom de plan (400)', async () => {
    const response = await request(app.getHttpServer())
      .post(ENQUEUE_URL)
      .set('Authorization', `Bearer ${supportToken}`)
      .attach('file', csvFile(), {
        filename: 'plan.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(400);
  });
});
