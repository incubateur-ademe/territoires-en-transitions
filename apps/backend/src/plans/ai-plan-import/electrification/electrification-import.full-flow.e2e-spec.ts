import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { planActionTypeCategorieTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type-categorie.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { ELECTRIFICATION_LAUREATS_CONFIG } from '@tet/backend/plans/plans/check-electrification-eligibility/electrification-eligibility.constants';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { addAndEnableUserSuperAdminMode } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { failure } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ELECTRIFICATION_SOURCE_ID } from '@tet/domain/indicateurs';
import {
  ELECTRIFICATION_PLAN_TYPE_KEY,
  electrificationConfig,
  ElectrificationLaureatsConfig,
  PlanStatusEnum,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray, or } from 'drizzle-orm';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { AiPlanImportJobRepository } from '../ai-plan-import-job.repository';
import { AI_PLAN_IMPORT_SOURCE_BUCKET } from '../ai-plan-import.constants';
import { AiPlanImportErrorEnum } from '../ai-plan-import.errors';
import { AI_PLAN_IMPORT_QUEUE_NAME } from '../ai-plan-import.queue';
import { DOCX_MIME } from '../enqueue-import/detect-source-mime-type';
import { EnqueueImportService } from '../enqueue-import/enqueue-import.service';
import { GenerateImportDraftService } from '../generate-import-draft/generate-import-draft.service';
import { GenerateImportDraftWorker } from '../generate-import-draft/generate-import-draft.worker';
import { aiPlanImportJobTable } from '../models/ai-plan-import-job.table';
import { aiPlanImportStepRunTable } from '../models/ai-plan-import-step-run.table';
import { AiPlanImportProfileEnum } from '../models/import-profile';
import { NotifyPlanImportedService } from '../notify-plan-imported/notify-plan-imported.service';
import { buildInMemoryDocumentStorage } from '../pipeline/__fixtures__/in-memory-document-storage';
import { ELECTRIFICATION_CONFIG } from './electrification.constants';
import { buildElectrificationDocument } from './extract-plan/__fixtures__/electrification-document.test-fixture';
import { PrepareElectrificationImportService } from './extract-plan/prepare-electrification-import.service';

