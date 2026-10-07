import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { eq, sql, SQL } from 'drizzle-orm';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  onTestFinished,
} from 'vitest';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY } from '../ai-plan-import.constants';
import {
  AiPlanImportJobOptions,
  AiPlanImportJobStatus,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
import { aiPlanImportJobTable } from '../models/ai-plan-import-job.table';
import { initialStepStates } from '../pipeline/run-import-pipeline';

const TEST_COLLECTIVITE_ID = 1;
const makeEnqueueUrl = (collectiviteId: number) =>
  `/collectivites/${collectiviteId}/plans/import-ia`;
const ENQUEUE_URL = makeEnqueueUrl(TEST_COLLECTIVITE_ID);
const csvFile = () => Buffer.from('axe,titre\n1,Action', 'utf-8');
const jobOptions: AiPlanImportJobOptions = {
  instructions: '',
  planName: 'Plan import IA e2e',
  withVerifications: false,
  withSousActions: false,
  disabledFields: [],
};

describe('Enqueue import IA (controller)', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let supportToken: string;
  let outsiderToken: string;
  let editorToken: string;
  let readerToken: string;
  let freshEnqueueUrl: string;
  let freshCollectiviteId: number;
  let otherCollectiviteId: number;
  let supportUserId: string;
  let editorId: string;
  let readerId: string;
  let cleanupFreshCollectivite: () => Promise<void>;
  let cleanupOtherCollectivite: () => Promise<void>;
  let disableSupport: () => Promise<void>;

  const deleteJobs = () =>
    db.db
      .delete(aiPlanImportJobTable)
      .where(eq(aiPlanImportJobTable.collectiviteId, TEST_COLLECTIVITE_ID));

  const insertJobs = async (
    count: number,
    job: {
      collectiviteId: number;
      createdBy: string;
      status: AiPlanImportJobStatus;
      createdAt?: SQL;
    }
  ) => {
    await db.db.insert(aiPlanImportJobTable).values(
      Array.from({ length: count }, () => ({
        ...job,
        sourcePath: `${job.collectiviteId}/e2e`,
        options: jobOptions,
        stepStates: initialStepStates(),
      }))
    );
    onTestFinished(async () => {
      await db.db
        .delete(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.collectiviteId, job.collectiviteId));
    });
  };

  const enqueueAsEditor = () =>
    request(app.getHttpServer())
      .post(freshEnqueueUrl)
      .set('Authorization', `Bearer ${editorToken}`)
      .field('planName', 'Plan import IA e2e')
      .attach('file', csvFile(), {
        filename: 'plan.csv',
        contentType: 'text/csv',
      });

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const support = await addTestUser(db, {
      collectiviteId: TEST_COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    const supportUser = getAuthUserFromUserCredentials(support.user);
    supportUserId = supportUser.id;
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

    const {
      collectivite: freshCollectivite,
      users: [editor, reader],
      cleanup: cleanupFresh,
    } = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.LECTURE },
      ],
    });
    freshEnqueueUrl = makeEnqueueUrl(freshCollectivite.id);
    freshCollectiviteId = freshCollectivite.id;
    editorId = editor.id;
    readerId = reader.id;
    cleanupFreshCollectivite = cleanupFresh;

    const { collectivite: otherCollectivite, cleanup: cleanupOther } =
      await addTestCollectivite(db);
    otherCollectiviteId = otherCollectivite.id;
    cleanupOtherCollectivite = cleanupOther;
    editorToken = await getAuthToken({
      email: editor.email ?? '',
      password: editor.password,
    });
    readerToken = await getAuthToken({
      email: reader.email ?? '',
      password: reader.password,
    });

    await deleteJobs();
  });

  afterAll(async () => {
    await deleteJobs();
    await cleanupFreshCollectivite();
    await cleanupOtherCollectivite();
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

  // Le type inconnu est rejeté après le contrôle de permission : un 400 prouve
  // que l'éditeur passe ce contrôle, sans mettre de job en file.
  it('autorise un éditeur de la collectivité sans mode super-admin', async () => {
    const response = await request(app.getHttpServer())
      .post(freshEnqueueUrl)
      .set('Authorization', `Bearer ${editorToken}`)
      .field('planName', 'Plan import IA e2e')
      .field('planType', '999999')
      .attach('file', csvFile(), {
        filename: 'plan.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(400);
  });

  // Même type inconnu : si le contrôle laissait passer, on aurait un 400 et
  // aucun job en file.
  it('rejette un utilisateur en lecture sur la collectivité (403)', async () => {
    const response = await request(app.getHttpServer())
      .post(freshEnqueueUrl)
      .set('Authorization', `Bearer ${readerToken}`)
      .field('planName', 'Plan import IA e2e')
      .field('planType', '999999')
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
  it('refuse un second import en parallèle au même utilisateur, même sur une autre collectivité (409)', async () => {
    await insertJobs(1, {
      collectiviteId: otherCollectiviteId,
      createdBy: editorId,
      status: AiPlanImportJobStatusEnum.RUNNING,
    });

    const response = await enqueueAsEditor();

    expect(response.status).toBe(409);
    expect(response.body.message).toContain(
      'Vous avez déjà un import en cours'
    );
    const jobs = await db.db
      .select()
      .from(aiPlanImportJobTable)
      .where(eq(aiPlanImportJobTable.collectiviteId, freshCollectiviteId));
    expect(jobs).toHaveLength(0);
  });

  // L'import en cours d'un autre utilisateur sur la collectivité visée arrête
  // le lancement au tout dernier contrôle, avant storage et file : le refus
  // porte sur la collectivité, preuve que la limite par utilisateur est levée.
  it('laisse le super-admin lancer un import pendant un autre import à lui', async () => {
    await insertJobs(1, {
      collectiviteId: otherCollectiviteId,
      createdBy: supportUserId,
      status: AiPlanImportJobStatusEnum.RUNNING,
    });
    await insertJobs(1, {
      collectiviteId: freshCollectiviteId,
      createdBy: editorId,
      status: AiPlanImportJobStatusEnum.RUNNING,
    });

    const response = await request(app.getHttpServer())
      .post(freshEnqueueUrl)
      .set('Authorization', `Bearer ${supportToken}`)
      .field('planName', 'Plan import IA e2e')
      .attach('file', csvFile(), {
        filename: 'plan.csv',
        contentType: 'text/csv',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain(
      'Un import est déjà en cours pour cette collectivité'
    );
  });

  it(`refuse au-delà de ${AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY} imports sur 24 heures pour la collectivité (429)`, async () => {
    await insertJobs(AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY, {
      collectiviteId: freshCollectiviteId,
      createdBy: readerId,
      status: AiPlanImportJobStatusEnum.DONE,
    });

    const response = await enqueueAsEditor();

    expect(response.status).toBe(429);
    expect(response.body.message).toContain('limite');
  });

  // Au niveau du repository : un envoi valide au controller mettrait le job en
  // file et lancerait la pipeline.
  it('ne compte pas dans le quota les imports de plus de 24 heures', async () => {
    await insertJobs(AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY, {
      collectiviteId: freshCollectiviteId,
      createdBy: readerId,
      status: AiPlanImportJobStatusEnum.DONE,
      createdAt: sql`now() - interval '25 hours'`,
    });

    const created = await app.get(AiPlanImportJobRepository).createWithinQuotas(
      {
        collectiviteId: freshCollectiviteId,
        createdBy: editorId,
        sourcePath: `${freshCollectiviteId}/e2e`,
        options: jobOptions,
      },
      { limitUserInFlight: true }
    );

    expect(created.success).toBe(true);
  });
});
