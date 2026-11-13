import { PostHog } from 'posthog-node';
import {
  electrificationCatalogueFixture as electrificationConfig,
  buildInMemoryElectrificationData,
} from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-data.test-fixture';
import { ElectrificationDataService } from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-data.service';
import { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import {
  addTestCollectivite,
  addTestCollectiviteAndUsers,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestDatabase,
  getTestRouter,
  getDisposableTestApp,
  signTestAuthToken,
} from '@tet/backend/test';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';
import { seedTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { StoreDocumentService } from '@tet/backend/collectivites/documents/store-document/store-document.service';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { ListPlanTypesService } from '@tet/backend/plans/plans/list-plan-types/list-plan-types.service';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { failure, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { PostHogEventTracker } from '@tet/backend/utils/tracking/posthog-event-tracker';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import {
  ELECTRIFICATION_PLAN_TYPE_KEY,
  ElectrificationLaureatsConfig,
} from '@tet/domain/plans';
import { FeatureFlagEnum } from '@tet/domain/utils';
import { and, eq, sql, SQL } from 'drizzle-orm';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
  MockInstance,
} from 'vitest';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import {
  AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS,
  AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY,
} from '../ai-plan-import.constants';
import {
  AiPlanImportJobOptions,
  AiPlanImportJobStatus,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
import { aiPlanImportJobTable } from '../models/ai-plan-import-job.table';
import { initialStepStates } from '../pipeline/run-import-pipeline';
import { AI_PLAN_IMPORT_QUEUE_NAME } from '../ai-plan-import.queue';
import { buildElectrificationDocument } from '../electrification/extract-plan/__fixtures__/electrification-document.test-fixture';
import { electrificationDocumentTemplate } from '@tet/backend/plans/plans/electrification/config/electrification-document-template.constants';
import { ELECTRIFICATION_CHECKPOINT_VERSION } from '../electrification/extract-plan/electrification-extraction-checkpoint.schema';
import { GenerateImportDraftWorker } from '../generate-import-draft/generate-import-draft.worker';
import { AiPlanImportProfileEnum } from '../models/import-profile';
import { buildInMemoryDocumentStorage } from '../pipeline/__fixtures__/in-memory-document-storage';
import { DOCX_MIME } from './detect-source-mime-type';

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
  let globalQuota: MockInstance;
  let uploadBuffer: MockInstance<StoreDocumentService['uploadBuffer']>;

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

  const enqueue = (token: string) =>
    request(app.getHttpServer())
      .post(freshEnqueueUrl)
      .set('Authorization', `Bearer ${token}`)
      .field('planName', 'Plan import IA e2e')
      .attach('file', csvFile(), {
        filename: 'plan.csv',
        contentType: 'text/csv',
      });

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new FakeLlmRepository()));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
        builder
          .overrideProvider(getQueueToken(AI_PLAN_IMPORT_QUEUE_NAME))
          .useValue({ add: vi.fn().mockResolvedValue({}) });
        builder
          .overrideProvider(DocumentStorageService)
          .useValue(buildInMemoryDocumentStorage());
      },
    });
    db = await getTestDatabase(app);
    router = await getTestRouter(app);
    const secret = app.get(ConfigurationService).get('SUPABASE_JWT_SECRET');
    // Ces cas vérifient les quotas utilisateur/collectivité, indépendamment
    // des jobs laissés dans la base par d'autres suites.
    globalQuota = vi
      .spyOn(app.get(AiPlanImportJobRepository), 'countInFlight')
      .mockResolvedValue(success(0));
    uploadBuffer = vi
      .spyOn(app.get(StoreDocumentService), 'uploadBuffer')
      .mockImplementation(async (collectiviteId) =>
        success(
          await seedTestDocument({
            databaseService: db,
            collectiviteId,
            filename: 'plan.csv',
            withStorageObject: false,
          })
        )
      );

    const support = await addTestUser(db, {
      collectiviteId: TEST_COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    const supportUser = getAuthUserFromUserCredentials(support.user);
    supportUserId = supportUser.id;
    supportToken = signTestAuthToken(
      { ...supportUser.jwtPayload, sub: supportUser.id },
      secret
    );
    const caller = router.createCaller({ user: supportUser });
    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: supportUser.id,
    });
    disableSupport = cleanup;

    const outsider = await addTestUser(db);
    outsiderToken = signTestAuthToken(
      {
        ...getAuthUserFromUserCredentials(outsider.user).jwtPayload,
        sub: outsider.user.id,
      },
      secret
    );

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
    editorToken = signTestAuthToken(
      { ...getAuthUserFromUserCredentials(editor).jwtPayload, sub: editor.id },
      secret
    );
    readerToken = signTestAuthToken(
      { ...getAuthUserFromUserCredentials(reader).jwtPayload, sub: reader.id },
      secret
    );

    await deleteJobs();
  });

  afterAll(async () => {
    globalQuota?.mockRestore();
    uploadBuffer?.mockRestore();
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

    const response = await enqueue(editorToken);

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
  // le lancement après rangement en bibliothèque, avant création du job : le refus
  // porte sur la collectivité, preuve que la limite par utilisateur est levée.
  it('laisse le super-admin lancer un import pendant un autre import à lui', async () => {
    await insertJobs(AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY, {
      collectiviteId: freshCollectiviteId,
      createdBy: readerId,
      status: AiPlanImportJobStatusEnum.DONE,
    });
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

    const response = await enqueue(supportToken);

    expect(response.status).toBe(409);
    expect(response.body.message).toContain(
      'Un import est déjà en cours pour cette collectivité'
    );
  });

  it.each([AiPlanImportJobStatusEnum.DONE, AiPlanImportJobStatusEnum.FAILED])(
    `refuse au-delà de ${AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY} imports %s sur 24 heures pour la collectivité (429)`,
    async (status) => {
      await insertJobs(AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY, {
        collectiviteId: freshCollectiviteId,
        createdBy: readerId,
        status,
      });

      const response = await enqueue(editorToken);

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('limite');
    }
  );

  it('autorise le super-admin au-delà du quota journalier sans supprimer les imports précédents', async () => {
    await insertJobs(AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY, {
      collectiviteId: freshCollectiviteId,
      createdBy: readerId,
      status: AiPlanImportJobStatusEnum.DONE,
    });

    const response = await enqueue(supportToken);

    expect(response.status).toBe(201);
    onTestFinished(async () => {
      await db.db.delete(axeTable).where(eq(axeTable.id, response.body.planId));
    });
    const jobs = await db.db
      .select()
      .from(aiPlanImportJobTable)
      .where(eq(aiPlanImportJobTable.collectiviteId, freshCollectiviteId));
    expect(jobs).toHaveLength(
      AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY + 1
    );
    expect(jobs).toContainEqual(
      expect.objectContaining({
        id: response.body.jobId,
        createdBy: supportUserId,
        status: AiPlanImportJobStatusEnum.PENDING,
      })
    );
    expect(
      app.get(getQueueToken(AI_PLAN_IMPORT_QUEUE_NAME)).add
    ).toHaveBeenCalledWith(
      expect.any(String),
      { jobId: response.body.jobId },
      { jobId: response.body.jobId }
    );
  });

  it('conserve le quota journalier pour le support sans mode super-admin actif', async () => {
    const { cleanup } = await addUserRoleSupport({
      databaseService: db,
      userId: editorId,
    });
    onTestFinished(cleanup);
    await insertJobs(AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY, {
      collectiviteId: freshCollectiviteId,
      createdBy: readerId,
      status: AiPlanImportJobStatusEnum.DONE,
    });

    const response = await enqueue(editorToken);

    expect(response.status).toBe(429);
    expect(response.body.message).toContain('limite');
  });

  it('conserve la limite globale des imports simultanés pour le super-admin (429)', async () => {
    globalQuota.mockResolvedValueOnce(
      success(AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS)
    );

    const response = await enqueue(supportToken);

    expect(response.status).toBe(429);
    const jobs = await db.db
      .select()
      .from(aiPlanImportJobTable)
      .where(eq(aiPlanImportJobTable.collectiviteId, freshCollectiviteId));
    expect(jobs).toHaveLength(0);
  });

  // Au niveau du repository pour tester directement la fenêtre de quota.
  it('ne compte pas dans le quota les imports de plus de 24 heures', async () => {
    await insertJobs(AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY, {
      collectiviteId: freshCollectiviteId,
      createdBy: readerId,
      status: AiPlanImportJobStatusEnum.DONE,
      createdAt: sql`now() - interval '25 hours'`,
    });

    const fichier = await seedTestDocument({
      databaseService: db,
      collectiviteId: freshCollectiviteId,
      filename: 'plan.csv',
    });
    const [plan] = await db.db
      .insert(axeTable)
      .values({ collectiviteId: freshCollectiviteId, nom: jobOptions.planName })
      .returning({ id: axeTable.id });
    onTestFinished(async () => {
      await db.db.delete(axeTable).where(eq(axeTable.id, plan.id));
    });

    const created = await app.get(AiPlanImportJobRepository).createWithinQuotas(
      {
        collectiviteId: freshCollectiviteId,
        createdBy: editorId,
        sourcePath: `${freshCollectiviteId}/e2e`,
        fichierId: fichier.id,
        options: jobOptions,
      },
      {
        limitUserInFlight: true,
        limitDailyImports: true,
        createPlan: async () => success(plan.id),
      }
    );

    expect(created.success).toBe(true);
  });
});