describe(
  'Import Électrification — parcours complet',
  { timeout: 60_000 },
  () => {
    const catalogue = structuredClone(electrificationConfig);
    const laureats: ElectrificationLaureatsConfig = {
      source: 'Liste synthétique pour le parcours e2e',
      version: 'full-flow-test',
      validFrom: '2000-01-01T00:00:00.000Z',
      validUntil: '2100-01-01T00:00:00.000Z',
      laureats: [],
    };
    const llm = new FakeLlmRepository();
    const storage = buildInMemoryDocumentStorage();
    const queue = { add: vi.fn().mockResolvedValue({ id: 'fake-job' }) };
    let app: INestApplication;
    let db: DatabaseService;
    let router: TrpcRouter;
    let worker: GenerateImportDraftService;
    let repository: AiPlanImportJobRepository;
    let typeId: number;
    let flagEnabled: boolean;
    let existingSource: typeof indicateurSourceTable.$inferSelect | undefined;
    let fixture: Awaited<ReturnType<typeof addTestCollectiviteAndUser>>;
    let support: Awaited<ReturnType<typeof addTestCollectiviteAndUser>>;
    let disableSupport: () => Promise<void>;
    const definitions: number[] = [];
    const user = () => getAuthUserFromUserCredentials(fixture.user);
    const collectiviteId = () => fixture.collectivite.id;
    const status = (jobId: string) =>
      router
        .createCaller({ user: user() })
        .plans.aiImport.getAiImportStatus({ jobId });
    const readJob = async (jobId: string) => {
      const [job] = await db.db
        .select()
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, jobId));
      assert(job);
      return job;
    };
    const readAxes = () =>
      db.db
        .select()
        .from(axeTable)
        .where(eq(axeTable.collectiviteId, collectiviteId()));
    const readFiches = () =>
      db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, collectiviteId()));
    const readValeurs = () =>
      db.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.collectiviteId, collectiviteId()));
    const enqueue = async (
      document: Parameters<typeof buildElectrificationDocument>[0] = {}
    ) => {
      const buffer = await buildElectrificationDocument(document);
      const result = await app.get(EnqueueImportService).enqueue({
        collectiviteId: collectiviteId(),
        user: user(),
        file: {
          buffer,
          filename: 'plan-electrification.docx',
          mimeType: DOCX_MIME,
          size: buffer.length,
        },
        options: {
          profile: AiPlanImportProfileEnum.ELECTRIFICATION,
          origine: 'page',
          planName: 'Plan Électrification synthétique',
          planType: typeId,
          instructions: '',
          withSousActions: true,
          withVerifications: false,
          disabledFields: [],
        },
      });
      assert(result.success, JSON.stringify(result));
      expect(result.data.planId).toBeNull();
      return result.data.jobId;
    };

    beforeAll(async () => {
      app = await getDisposableTestApp({
        overrides: (builder) => {
          builder.overrideProvider(LlmService).useValue(new LlmService(llm));
          builder.overrideProvider(GenerateImportDraftWorker).useValue({});
          builder
            .overrideProvider(getQueueToken(AI_PLAN_IMPORT_QUEUE_NAME))
            .useValue(queue);
          builder.overrideProvider(DocumentStorageService).useValue(storage);
          builder.overrideProvider(ELECTRIFICATION_CONFIG).useValue(catalogue);
          builder
            .overrideProvider(ELECTRIFICATION_LAUREATS_CONFIG)
            .useValue(laureats);
        },
      });
      db = await getTestDatabase(app);
      router = await getTestRouter(app);
      worker = app.get(GenerateImportDraftService);
      repository = app.get(AiPlanImportJobRepository);
      [existingSource] = await db.db
        .select()
        .from(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, ELECTRIFICATION_SOURCE_ID));
      let [type] = await db.db
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
      if (!type) {
        await db.db
          .insert(planActionTypeCategorieTable)
          .values({ categorie: ELECTRIFICATION_PLAN_TYPE_KEY.categorie })
          .onConflictDoNothing();
        [type] = await db.db
          .insert(planActionTypeTable)
          .values(ELECTRIFICATION_PLAN_TYPE_KEY)
          .returning();
      }
      typeId = type.id;
      for (const engagement of catalogue.engagements) {
        for (const cible of engagement.cibles) {
          cible.identifiantReferentiel = `full-flow-${randomUUID()}`;
          cible.periodicite = 'annuelle';
          cible.validation = 'validated';
          const [definition] = await db.db
            .insert(indicateurDefinitionTable)
            .values({
              identifiantReferentiel: cible.identifiantReferentiel,
              titre: `Cible synthétique ${engagement.code}`,
              unite: cible.unite,
              periodicite: 'annuelle',
            })
            .returning();
          definitions.push(definition.id);
        }
      }
      catalogue.sousAxes = [];
      catalogue.fiches = { actions: [], indicateurs: [] };
      support = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
      });
      const supportUser = getAuthUserFromUserCredentials(support.user);
      ({ cleanup: disableSupport } = await addAndEnableUserSuperAdminMode({
        app,
        caller: router.createCaller({ user: supportUser }),
        userId: supportUser.id,
      }));
    });

    beforeEach(async () => {
      fixture = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.EDITION },
      });
      laureats.laureats = [
        {
          reference: `laureat-${collectiviteId()}`,
          collectiviteId: collectiviteId(),
        },
      ];
      catalogue.fiches = { actions: [], indicateurs: [] };
      flagEnabled = true;
      queue.add.mockClear();
      vi.spyOn(app.get(TrackingService), 'capture').mockImplementation(
        () => undefined
      );
      vi.spyOn(app.get(TrackingService), 'isFeatureEnabled').mockImplementation(
        async (key) =>
          key === 'is-electrification-plan-creation-enabled' && flagEnabled
      );
      vi.spyOn(
        app.get(ImportPlanService),
        'notifyCreatedFiches'
      ).mockResolvedValue(undefined);
      vi.spyOn(
        app.get(NotifyPlanImportedService),
        'notifyPlanImported'
      ).mockResolvedValue(failure('DATABASE_ERROR'));
      vi.spyOn(llm, 'complete');
      vi.spyOn(llm, 'chat');
    });

    afterEach(async () => {
      vi.restoreAllMocks();
      const axes = await readAxes();
      const metadataIds = axes.flatMap((axe) =>
        axe.indicateurSourceMetadonneeId === null
          ? []
          : [axe.indicateurSourceMetadonneeId]
      );
      const fiches = db.db
        .select({ id: ficheActionTable.id })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, collectiviteId()));
      await db.db
        .delete(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.collectiviteId, collectiviteId()));
      await db.db.delete(ficheActionAxeTable).where(
        or(
          inArray(ficheActionAxeTable.ficheId, fiches),
          inArray(
            ficheActionAxeTable.axeId,
            axes.map(({ id }) => id)
          )
        )
      );
      await db.db.delete(axeIndicateurTable).where(
        inArray(
          axeIndicateurTable.axeId,
          axes.map(({ id }) => id)
        )
      );
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, collectiviteId()));
      await db.db
        .delete(axeTable)
        .where(eq(axeTable.collectiviteId, collectiviteId()));
      await db.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.collectiviteId, collectiviteId()));
      if (metadataIds.length)
        await db.db
          .delete(indicateurSourceMetadonneeTable)
          .where(inArray(indicateurSourceMetadonneeTable.id, metadataIds));
      await db.db
        .delete(bibliothequeFichierTable)
        .where(eq(bibliothequeFichierTable.collectiviteId, collectiviteId()));
      await fixture.cleanup();
    });

    afterAll(async () => {
      await db.db
        .delete(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, definitions));
      if (existingSource)
        await db.db
          .update(indicateurSourceTable)
          .set(existingSource)
          .where(eq(indicateurSourceTable.id, existingSource.id));
      else
        await db.db
          .delete(indicateurSourceTable)
          .where(eq(indicateurSourceTable.id, ELECTRIFICATION_SOURCE_ID));
      await disableSupport();
      await support.cleanup();
      await app.close();
    });

    test('expose un message lisible et un diagnostic stable quand le document source a disparu', async () => {
      const jobId = await enqueue();
      const job = await readJob(jobId);
      await storage.removeDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: job.sourcePath,
      });

      await worker.generate(jobId);

      expect(await status(jobId)).toMatchObject({
        status: 'failed',
        createdPlanId: null,
        error: 'Document source illisible depuis le stockage',
        report: {
          issues: [
            {
              kind: 'processing-error',
              code: 'SOURCE_UNREADABLE',
              message: 'Document source illisible depuis le stockage',
            },
          ],
        },
      });
      expect(await readAxes()).toEqual([]);
      expect(llm.complete).not.toHaveBeenCalled();
      expect(llm.chat).not.toHaveBeenCalled();
    });

    test('crée le plan après admission malgré la fermeture du flag, conserve le compte rendu et ne crée aucun doublon', async () => {
      const jobId = await enqueue({ cibleGaz: '' });
      expect(await readAxes()).toEqual([]);
      expect(await readJob(jobId)).toMatchObject({
        status: 'pending',
        createdPlanId: null,
      });
      flagEnabled = false;
      let committedAtNotification = false;
      const notification = vi
        .mocked(app.get(NotifyPlanImportedService).notifyPlanImported)
        .mockImplementation(async ({ planId }) => {
          const job = await readJob(jobId);
          committedAtNotification =
            job.status === 'done' &&
            job.createdPlanId === planId &&
            (await readAxes()).some(({ id }) => id === planId);
          return failure('DATABASE_ERROR');
        });

      await worker.generate(jobId);

      const done = await status(jobId);
      expect(done).toMatchObject({
        status: 'done',
        profile: AiPlanImportProfileEnum.ELECTRIFICATION,
        resumable: false,
        error: null,
        createdPlanId: expect.any(Number),
        report: {
          issues: expect.arrayContaining([
            expect.objectContaining({
              kind: 'warning',
              location: expect.any(String),
            }),
          ]),
        },
      });
      const plan = (await readAxes()).find(({ parent }) => parent === null);
      expect(plan).toMatchObject({
        id: done.createdPlanId,
        typeId,
        status: PlanStatusEnum.TO_VERIFY,
        source: 'import_ia',
      });
      expect(await readFiches()).toHaveLength(1);
      expect(await readValeurs()).toMatchObject([
        {
          objectif: 0,
          resultat: null,
          metadonneeId: plan?.indicateurSourceMetadonneeId,
        },
      ]);
      expect(notification).toHaveBeenCalledOnce();
      expect(committedAtNotification).toBe(true);
      const capture = vi.mocked(app.get(TrackingService).capture);
      for (const event of [
        'plans:import-ia:started',
        'plans:import-ia:succeeded',
      ]) {
        expect(capture).toHaveBeenCalledWith({
          distinctId: user().id,
          event,
          properties: expect.objectContaining({ jobId, origine: 'page' }),
          groups: { collectivite: String(collectiviteId()) },
        });
      }
      expect(capture).toHaveBeenCalledWith({
        distinctId: user().id,
        event: 'plans:import-ia:step_done',
        properties: expect.objectContaining({
          jobId,
          origine: 'page',
          step: 'persistence',
          status: 'ok',
        }),
        groups: { collectivite: String(collectiviteId()) },
      });
      expect(llm.complete).not.toHaveBeenCalled();
      expect(llm.chat).not.toHaveBeenCalled();
      const before = await readAxes();

      expect((await worker.generate(jobId)).success).toBe(false);
      await repository.purgeFailedCheckpoints(collectiviteId());

      expect(await readAxes()).toEqual(before);
      expect((await status(jobId)).report).toEqual(done.report);
      expect(notification).toHaveBeenCalledOnce();
    });

    test.each([
      { metrics: 'conservées', missingMetrics: false },
      { metrics: 'perdues après le checkpoint', missingMetrics: true },
    ])(
      'reprend sans source ni nouvel appel IA, avec les métriques $metrics',
      async ({ missingMetrics }) => {
        const complete = vi.mocked(llm.complete).mockResolvedValue({
          success: true,
          data: {
            completed: true,
            text: JSON.stringify({
              values: [
                {
                  key: 'rapides',
                  number: '20',
                  unit: null,
                  year: null,
                  quote: '20 bornes rapides',
                },
                {
                  key: 'total',
                  number: '100',
                  unit: null,
                  year: null,
                  quote: 'un total de 100',
                },
              ],
            }),
            usage: {
              promptTokens: 12,
              cachedTokens: 0,
              candidatesTokens: 8,
              thoughtsTokens: 0,
              totalTokens: 20,
            },
          },
        });
        const jobId = await enqueue({
          fields: {
            "Code de l'action de référence ou URL de l'action (facultatif)":
              'action-manquante',
          },
          cibleRecharge: '20 bornes rapides sur un total de 100',
        });

        await worker.generate(jobId);

        expect(await readAxes()).toEqual([]);
        const failed = await status(jobId);
        expect(failed).toMatchObject({
          status: 'failed',
          createdPlanId: null,
          resumable: true,
          report: {
            issues: expect.arrayContaining([
              expect.objectContaining({
                kind: 'document-error',
                location: expect.any(String),
              }),
            ]),
          },
        });
        const job = await readJob(jobId);
        expect(job.checkpoint).toMatchObject({
          profile: AiPlanImportProfileEnum.ELECTRIFICATION,
          tokens: { totalTokens: 20 },
          interpretations: [expect.any(Object)],
        });
        expect(
          (
            await storage.downloadDocument({
              bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
              key: job.sourcePath,
            })
          ).success
        ).toBe(false);
        expect(complete).toHaveBeenCalledOnce();
        if (missingMetrics) {
          // Simule un arrêt après saveCheckpoint, avant l'enregistrement des métriques.
          await db.db
            .delete(aiPlanImportStepRunTable)
            .where(
              and(
                eq(aiPlanImportStepRunTable.jobId, jobId),
                eq(aiPlanImportStepRunTable.step, 'extraction')
              )
            );
          await db.db
            .update(aiPlanImportJobTable)
            .set({ stats: null })
            .where(eq(aiPlanImportJobTable.id, jobId));
        }
        catalogue.fiches = {
          actions: [
            {
              code: 'action-manquante',
              validation: 'validated',
              axeNumero: 1,
              sousAxeNumero: null,
              champs: { titre: 'Action disponible' },
              sousActions: [],
              indicateurCodes: [],
            },
          ],
          indicateurs: [],
        };
        flagEnabled = false;
        await router
          .createCaller({ user: getAuthUserFromUserCredentials(support.user) })
          .plans.aiImport.resumeAiImport({ jobId });

        await worker.generate(jobId);

        expect(await status(jobId)).toMatchObject({
          status: 'done',
          resumable: false,
          createdPlanId: expect.any(Number),
        });
        const capture = vi.mocked(app.get(TrackingService).capture);
        expect(capture).toHaveBeenCalledWith({
          distinctId: getAuthUserFromUserCredentials(support.user).id,
          event: 'plans:import-ia:resume_requested',
          properties: expect.objectContaining({
            jobId,
            origine: 'page',
            attempt: 0,
          }),
          groups: { collectivite: String(collectiviteId()) },
        });
        expect(capture).toHaveBeenCalledWith({
          distinctId: user().id,
          event: 'plans:import-ia:resumed',
          properties: expect.objectContaining({
            jobId,
            origine: 'page',
            attempt: 1,
          }),
          groups: { collectivite: String(collectiviteId()) },
        });
        expect(await readJob(jobId)).toMatchObject({
          attempt: 1,
          stats: {
            llm: {
              calls: missingMetrics ? 0 : 1,
              tokens: {
                promptTokens: 12,
                candidatesTokens: 8,
                totalTokens: 20,
              },
            },
          },
        });
        if (missingMetrics) {
          expect((await readJob(jobId)).stats?.llm.models).toEqual([]);
        }
        expect(await readFiches()).toHaveLength(1);
        expect(
          (await readValeurs())
            .map(({ objectif }) => objectif)
            .sort((a, b) => (a ?? 0) - (b ?? 0))
        ).toEqual([0, 20, 100]);
        expect(complete).toHaveBeenCalledOnce();
        expect(llm.chat).not.toHaveBeenCalled();
      }
    );

    test('annule plan, cibles et liens aux fiches existantes lorsque markDone échoue', async () => {
      const [existing] = await db.db
        .insert(ficheActionTable)
        .values({
          collectiviteId: collectiviteId(),
          titre: 'Action préexistante',
          description: 'À préserver',
        })
        .returning();
      const jobId = await enqueue({
        fields: {
          "Code de l'action de référence ou URL de l'action (facultatif)": `https://app.territoiresentransitions.fr/collectivite/${collectiviteId()}/plans/fiches/${
            existing.id
          }`,
        },
      });
      vi.spyOn(repository, 'markDone').mockResolvedValueOnce(
        failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR)
      );

      await worker.generate(jobId);

      expect(await readAxes()).toEqual([]);
      expect(await readValeurs()).toEqual([]);
      expect(await readFiches()).toEqual([existing]);
      expect(
        await db.db
          .select()
          .from(ficheActionAxeTable)
          .where(eq(ficheActionAxeTable.ficheId, existing.id))
      ).toEqual([]);
      expect(await status(jobId)).toMatchObject({
        status: 'failed',
        createdPlanId: null,
        resumable: true,
      });
      expect(
        app.get(NotifyPlanImportedService).notifyPlanImported
      ).not.toHaveBeenCalled();
      expect(
        app.get(ImportPlanService).notifyCreatedFiches
      ).not.toHaveBeenCalled();
    });

    test.each(['absent', 'différent'])(
      'refuse la reprise quand le type enregistré est %s, sans modifier le job ni le remettre en file',
      async (type) => {
        const jobId = await enqueue();
        const admitted = await readJob(jobId);
        await db.db
          .update(aiPlanImportJobTable)
          .set({
            status: 'failed',
            options: {
              ...admitted.options,
              planType: type === 'absent' ? undefined : typeId + 100000,
            },
          })
          .where(eq(aiPlanImportJobTable.id, jobId));
        const before = await readJob(jobId);
        queue.add.mockClear();

        await expect(
          router
            .createCaller({
              user: getAuthUserFromUserCredentials(support.user),
            })
            .plans.aiImport.resumeAiImport({ jobId })
        ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });

        expect(await readJob(jobId)).toEqual(before);
        expect(await readAxes()).toEqual([]);
        expect(queue.add).not.toHaveBeenCalled();
        expect(llm.complete).not.toHaveBeenCalled();
        expect(llm.chat).not.toHaveBeenCalled();
      }
    );

    test('revérifie les droits entre préparation et transaction', async () => {
      const jobId = await enqueue();
      const preparation = app.get(PrepareElectrificationImportService);
      const prepare = preparation.prepare.bind(preparation);
      vi.spyOn(preparation, 'prepare').mockImplementationOnce(
        async (...args) => {
          const result = await prepare(...args);
          assert(result.success, JSON.stringify(result));
          await db.db
            .update(utilisateurCollectiviteAccessTable)
            .set({ role: CollectiviteRole.LECTURE })
            .where(
              and(
                eq(
                  utilisateurCollectiviteAccessTable.collectiviteId,
                  collectiviteId()
                ),
                eq(utilisateurCollectiviteAccessTable.userId, user().id)
              )
            );
          return result;
        }
      );

      await worker.generate(jobId);

      expect(await readAxes()).toEqual([]);
      expect(await readFiches()).toEqual([]);
      expect(await readValeurs()).toEqual([]);
      expect(await readJob(jobId)).toMatchObject({
        status: 'failed',
        createdPlanId: null,
      });
      expect(
        app.get(NotifyPlanImportedService).notifyPlanImported
      ).not.toHaveBeenCalled();
    });

    test('un ancien attempt ne valide ni ne met en échec le nouveau job', async () => {
      const jobId = await enqueue();
      const markDone = repository.markDone.bind(repository);
      vi.spyOn(repository, 'markDone').mockImplementationOnce(async (input) => {
        await db.db
          .update(aiPlanImportJobTable)
          .set({ attempt: input.attempt + 1, status: 'pending' })
          .where(eq(aiPlanImportJobTable.id, jobId));
        return markDone(input);
      });

      await worker.generate(jobId);
      await worker.recordTerminalFailure(jobId, 'Échec du worker précédent', 0);

      expect(await readAxes()).toEqual([]);
      expect(await readFiches()).toEqual([]);
      expect(await readValeurs()).toEqual([]);
      expect(await readJob(jobId)).toMatchObject({
        status: 'pending',
        attempt: 1,
        createdPlanId: null,
        error: null,
      });
      const current = await readJob(jobId);
      expect(
        (
          await storage.downloadDocument({
            bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
            key: current.sourcePath,
          })
        ).success
      ).toBe(true);
      expect(
        app.get(NotifyPlanImportedService).notifyPlanImported
      ).not.toHaveBeenCalled();
    });

    test('une exception de notification laisse le plan réussi et ne relance pas sa création', async () => {
      const jobId = await enqueue();
      vi.mocked(
        app.get(NotifyPlanImportedService).notifyPlanImported
      ).mockRejectedValueOnce(new Error('Notification indisponible'));

      await worker.generate(jobId);

      expect(await status(jobId)).toMatchObject({
        status: 'done',
        createdPlanId: expect.any(Number),
      });
      const before = await readAxes();
      await worker.generate(jobId);
      expect(await readAxes()).toEqual(before);
      expect(await readFiches()).toHaveLength(1);
    });

    test('garde source et checkpoint si le catalogue déployé ne correspond plus au job admis', async () => {
      const jobId = await enqueue({
        fields: {
          "Code de l'action de référence ou URL de l'action (facultatif)":
            'action-inconnue',
        },
      });
      const queued = await readJob(jobId);
      const source = await storage.downloadDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: queued.sourcePath,
      });
      assert(source.success);
      await worker.generate(jobId);
      const failed = await readJob(jobId);
      assert(failed.checkpoint);
      await storage.storeDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: queued.sourcePath,
        content: source.data.buffer,
        contentType: source.data.mimeType,
      });
      // Reprise déjà en file avant qu'une nouvelle version soit déployée.
      await db.db
        .update(aiPlanImportJobTable)
        .set({ status: 'pending', attempt: 1 })
        .where(eq(aiPlanImportJobTable.id, jobId));
      const admittedCatalogueVersion = catalogue.version;
      catalogue.version = `${admittedCatalogueVersion}-updated`;
      try {
        await worker.generate(jobId);
      } finally {
        catalogue.version = admittedCatalogueVersion;
      }

      expect(await readJob(jobId)).toMatchObject({
        status: 'failed',
        createdPlanId: null,
        checkpoint: failed.checkpoint,
      });
      expect(await readAxes()).toEqual([]);
      expect(
        (
          await storage.downloadDocument({
            bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
            key: queued.sourcePath,
          })
        ).success
      ).toBe(true);
      expect(llm.complete).not.toHaveBeenCalled();
      expect(llm.chat).not.toHaveBeenCalled();
    });
  }
);
