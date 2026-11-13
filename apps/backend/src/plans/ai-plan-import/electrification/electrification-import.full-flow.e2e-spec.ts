import { annexeTable } from '@tet/backend/collectivites/documents/models/annexe.table';
import {
  electrificationCatalogueFixture as electrificationConfig,
  buildInMemoryElectrificationData,
} from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-data.test-fixture';
import { ElectrificationDataService } from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-data.service';
import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
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
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { failure, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  ELECTRIFICATION_PLAN_TYPE_KEY,
  ElectrificationConfig,
  ElectrificationEngagementCodeEnum as EngagementCode,
  ElectrificationLaureatsConfig,
  PlanStatusEnum,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
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
import { buildElectrificationDocument } from './extract-plan/__fixtures__/electrification-document.test-fixture';
import { PrepareElectrificationImportService } from './extract-plan/prepare-electrification-import.service';

describe(
  'Import Électrification — parcours complet',
  { timeout: 60_000 },
  () => {
    const catalogue = structuredClone(electrificationConfig);
    const data = buildInMemoryElectrificationData({
      catalogue: () => catalogue,
      laureats: () => laureats,
    });
    const laureats: ElectrificationLaureatsConfig = {
      source: 'Liste synthétique pour le parcours e2e',
      version: 'full-flow-test',
      validFrom: '2000-01-01T00:00:00.000Z',
      validUntil: '2100-01-01T00:00:00.000Z',
      laureats: [],
    };
    const llm = new FakeLlmRepository();
    const storage = buildInMemoryDocumentStorage();
    const uploadedObjects: { id: string; bucketId: string; key: string }[] = [];
    const queue = { add: vi.fn().mockResolvedValue({ id: 'fake-job' }) };
    let app: INestApplication;
    let db: DatabaseService;
    let router: TrpcRouter;
    let worker: GenerateImportDraftService;
    let repository: AiPlanImportJobRepository;
    let typeId: number;
    let validatedCatalogue: ElectrificationConfig;
    let flagEnabled: boolean;
    let fixture: Awaited<ReturnType<typeof addTestCollectiviteAndUser>>;
    let support: Awaited<ReturnType<typeof addTestCollectiviteAndUser>>;
    let disableSupport: () => Promise<void>;
    const definitions: number[] = [];
    const qualitativeEngagements = [
      {
        libelle:
          "Le territoire s'engage à travailler à un décommissionnement de certaines portions du réseau de gaz.",
      },
      {
        libelle:
          "Le territoire s'engage à identifier un site clés en main pour l'installation de stations de recharge de poids lourds électriques.",
      },
    ];
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
      document: Parameters<typeof buildElectrificationDocument>[0] = {},
      requester = user()
    ) => {
      const buffer = await buildElectrificationDocument(document);
      const result = await app.get(EnqueueImportService).enqueue({
        collectiviteId: collectiviteId(),
        user: requester,
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
          builder.overrideProvider(ElectrificationDataService).useValue(data);
        },
      });
      db = await getTestDatabase(app);
      router = await getTestRouter(app);
      worker = app.get(GenerateImportDraftService);
      repository = app.get(AiPlanImportJobRepository);
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
      assert(type, 'La migration doit créer le type Plan Électrification');
      typeId = type.id;
      for (const engagement of catalogue.engagements) {
        for (const cible of engagement.cibles) {
          cible.identifiantReferentiel = `full-flow-${randomUUID()}`;
          cible.periodicite = 'annuelle';
          cible.validation = 'validated';
          assert(cible.unite);
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
      validatedCatalogue = structuredClone(catalogue);
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
      uploadedObjects.length = 0;
      // La bibliothèque utilise Supabase directement ; le worker utilise DocumentStorageService.
      vi.spyOn(app.get(SupabaseService), 'saveInStorage').mockImplementation(
        async ({ bucket, path, file, mimeType }) => {
          assert(Buffer.isBuffer(file));
          const contentType = mimeType ?? 'application/octet-stream';
          const stored = await storage.storeDocument({
            bucketId: bucket,
            key: path,
            content: file,
            contentType,
          });
          assert(stored.success);
          const metadata = { mimetype: contentType, size: file.length };
          // Simule uniquement les métadonnées écrites par l'API Storage.
          const {
            rows: [object],
          } = await db.db.execute<{ id: string }>(sql`
            insert into ${storageObjectTable} (bucket_id, name, metadata)
            values (${bucket}, ${path}, ${JSON.stringify(metadata)}::jsonb)
            returning ${storageObjectTable.id}
          `);
          assert(object);
          uploadedObjects.push({ id: object.id, bucketId: bucket, key: path });
          return success({
            id: object.id,
            path,
            fullPath: `${bucket}/${path}`,
          });
        }
      );
      // Le parcours ne dépend pas des jobs en cours hors de cette application de test.
      vi.spyOn(repository, 'countInFlight').mockResolvedValue(success(0));
      fixture = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.EDITION },
      });
      laureats.laureats = [
        {
          reference: `laureat-${collectiviteId()}`,
          collectiviteId: collectiviteId(),
        },
      ];
      Object.assign(catalogue, structuredClone(validatedCatalogue));
      data.catalogues.clear();
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
      if (uploadedObjects.length) {
        await db.db.transaction(async (tx) => {
          // Ces objets synthétiques n'ont aucun fichier dans le Storage externe.
          await tx.execute(sql`set local storage.allow_delete_query = 'true'`);
          await tx.delete(storageObjectTable).where(
            inArray(
              storageObjectTable.id,
              uploadedObjects.map(({ id }) => id)
            )
          );
        });
        for (const object of uploadedObjects)
          await storage.removeDocument(object);
      }
      await fixture.cleanup();
    });

    afterAll(async () => {
      await db.db
        .delete(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, definitions));
      // La source est partagée entre suites ; seules nos métadonnées sont nettoyées.
      await disableSupport();
      await support.cleanup();
      await app.close();
    });

    test('importe pour un non-lauréat en mode super-admin, sans changer la liste des lauréats', async () => {
      laureats.laureats = [];
      const requester = getAuthUserFromUserCredentials(support.user);
      const isProfileAvailable = async (requester: ReturnType<typeof user>) => {
        const { profiles } = await router
          .createCaller({ user: requester })
          .plans.aiImport.getAiImportCapabilities({
            collectiviteId: collectiviteId(),
          });
        return profiles.find(
          ({ profile }) => profile === AiPlanImportProfileEnum.ELECTRIFICATION
        )?.available;
      };
      expect(await isProfileAvailable(user())).toBe(false);
      expect(await isProfileAvailable(requester)).toBe(true);
      flagEnabled = false;
      expect(await isProfileAvailable(requester)).toBe(false);
      flagEnabled = true;

      const jobId = await enqueue({}, requester);
      await worker.generate(jobId);

      expect(await status(jobId)).toMatchObject({
        status: 'done',
        createdPlanId: expect.any(Number),
      });
      expect((await readJob(jobId)).options.eligibility).toMatchObject({
        eligible: true,
        laureatReference: null,
      });
      expect(laureats.laureats).toEqual([]);
      expect(llm.complete).not.toHaveBeenCalled();
      expect(llm.chat).not.toHaveBeenCalled();
    });

    test('importe les engagements sans cible et les compléments disponibles du catalogue malgré les autres correspondances en attente', async () => {
      Object.assign(catalogue, structuredClone(electrificationConfig));
      const jobId = await enqueue({
        engagements: qualitativeEngagements,
        fields: {
          'Sous-axe (facultatif)': '1.4',
          "Code de l'action de référence ou URL de l'action (facultatif)":
            '1.4.1',
        },
      });

      await worker.generate(jobId);

      expect(await status(jobId)).toMatchObject({
        status: 'done',
        createdPlanId: expect.any(Number),
      });
      const fiches = await readFiches();
      expect(fiches).toHaveLength(6);
      expect(fiches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            referenceKind: 'action',
            referenceCode: '1.4.1',
            titre: 'Action synthétique',
          }),
          ...[
            EngagementCode.DECOMMISSIONNEMENT_RESEAU_GAZ,
            EngagementCode.SITE_RECHARGE_POIDS_LOURDS,
          ].map((code) =>
            expect.objectContaining({
              referenceKind: 'engagement',
              referenceCode: code,
            })
          ),
          ...[
            'sous-action-test-1',
            'sous-action-test-2',
            'sous-action-test-3',
          ].map((code) =>
            expect.objectContaining({
              referenceKind: 'sous_action',
              referenceCode: code,
              referenceParentCode: '1.4.1',
            })
          ),
        ])
      );
      expect(await readValeurs()).toEqual([]);
      expect(llm.complete).not.toHaveBeenCalled();
      expect(llm.chat).not.toHaveBeenCalled();
    });

    test.each([
      {
        reference: 'complément indicateur automatique',
        issue: 'FICHES_CONFIG_UNAVAILABLE',
      },
      {
        reference: 'cible de l’engagement sélectionné',
        issue: 'UNVALIDATED_ENGAGEMENT_INDICATEUR',
      },
    ])(
      'refuse le $reference en attente sans créer le plan, les fiches ou les valeurs',
      async ({ issue }) => {
        Object.assign(catalogue, structuredClone(electrificationConfig));
        const pendingEngagement = issue === 'UNVALIDATED_ENGAGEMENT_INDICATEUR';
        if (pendingEngagement) {
          // Une définition TeT existe, mais sa correspondance reste à valider.
          catalogue.engagements[0].cibles[0].identifiantReferentiel =
            validatedCatalogue.engagements[0].cibles[0].identifiantReferentiel;
        }
        const jobId = await enqueue({
          engagements: pendingEngagement ? undefined : qualitativeEngagements,
          fields: {
            'Sous-axe (facultatif)': pendingEngagement ? '1.4' : '1.1',
            "Code de l'action de référence ou URL de l'action (facultatif)":
              pendingEngagement ? '1.4.1' : '1.1.2',
          },
        });

        await worker.generate(jobId);

        expect(await status(jobId)).toMatchObject({
          status: 'failed',
          createdPlanId: null,
          report: {
            issues: expect.arrayContaining([
              expect.objectContaining({
                kind: 'configuration-error',
                code: issue,
              }),
            ]),
          },
        });
        expect(await readAxes()).toEqual([]);
        expect(await readFiches()).toEqual([]);
        expect(await readValeurs()).toEqual([]);
        expect(llm.complete).not.toHaveBeenCalled();
        expect(llm.chat).not.toHaveBeenCalled();
      }
    );

    test.each([
      {
        name: 'année de référence du résultat numérique',
        document: {
          indicateurs: [
            { titre: 'Nombre de bâtiments rénovés', resultat: '12' },
          ],
        },
        code: 'MISSING_INDICATEUR_YEAR',
        location:
          'Action "Action synthétique" > Indicateur "Nombre de bâtiments rénovés" > Valeur de résultat (avec son année de référence)',
      },
      {
        name: 'année de référence du résultat oui/non',
        document: {
          indicateurs: [{ titre: 'Étude réalisée (oui/non)', resultat: 'Oui' }],
        },
        code: 'MISSING_INDICATEUR_YEAR',
        location:
          'Action "Action synthétique" > Indicateur "Étude réalisée (oui/non)" > Valeur de résultat (avec son année de référence)',
      },
      {
        name: 'date de début de l’action',
        document: { fields: { 'Date de début prévisionnelle': '2026' } },
        code: 'INVALID_ELECTRIFICATION_DATE',
        location: 'Action "Action synthétique" > Date de début prévisionnelle',
      },
      {
        name: 'date de fin de la sous-action',
        document: {
          sousActions: [{ titre: 'Commander les travaux', dateFin: '2026' }],
        },
        code: 'INVALID_ELECTRIFICATION_DATE',
        location:
          'Action "Action synthétique" > Sous-action "Commander les travaux" > Date de fin',
      },
    ])(
      'identifie le champ à corriger : $name, sans création ni appel IA',
      async ({ document, code, location }) => {
        const jobId = await enqueue(document);

        await worker.generate(jobId);

        const failed = await status(jobId);
        expect(failed).toMatchObject({
          status: 'failed',
          createdPlanId: null,
          report: { issues: [{ kind: 'document-error', code, location }] },
        });
        const capture = vi.mocked(app.get(TrackingService).capture);
        const failureEvents = capture.mock.calls
          .map(([event]) => event)
          .filter(({ event }) => event === 'plans:import-ia:failed');
        expect(failureEvents).toHaveLength(1);
        expect(failureEvents[0]).toMatchObject({
          properties: {
            jobId,
            profile: AiPlanImportProfileEnum.ELECTRIFICATION,
            catalogueVersion: catalogue.version,
            issueKinds: 'document-error',
          },
          groups: { collectivite: String(collectiviteId()) },
        });
        expect(failureEvents[0].properties).not.toHaveProperty('error');
        expect(JSON.stringify(failureEvents)).not.toContain(
          failed.report.issues[0].message
        );
        if (code === 'MISSING_INDICATEUR_YEAR') {
          expect(failed.report.issues[0].message).toContain(
            "L'année de référence de cette valeur est absente"
          );
        }
        expect(await readAxes()).toEqual([]);
        expect(await readFiches()).toEqual([]);
        expect(await readValeurs()).toEqual([]);
        expect(llm.complete).not.toHaveBeenCalled();
        expect(llm.chat).not.toHaveBeenCalled();
      }
    );

    test('résout le code de l’action et crée ses sous-actions et documents malgré une aide sans URL', async () => {
      catalogue.fiches.actions = [
        {
          code: '6.1.1',
          validation: 'validated',
          axeNumero: 6,
          sousAxeNumero: null,
          champs: { titre: 'Inventaire des bornes' },
          sousActions: [
            {
              code: 'inventaire-existant',
              champs: { titre: 'Recenser les bornes existantes' },
            },
          ],
          indicateurCodes: [],
          aides: [
            { titre: 'ChargeFrance', url: null },
            { titre: 'Aide liée', url: 'https://example.org/recharge' },
          ],
        },
      ];
      const jobId = await enqueue({
        cibleRecharge: '40 bornes dont 10 rapides',
        fields: {
          Axe: '6',
          "Code de l'action de référence ou URL de l'action (facultatif)":
            '6.1.1',
        },
      });

      await worker.generate(jobId);

      const done = await status(jobId);
      expect(done, JSON.stringify(done.report)).toMatchObject({
        status: 'done',
        createdPlanId: expect.any(Number),
      });
      expect(done.report.issues).toContainEqual(
        expect.objectContaining({
          kind: 'warning',
          code: 'AIDE_WITHOUT_URL_IGNORED',
          location: expect.stringContaining('ChargeFrance'),
          message: expect.stringContaining("l'action peut être importée"),
        })
      );
      const fiches = await readFiches();
      const action = fiches.find(
        ({ referenceCode }) => referenceCode === '6.1.1'
      );
      assert(action);
      expect(fiches).toContainEqual(
        expect.objectContaining({
          parentId: action.id,
          titre: 'Recenser les bornes existantes',
        })
      );
      const documents = await db.db
        .select()
        .from(annexeTable)
        .where(eq(annexeTable.ficheId, action.id));
      expect(documents).toMatchObject([
        { titre: 'Aide liée', url: 'https://example.org/recharge' },
      ]);
      expect(llm.complete).not.toHaveBeenCalled();
      expect(llm.chat).not.toHaveBeenCalled();
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

    test('situe un sous-axe inconnu dans son action et précise comment le corriger', async () => {
      const jobId = await enqueue({
        fields: { 'Sous-axe (facultatif)': '1.999 Quartier' },
      });

      await worker.generate(jobId);

      expect(await status(jobId)).toMatchObject({
        status: 'failed',
        createdPlanId: null,
        report: {
          issues: [
            expect.objectContaining({
              code: 'UNKNOWN_SUB_AXIS',
              location:
                'Action "Action synthétique" > Sous-axe "1.999 - Quartier"',
              message: expect.stringContaining(
                "Vérifiez le numéro dans le champ Sous-axe de l'action"
              ),
            }),
          ],
        },
      });
      expect(await readAxes()).toEqual([]);
      expect(await readFiches()).toEqual([]);
      expect(llm.complete).not.toHaveBeenCalled();
      expect(llm.chat).not.toHaveBeenCalled();
    });

    test('crée le plan après admission malgré la fermeture du flag, conserve le compte rendu et ne crée aucun doublon', async () => {
      const jobId = await enqueue({ cibleGaz: '' });
      expect(await readAxes()).toEqual([]);
      expect(await readJob(jobId)).toMatchObject({
        status: 'pending',
        createdPlanId: null,
        stepStates: {
          reading: 'pending',
          extraction: 'pending',
          scouting: 'skipped',
          hierarchy: 'skipped',
          scoring: 'skipped',
          consolidation: 'skipped',
          enrichment: 'skipped',
          secteurs: 'skipped',
          qualitativeReview: 'skipped',
        },
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
        status: PlanStatusEnum.ACTIVE,
        source: 'import_ia',
        verifiedAt: null,
        verifiedBy: null,
      });
      assert(plan?.indicateurSourceMetadonneeId);
      const [metadata] = await db.db
        .select()
        .from(indicateurSourceMetadonneeTable)
        .where(
          eq(
            indicateurSourceMetadonneeTable.id,
            plan.indicateurSourceMetadonneeId
          )
        );
      expect(metadata).toMatchObject({
        nomDonnees: 'Engagement pris dans votre convention',
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
          properties: expect.objectContaining({
            jobId,
            origine: 'page',
            profile: AiPlanImportProfileEnum.ELECTRIFICATION,
            catalogueVersion: catalogue.version,
            attempt: 0,
          }),
          groups: { collectivite: String(collectiviteId()) },
        });
      }
      expect(capture).toHaveBeenCalledWith({
        distinctId: user().id,
        event: 'plans:import-ia:step_done',
        properties: expect.objectContaining({
          jobId,
          origine: 'page',
          profile: AiPlanImportProfileEnum.ELECTRIFICATION,
          catalogueVersion: catalogue.version,
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
      const succeeded = capture.mock.calls
        .map(([event]) => event)
        .filter(({ event }) => event === 'plans:import-ia:succeeded');
      expect(succeeded).toHaveLength(1);
      expect(succeeded[0].properties).toMatchObject({
        planId: done.createdPlanId,
        llmCalls: 0,
      });
      for (const [event] of capture.mock.calls) {
        expect(event.properties).not.toHaveProperty('planName');
        expect(event.properties).not.toHaveProperty('instructions');
      }
    });

    test.each([
      { metrics: 'conservées', missingMetrics: false },
      { metrics: 'perdues après le checkpoint', missingMetrics: true },
    ])(
      'reprend avec la publication admise sans source ni nouvel appel IA, avec les métriques $metrics',
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
        catalogue.fiches = {
          actions: [
            {
              code: 'action-publiee',
              validation: 'validated',
              axeNumero: 1,
              sousAxeNumero: null,
              champs: { titre: 'Action disponible' },
              aides: [],
              sousActions: [],
              indicateurCodes: [],
            },
          ],
          indicateurs: [],
        };
        vi.spyOn(repository, 'markDone').mockResolvedValueOnce(
          failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR)
        );
        const jobId = await enqueue({
          fields: {
            "Code de l'action de référence ou URL de l'action (facultatif)":
              'action-publiee',
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
                kind: 'processing-error',
                code: 'ELECTRIFICATION_PERSISTENCE_FAILED',
              }),
            ]),
          },
        });
        const job = await readJob(jobId);
        expect(job.checkpoint).toMatchObject({
          profile: AiPlanImportProfileEnum.ELECTRIFICATION,
          tokens: { totalTokens: 20 },
          interpretations: [expect.any(Object)],
          sources: expect.arrayContaining([
            expect.objectContaining({
              location: expect.stringMatching(
                /^Tableau \d+, ligne \d+, cellule \d+$/
              ),
            }),
          ]),
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
        data.catalogues.set(catalogue.version, structuredClone(catalogue));
        catalogue.version = `${catalogue.version}-next`;
        catalogue.fiches.actions = [];
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
            profile: AiPlanImportProfileEnum.ELECTRIFICATION,
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
            profile: AiPlanImportProfileEnum.ELECTRIFICATION,
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

    test.each(['catalogue indisponible', 'lauréat retiré'])(
      'refuse la reprise avant remise en file : %s',
      async (cause) => {
        const jobId = await enqueue({
          fields: {
            "Code de l'action de référence ou URL de l'action (facultatif)":
              'action-inconnue',
          },
        });
        await worker.generate(jobId);
        const before = await readJob(jobId);
        assert(before.checkpoint);
        if (cause === 'catalogue indisponible') {
          catalogue.version = `${catalogue.version}-next`;
        } else {
          laureats.laureats = [];
        }
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

    test('conserve la publication admise après activation d’un autre catalogue', async () => {
      const actionCode = 'action-publiee';
      const sousActionCode = 'complement-catalogue';
      const initialTitle = 'Complément de la publication admise';
      const nextTitle = 'Complément de la publication suivante';
      catalogue.fiches.actions = [
        {
          code: actionCode,
          validation: 'validated',
          axeNumero: 1,
          sousAxeNumero: null,
          champs: { titre: 'Action du catalogue' },
          aides: [],
          indicateurCodes: [],
          sousActions: [
            { code: sousActionCode, champs: { titre: initialTitle } },
          ],
        },
      ];
      const admitted = structuredClone(catalogue);
      data.catalogues.set(admitted.version, admitted);
      const document = {
        fields: {
          "Code de l'action de référence ou URL de l'action (facultatif)":
            actionCode,
        },
      };
      const jobId = await enqueue(document);
      catalogue.version = `${admitted.version}-next`;
      catalogue.fiches.actions[0].sousActions[0].champs.titre = nextTitle;

      await worker.generate(jobId);

      expect(await status(jobId)).toMatchObject({
        status: 'done',
        createdPlanId: expect.any(Number),
      });
      expect((await readJob(jobId)).options.catalogueVersion).toBe(
        admitted.version
      );
      expect(await readFiches()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            referenceCode: sousActionCode,
            referenceParentCode: actionCode,
            titre: initialTitle,
          }),
        ])
      );
      expect(await readFiches()).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ titre: nextTitle })])
      );
      const nextJobId = await enqueue({
        fields: {
          ...document.fields,
          "Intitulé de l'action": 'Action du second import',
        },
      });
      expect((await readJob(nextJobId)).options.catalogueVersion).toBe(
        catalogue.version
      );
      await worker.generate(nextJobId);
      expect(await status(nextJobId)).toMatchObject({ status: 'done' });
      expect(
        (await readFiches())
          .filter(({ referenceCode }) => referenceCode === sousActionCode)
          .map(({ titre }) => titre)
          .sort()
      ).toEqual([initialTitle, nextTitle].sort());
      expect(llm.complete).not.toHaveBeenCalled();
      expect(llm.chat).not.toHaveBeenCalled();
    });

    test('garde source et checkpoint si la publication admise est indisponible', async () => {
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
      // Reprise déjà en file ; la publication initiale devient indisponible.
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