describe(
  'Admission HTTP du profil Électrification',
  { timeout: 30_000 },
  () => {
    const catalogue = structuredClone(electrificationConfig);
    const data = buildInMemoryElectrificationData({
      catalogue: () => catalogue,
      laureats: () => laureats,
    });
    const laureats: ElectrificationLaureatsConfig = {
      source: 'Mapping synthétique pour les e2e',
      version: 'test-laureats',
      validFrom: '2000-01-01T00:00:00.000Z',
      validUntil: '2100-01-01T00:00:00.000Z',
      laureats: [],
    };
    const storage = buildInMemoryDocumentStorage();
    const addToQueue = vi.fn().mockResolvedValue({});
    let app: INestApplication;
    let db: DatabaseService;
    let fixture: Awaited<ReturnType<typeof addTestCollectiviteAndUser>>;
    let token: string;
    let typeId: number;
    let docx: Buffer;
    let uploadBuffer: MockInstance<StoreDocumentService['uploadBuffer']>;
    let deleteImportingPlan: MockInstance<
      PlanVerificationRepository['deleteImportingPlan']
    >;

    beforeAll(async () => {
      app = await getDisposableTestApp({
        overrides: (builder) => {
          builder.overrideProvider(ElectrificationDataService).useValue(data);
          builder
            .overrideProvider(LlmService)
            .useValue(new LlmService(new FakeLlmRepository()));
          builder.overrideProvider(GenerateImportDraftWorker).useValue({});
          builder
            .overrideProvider(getQueueToken(AI_PLAN_IMPORT_QUEUE_NAME))
            .useValue({ add: addToQueue });
          builder.overrideProvider(DocumentStorageService).useValue(storage);
        },
      });
      db = await getTestDatabase(app);
      const [type] = await db.db
        .select()
        .from(planActionTypeTable)
        .where(
          and(
            eq(
              planActionTypeTable.categorie,
              ELECTRIFICATION_PLAN_TYPE_KEY.categorie
            ),
            eq(planActionTypeTable.type, ELECTRIFICATION_PLAN_TYPE_KEY.type)
          )
        );
      expect(type).toBeDefined();
      typeId = type.id;
      docx = await buildElectrificationDocument();
    });

    beforeEach(async () => {
      // Ces cas d'admission ne dépendent pas des jobs des autres applications de test.
      vi.spyOn(
        app.get(AiPlanImportJobRepository),
        'countInFlight'
      ).mockResolvedValue(success(0));
      Object.assign(catalogue, structuredClone(electrificationConfig));
      fixture = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
      });
      laureats.laureats = [
        { collectiviteId: fixture.collectivite.id, reference: 'laureat-test' },
      ];
      token = signTestAuthToken(
        {
          ...getAuthUserFromUserCredentials(fixture.user).jwtPayload,
          sub: fixture.user.id,
        },
        app.get(ConfigurationService).get('SUPABASE_JWT_SECRET')
      );
      vi.spyOn(app.get(TrackingService), 'isFeatureEnabled').mockResolvedValue(
        true
      );
      uploadBuffer = vi
        .spyOn(app.get(StoreDocumentService), 'uploadBuffer')
        .mockImplementation(async () =>
          success(
            await seedTestDocument({
              databaseService: db,
              collectiviteId: fixture.collectivite.id,
              filename: 'convention.docx',
              withStorageObject: false,
            })
          )
        );
      deleteImportingPlan = vi.spyOn(
        app.get(PlanVerificationRepository),
        'deleteImportingPlan'
      );
      addToQueue.mockReset().mockResolvedValue({});
    });

    afterEach(async () => {
      vi.restoreAllMocks();
      await db.db
        .delete(aiPlanImportJobTable)
        .where(
          eq(aiPlanImportJobTable.collectiviteId, fixture.collectivite.id)
        );
      await fixture.cleanup();
    });
    afterAll(async () => app.close());

    const enqueue = (buffer = docx, planType?: number) => {
      const req = request(app.getHttpServer())
        .post(makeEnqueueUrl(fixture.collectivite.id))
        .set('Authorization', `Bearer ${token}`)
        .field('profile', AiPlanImportProfileEnum.ELECTRIFICATION)
        .field('planName', 'Plan Électrification');
      if (planType !== undefined) req.field('planType', String(planType));
      return req.attach('file', buffer, {
        filename: 'convention.docx',
        contentType: DOCX_MIME,
      });
    };
    const expectNoWrites = async () => {
      expect(uploadBuffer).not.toHaveBeenCalled();
      expect(addToQueue).not.toHaveBeenCalled();
      expect(
        await db.db
          .select()
          .from(aiPlanImportJobTable)
          .where(
            eq(aiPlanImportJobTable.collectiviteId, fixture.collectivite.id)
          )
      ).toHaveLength(0);
      expect(
        await db.db
          .select()
          .from(axeTable)
          .where(eq(axeTable.collectiviteId, fixture.collectivite.id))
      ).toHaveLength(0);
    };

    it.each([
      'flag fermé',
      'évaluation du flag en erreur',
      'liste des actions absente',
      'référence en double',
      'rattachement invalide',
      'engagements incomplets',
      'catalogue vide',
      'non lauréat',
      'type absent',
    ])('publie et applique le même refus avant upload : %s', async (reason) => {
      const capture = vi
        .spyOn(app.get(TrackingService), 'capture')
        .mockImplementation(() => undefined);
      if (reason === 'flag fermé')
        vi.mocked(app.get(TrackingService).isFeatureEnabled).mockResolvedValue(
          false
        );
      if (reason === 'évaluation du flag en erreur')
        vi.mocked(app.get(TrackingService).isFeatureEnabled).mockRejectedValue(
          new Error('PostHog indisponible')
        );
      if (reason === 'liste des actions absente')
        catalogue.fiches.actions = null;
      if (reason === 'référence en double')
        catalogue.axes.push({ ...catalogue.axes[0] });
      if (reason === 'rattachement invalide')
        catalogue.engagements[0].axeNumero = 999;
      if (reason === 'engagements incomplets') catalogue.engagements.pop();
      if (reason === 'catalogue vide') {
        catalogue.axes = [];
        catalogue.engagements = [];
      }
      if (reason === 'non lauréat') laureats.laureats = [];
      if (reason === 'type absent')
        vi.spyOn(
          app.get(ListPlanTypesService),
          'listPlanTypes'
        ).mockResolvedValue([]);
      const caller = (await getTestRouter(app)).createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      });
      const capabilities = await caller.plans.aiImport.getAiImportCapabilities({
        collectiviteId: fixture.collectivite.id,
      });
      expect(capabilities.profiles).toContainEqual({
        profile: AiPlanImportProfileEnum.ELECTRIFICATION,
        available: false,
      });
      expect((await enqueue()).status).toBe(412);
      expect(capture).toHaveBeenCalledWith({
        distinctId: fixture.user.id,
        event: 'plans:import-ia:refused',
        properties: expect.objectContaining({
          profile: AiPlanImportProfileEnum.ELECTRIFICATION,
          reason: expect.any(String),
        }),
        groups: { collectivite: String(fixture.collectivite.id) },
      });
      await expectNoWrites();
    });

    it.each([undefined, AiPlanImportProfileEnum.GENERIC])(
      'refuse le type Électrification sans son profil dédié : %s',
      async (profile) => {
        const req = request(app.getHttpServer())
          .post(makeEnqueueUrl(fixture.collectivite.id))
          .set('Authorization', `Bearer ${token}`)
          .field('planName', 'Plan Électrification')
          .field('planType', String(typeId));
        if (profile) req.field('profile', profile);
        const response = await req.attach('file', docx, {
          filename: 'convention.docx',
          contentType: DOCX_MIME,
        });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain(
          "parcours d'import Électrification"
        );
        await expectNoWrites();
      }
    );

    it('refuse un CSV déclaré DOCX et un autre type de plan avant upload', async () => {
      expect((await enqueue(csvFile())).status).toBe(400);
      expect((await enqueue(docx, typeId + 100000)).status).toBe(400);
      await expectNoWrites();
    });

    it('admet le catalogue livré avec ses correspondances en attente, sans plan provisoire et avec les métadonnées serveur', async () => {
      const caller = (await getTestRouter(app)).createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      });
      const capabilities = await caller.plans.aiImport.getAiImportCapabilities({
        collectiviteId: fixture.collectivite.id,
      });
      expect(capabilities.profiles).toContainEqual({
        profile: AiPlanImportProfileEnum.ELECTRIFICATION,
        available: true,
      });
      const response = await enqueue()
        .field('schemaVersion', '999')
        .field('catalogueVersion', 'catalogue-client')
        .field('templateVersion', 'canevas-client')
        .field('contractVersion', '999')
        .field('withSecteurs', 'true')
        .field('eligibility', JSON.stringify({ eligible: false }));
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        profile: AiPlanImportProfileEnum.ELECTRIFICATION,
        planId: null,
      });
      const [job] = await db.db
        .select()
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, response.body.jobId));
      expect(job.createdPlanId).toBeNull();
      expect(job.options).toMatchObject({
        profile: AiPlanImportProfileEnum.ELECTRIFICATION,
        schemaVersion: ELECTRIFICATION_CHECKPOINT_VERSION,
        catalogueVersion: catalogue.version,
        templateVersion: electrificationDocumentTemplate.version,
        withSecteurs: false,
        planType: typeId,
        eligibility: {
          eligible: true,
          laureatReference: 'laureat-test',
          provenance: {
            source: laureats.source,
            version: laureats.version,
            validFrom: laureats.validFrom,
            validUntil: laureats.validUntil,
          },
        },
      });
      expect(job.options.contractVersion).toBeUndefined();
      expect(
        await db.db
          .select()
          .from(axeTable)
          .where(eq(axeTable.collectiviteId, fixture.collectivite.id))
      ).toHaveLength(0);
      expect(addToQueue).toHaveBeenCalledOnce();
    });

    it.each(['storage', 'queue'])(
      'libère le quota après un échec %s sans supprimer de plan',
      async (failureStep) => {
        if (failureStep === 'storage')
          vi.spyOn(storage, 'storeDocument').mockResolvedValue(
            failure('WRITE_DOCUMENT_ERROR')
          );
        else addToQueue.mockRejectedValue(new Error('Queue indisponible'));
        expect((await enqueue()).status).toBe(500);
        expect(
          await db.db
            .select()
            .from(aiPlanImportJobTable)
            .where(
              eq(aiPlanImportJobTable.collectiviteId, fixture.collectivite.id)
            )
        ).toHaveLength(0);
        expect(deleteImportingPlan).not.toHaveBeenCalled();
      }
    );

    it('ne rend pas le flag serveur actif par défaut dans le runtime de test', async () => {
      const tracker = new PostHogEventTracker({
        get: () => undefined,
      } as unknown as ConfigurationService);
      const trackingService = new TrackingService(tracker);
      vi.mocked(app.get(TrackingService).isFeatureEnabled).mockImplementation(
        trackingService.isFeatureEnabled.bind(trackingService)
      );
      expect(
        await trackingService.isFeatureEnabled(
          FeatureFlagEnum['IS-AI-PLAN-IMPORT-ENABLED'],
          fixture.user.id,
          fixture.collectivite.id
        )
      ).toBe(true);
      const caller = (await getTestRouter(app)).createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      });
      const capabilities = await caller.plans.aiImport.getAiImportCapabilities({
        collectiviteId: fixture.collectivite.id,
      });
      expect(capabilities.profiles).toContainEqual({
        profile: AiPlanImportProfileEnum.ELECTRIFICATION,
        available: false,
      });
      expect((await enqueue()).status).toBe(412);
      await expectNoWrites();
    });
  }
);

describe('Contexte des événements PostHog serveur', () => {
  it.each(['staging', 'preprod', 'prod', undefined])(
    'transmet l’environnement %s pour les événements du worker, sans contexte HTTP',
    async (environment) => {
      // Aucun événement ni requête ne part vers PostHog : le SDK est intercepté.
      const capture = vi
        .spyOn(PostHog.prototype, 'capture')
        .mockImplementation(() => undefined);
      const config = {
        POSTHOG_KEY: 'phc_synthetic_e2e',
        POSTHOG_HOST: 'http://127.0.0.1:1',
        ENV_NAME: environment,
      };
      const tracker = new PostHogEventTracker({
        get: (key: keyof typeof config) => config[key],
      } as unknown as ConfigurationService);
      try {
        const service = new TrackingService(tracker);
        service.capture({
          distinctId: 'synthetic-user',
          event: 'plans:import-ia:started',
          properties: { profile: 'generic', jobId: 'synthetic-job' },
          groups: { collectivite: '123' },
        });
        expect(capture).toHaveBeenCalledOnce();
        expect(capture).toHaveBeenCalledWith({
          distinctId: 'synthetic-user',
          event: 'plans:import-ia:started',
          properties: {
            profile: 'generic',
            jobId: 'synthetic-job',
            environment: environment ?? 'local',
          },
          groups: { collectivite: '123' },
        });
        capture.mockImplementation(() => {
          throw new Error('PostHog indisponible');
        });
        expect(() =>
          service.capture({
            distinctId: 'synthetic-user',
            event: 'plans:import-ia:succeeded',
          })
        ).not.toThrow();
      } finally {
        await tracker.shutdown();
        capture.mockRestore();
      }
    }
  );
});
