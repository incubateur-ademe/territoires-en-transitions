import ImportIndicateurDefinitionService from '@tet/backend/indicateurs/import-indicateurs/import-indicateur-definition.service';
import { sampleImportIndicateurDefinition } from '@tet/backend/indicateurs/import-indicateurs/samples/import-indicateur-definition.sample';
import { indicateurReferenceExterneTable } from '@tet/backend/indicateurs/indicateur/indicateur-reference-externe.table';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SyncElectrificationDataModule } from '../sync-electrification-data/sync-electrification-data.module';
import { SyncElectrificationDataService } from '../sync-electrification-data/sync-electrification-data.service';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestRouter,
} from '@tet/backend/test';
import { addUserRoleSupport } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { failure } from '@tet/backend/utils/result.type';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  ElectrificationConfig,
  ElectrificationLaureatsConfig,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { createHash, randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  onTestFinished,
} from 'vitest';
import { electrificationStorageConfig } from '../config/electrification-storage.config';
import { ElectrificationDataService } from './electrification-data.service';
import { electrificationCatalogueFixture } from './electrification-data.test-fixture';
import { ElectrificationDataKind } from './publish-electrification-data.input';
import { CheckElectrificationEligibilityService } from '../check-electrification-eligibility/check-electrification-eligibility.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { ReadElectrificationGristService } from './sources/read-electrification-grist.service';
import { ReadElectrificationLaureatsService } from './sources/read-electrification-laureats.service';
import { electrificationGristConfig } from '../config/electrification-grist.config';

describe('Publication des données Électrification', () => {
  let app: INestApplication;
  let syncApp: TestingModule;
  let sync: SyncElectrificationDataService;
  let db: DatabaseService;
  let storage: SupabaseService;
  let data: ElectrificationDataService;
  let admin: ReturnType<TrpcRouter['createCaller']>;
  let adminUser: ReturnType<typeof getAuthUserFromUserCredentials>;
  let memberUser: ReturnType<typeof getAuthUserFromUserCredentials>;
  let member: ReturnType<TrpcRouter['createCaller']>;
  let collectiviteId: number;
  let siren: string;
  const laureatsDocumentId = 'test-laureats-document';
  let cleanupRole: (() => Promise<void>) | undefined;
  let selectionsSaved = false;
  const versions: { kind: ElectrificationDataKind; version: string }[] = [];
  const previous = new Map<
    ElectrificationDataKind,
    { content: string; metadata: Record<string, string> }
  >();
  const reference = `test-publication-${randomUUID()}`;

  const catalogue = (): ElectrificationConfig => ({
    ...structuredClone(electrificationCatalogueFixture),
    version: randomUUID(),
    fiches: { actions: [], indicateurs: [] },
    engagements: electrificationCatalogueFixture.engagements.map(
      (engagement) => ({
        ...engagement,
        cibles: engagement.cibles.map((cible) => ({
          ...cible,
          validation: 'pending',
        })),
      })
    ),
  });
  const laureats = (): ElectrificationLaureatsConfig => ({
    version: randomUUID(),
    source: `https://grist.numerique.gouv.fr/${laureatsDocumentId}`,
    validFrom: '2020-01-01T00:00:00.000Z',
    validUntil: null,
    laureats: [{ reference: 'laureat-test', collectiviteId }],
  });
  const publish = (
    kind: ElectrificationDataKind,
    payload: ElectrificationConfig | ElectrificationLaureatsConfig
  ) => {
    versions.push({ kind, version: payload.version });
    return admin.plans.plans.electrificationData.publish({
      kind,
      data: payload,
    });
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new FakeLlmRepository()));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    syncApp = await Test.createTestingModule({
      imports: [SyncElectrificationDataModule],
    }).compile();
    sync = syncApp.get(SyncElectrificationDataService);
    db = app.get(DatabaseService);
    storage = app.get(SupabaseService);
    data = app.get(ElectrificationDataService);
    const router = await getTestRouter(app);
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = fixture.collectivite.id;
    siren = String(800000000 + collectiviteId);
    await db.db
      .update(collectiviteTable)
      .set({ siren })
      .where(eq(collectiviteTable.id, collectiviteId));
    memberUser = getAuthUserFromUserCredentials(fixture.user);
    member = router.createCaller({ user: memberUser });
    const adminFixture = await addTestCollectiviteAndUser(db);
    adminUser = getAuthUserFromUserCredentials(adminFixture.user);
    ({ cleanup: cleanupRole } = await addUserRoleSupport({
      databaseService: db,
      userId: adminUser.id,
      isSuperAdminRoleEnabled: true,
    }));
    admin = router.createCaller({ user: adminUser });
    // Conserve la sélection locale : la recette ne remplace pas les données du développeur.
    for (const kind of ['catalogue', 'laureats'] as const) {
      const [object] = await db.db
        .select({ metadata: storageObjectTable.userMetadata })
        .from(storageObjectTable)
        .where(
          and(
            eq(
              storageObjectTable.bucketId,
              electrificationStorageConfig.bucket
            ),
            eq(storageObjectTable.name, `${kind}/active.json`)
          )
        );
      if (!object) continue;
      const old = await storage.client.storage
        .from(electrificationStorageConfig.bucket)
        .download(`${kind}/active.json`);
      if (!old.data)
        throw new Error(
          'La sélection locale doit être sauvegardée avant les tests.'
        );
      const content = await old.data.text();
      previous.set(kind, {
        content,
        metadata: object.metadata as Record<string, string>,
      });
    }
    selectionsSaved = true;
  });

  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await syncApp?.close();
    await cleanupRole?.();
    if (!storage || !selectionsSaved) {
      await app?.close();
      return;
    }
    for (const kind of ['catalogue', 'laureats'] as const) {
      const old = previous.get(kind);
      if (old) {
        await storage.saveInStorage({
          bucket: electrificationStorageConfig.bucket,
          path: `${kind}/active.json`,
          file: old.content,
          mimeType: 'application/json',
          metadata: old.metadata,
        });
      } else {
        await storage.client.storage
          .from(electrificationStorageConfig.bucket)
          .remove([`${kind}/active.json`]);
      }
    }
    await storage.client.storage
      .from(electrificationStorageConfig.bucket)
      .remove(
        versions.map(
          ({ kind, version }) =>
            `${kind}/versions/${createHash('sha256')
              .update(version)
              .digest('hex')}.json`
        )
      );
    await db.db
      .delete(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.identifiantReferentiel, reference));
    await app.close();
  });

  test('réserve la lecture, la vérification et la publication au super admin', async () => {
    const api = member.plans.plans.electrificationData;
    const grist = vi.spyOn(app.get(ReadElectrificationGristService), 'read');
    const laureatsSource = vi.spyOn(
      app.get(ReadElectrificationLaureatsService),
      'read'
    );
    await expect(
      api.prepare({ kind: 'catalogue', version: 'test' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      api.prepare({
        kind: 'laureats',
        version: 'test',
        validFrom: '2026-11-12T00:00:00.000Z',
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(grist).not.toHaveBeenCalled();
    expect(laureatsSource).not.toHaveBeenCalled();
    await expect(api.get({ kind: 'laureats' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(
      api.verify({ kind: 'laureats', data: laureats() })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      api.publish({ kind: 'laureats', data: laureats() })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test.each([
    { client_id: 'cle-api-test' },
    { permissions: ['plans.read'] },
    { permissions: [] },
  ])(
    'refuse un jeton limité même si son utilisateur est super admin (%j)',
    async (claims) => {
      const router = await getTestRouter(app);
      const api = router.createCaller({
        user: {
          ...adminUser,
          jwtPayload: { ...adminUser.jwtPayload, ...claims },
        },
      }).plans.plans.electrificationData;
      await expect(
        api.prepare({
          kind: 'laureats',
          version: 'test',
          validFrom: '2026-11-12T00:00:00.000Z',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
      await expect(api.get({ kind: 'laureats' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
      await expect(
        api.verify({ kind: 'laureats', data: laureats() })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
      await expect(
        api.publish({ kind: 'laureats', data: laureats() })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    }
  );

  test('vérifie sans publier et refuse les références métier incohérentes', async () => {
    const payload = catalogue();
    const api = admin.plans.plans.electrificationData;
    expect(await api.verify({ kind: 'catalogue', data: payload })).toEqual({
      valid: true,
      issues: [],
    });
    expect(await data.getCatalogue(payload.version)).toMatchObject({
      success: false,
      error: 'DATA_UNAVAILABLE',
    });
    payload.axes.push(payload.axes[0]);
    expect(
      await api.verify({ kind: 'catalogue', data: payload })
    ).toMatchObject({
      valid: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ location: 'catalogue.axes[11]' }),
      ]),
    });
    await expect(publish('catalogue', payload)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    const list = laureats();
    list.laureats.push(list.laureats[0]);
    expect(await api.verify({ kind: 'laureats', data: list })).toMatchObject({
      valid: false,
    });
    list.laureats = [{ reference: 'absent', collectiviteId: 2147483647 }];
    expect(await api.verify({ kind: 'laureats', data: list })).toMatchObject({
      valid: false,
      issues: [
        expect.objectContaining({ location: 'laureats[0].collectiviteId' }),
      ],
    });
  });

  test('contrôle les unités et périodicités des correspondances validées en base', async () => {
    const payload = catalogue();
    payload.fiches.indicateurs = [
      {
        code: 'compteur-test',
        type: 'quantitatif',
        validation: 'validated',
        identifiantReferentiel: reference,
        unite: 'Nombre',
        periodicite: 'annuelle',
      },
    ];
    const verify = () =>
      admin.plans.plans.electrificationData.verify({
        kind: 'catalogue',
        data: payload,
      });
    expect(await verify()).toMatchObject({ valid: false });
    await db.db.insert(indicateurDefinitionTable).values({
      identifiantReferentiel: reference,
      titre: 'Compteur synthétique',
      unite: 'Nombre',
      periodicite: 'annuelle',
    });
    expect(await verify()).toEqual({ valid: true, issues: [] });
    payload.fiches.indicateurs[0] = {
      ...payload.fiches.indicateurs[0],
      type: 'quantitatif',
      identifiantReferentiel: reference,
      unite: 'Autre unité',
      periodicite: 'annuelle',
    };
    expect(await verify()).toMatchObject({ valid: false });
  });

  test('active les nouvelles données sans redémarrage et conserve chaque version pour les imports en cours', async () => {
    const first = catalogue();
    await publish('catalogue', first);
    expect(await data.getCatalogue()).toEqual({ success: true, data: first });
    const second = structuredClone(first);
    second.version = randomUUID();
    second.axes[0].titre = 'Libellé corrigé';
    await publish('catalogue', second);
    expect(await data.getCatalogue()).toEqual({ success: true, data: second });
    expect(await data.getCatalogue(first.version)).toEqual({
      success: true,
      data: first,
    });
    expect(
      await admin.plans.plans.electrificationData.get({
        kind: 'catalogue',
        version: first.version,
      })
    ).toEqual(first);
    await publish('catalogue', first);
    expect(await data.getCatalogue()).toEqual({ success: true, data: first });
  });

  test('publie les lauréats indépendamment et réévalue immédiatement la liste courante', async () => {
    const check = () =>
      app
        .get(CheckElectrificationEligibilityService)
        .check({ collectiviteId }, { user: memberUser });
    const first = laureats();
    await publish('laureats', first);
    expect(await data.getLaureats()).toEqual({ success: true, data: first });
    expect(await check()).toMatchObject({
      success: true,
      data: { eligible: true, provenance: { version: first.version } },
    });
    const second = { ...first, version: randomUUID(), laureats: [] };
    await publish('laureats', second);
    expect(await data.getLaureats()).toEqual({ success: true, data: second });
    expect(await check()).toMatchObject({
      success: true,
      data: { eligible: false, provenance: { version: second.version } },
    });
    expect(await data.getLaureats(first.version)).toEqual({
      success: true,
      data: first,
    });
  });

  test.each(['catalogue', 'laureats'] as const)(
    'sérialise la publication concurrente de contenus différents pour une même version de %s',
    async (kind) => {
      const first = kind === 'catalogue' ? catalogue() : laureats();
      const other = structuredClone(first);
      if ('axes' in other) other.axes[0].titre = 'Contenu concurrent';
      else other.source = 'Source concurrente';
      const save = vi.spyOn(storage, 'saveInStorage');
      const outcomes = await Promise.allSettled([
        publish(kind, first),
        publish(kind, other),
      ]);
      expect(
        outcomes.filter(({ status }) => status === 'fulfilled')
      ).toHaveLength(1);
      expect(
        outcomes.find(({ status }) => status === 'rejected')
      ).toMatchObject({
        reason: { code: 'CONFLICT' },
      });
      expect(
        save.mock.calls.filter(([args]) => args.path.includes('/versions/'))
      ).toHaveLength(1);
      const winner = outcomes[0].status === 'fulfilled' ? first : other;
      expect(
        await admin.plans.plans.electrificationData.get({
          kind,
          version: first.version,
        })
      ).toEqual(winner);
      expect(await admin.plans.plans.electrificationData.get({ kind })).toEqual(
        winner
      );
    }
  );

  test('conserve la sélection active si son remplacement échoue, puis permet la reprise de publication', async () => {
    const first = catalogue();
    await publish('catalogue', first);
    const second = catalogue();
    const save = storage.saveInStorage.bind(storage);
    const spy = vi
      .spyOn(storage, 'saveInStorage')
      .mockImplementation((args) =>
        args.path.endsWith('/active.json')
          ? Promise.resolve(failure('UPLOAD_STORAGE_ERROR'))
          : save(args)
      );
    await expect(publish('catalogue', second)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
    });
    expect(await data.getCatalogue()).toEqual({ success: true, data: first });
    spy.mockRestore();
    await publish('catalogue', second);
    expect(await data.getCatalogue()).toEqual({ success: true, data: second });
  });

  describe('Préparation depuis les sources métier', () => {
    const catalogueDocumentId = 'test-catalogue-document';
    const catalogueUrl = `https://grist.numerique.gouv.fr/${catalogueDocumentId}`;
    const referenceSource =
      electrificationGristConfig.catalogue.indicateurReferenceSource;
    const testReference = and(
      eq(indicateurReferenceExterneTable.source, referenceSource),
      eq(indicateurReferenceExterneTable.codeExterne, 'test-indicateur')
    );

    beforeEach(async () => {
      await db.db.insert(indicateurReferenceExterneTable).values({
        source: referenceSource,
        codeExterne: 'test-indicateur',
        lienSource: catalogueUrl,
        version: 'test-pending',
      });
      onTestFinished(async () => {
        await db.db
          .delete(indicateurReferenceExterneTable)
          .where(testReference);
      });
      for (const container of [app, syncApp]) {
        const config = container.get(ConfigurationService);
        const get = ConfigurationService.prototype.get.bind(config);
        vi.spyOn(config, 'get').mockImplementation((key) =>
          key === 'ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID'
            ? laureatsDocumentId
            : get(key)
        );
      }
    });
    const sourceTables = () => ({
      Axes: electrificationCatalogueFixture.axes.map((a) => ({
        id: a.numero,
        fields: {
          Numero: a.numero,
          Titre: a.titre,
          Code_signe: electrificationCatalogueFixture.engagements
            .filter((engagement) => engagement.axeNumero === a.numero)
            .map(({ code }) => code)
            .join('+'),
          Parametre_signe: `Engagement de l'axe ${a.numero}`,
        },
      })),
      Sous_axes: [
        { id: 1, fields: { Numero: '1.1', Titre: 'Sous-axe test', Axe: 1 } },
      ],
      Actions: [
        {
          id: 1,
          fields: {
            Numero: '1.1.1',
            Titre: 'Titre actualisé',
            Descriptif: 'Description actualisée',
            Axe: 1,
            Sous_axe: 1,
            Sous_actions: ['L', 42],
            Indicateurs: ['L', 1],
            Ressources: ['L', 1],
          },
        },
      ],
      Sous_actions: [
        {
          id: 42,
          fields: {
            Titre: 'Sous-action actualisée',
            Description: null,
            Action: 1,
            Ordre: 2,
          },
        },
      ],
      Indicateurs: [
        {
          id: 1,
          fields: {
            Code: 'test-indicateur',
            Unite: 'Nombre',
            Frequence: 'Annuelle',
          },
        },
      ],
      Ressources: [
        {
          id: 1,
          fields: {
            Nom: 'Aide actualisée',
            Site_web: 'https://example.com/aide',
          },
        },
      ],
    });

    const mockGrist = (
      tables = sourceTables(),
      revisionChanged = false,
      revision = 'stable',
      documentId = catalogueDocumentId
    ) => {
      const fetch = globalThis.fetch;
      let reads = 0;
      return vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input, init) => {
          const url = String(input);
          if (
            !url.startsWith(
              `https://grist.numerique.gouv.fr/api/docs/${documentId}`
            )
          ) {
            if (url.includes('grist.numerique.gouv.fr'))
              throw new Error(`Unexpected Grist document: ${url}`);
            return fetch(input, init);
          }
          if (url.endsWith('/states'))
            return Response.json({
              states: [{ h: revisionChanged ? String(reads++) : revision }],
            });
          const table = url.match(
            /\/tables\/V1_3_(.+)\/records$/
          )?.[1] as keyof typeof tables;
          if (!tables[table])
            throw new Error(`Table de test inconnue : ${url}`);
          return Response.json({ records: tables[table] });
        });
    };

    const laureatColumns = [
      { id: 'code_interne', fields: { label: 'Code territoire' } },
      { id: 'identifiant_interne', fields: { label: 'Identifiant public' } },
      { id: 'nature_interne', fields: { label: 'Nature du périmètre' } },
    ];
    const mockLaureats = (
      rows: Record<string, unknown>[],
      { changed = false, status = 200, columns = laureatColumns } = {}
    ) => {
      const fetch = globalThis.fetch;
      let reads = 0;
      return vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input, init) => {
          const url = String(input);
          if (
            !url.startsWith(
              `https://grist.numerique.gouv.fr/api/docs/${laureatsDocumentId}`
            )
          ) {
            if (url.includes('grist.numerique.gouv.fr'))
              throw new Error(`Unexpected Grist document: ${url}`);
            return fetch(input, init);
          }
          if (status !== 200) return new Response('', { status });
          if (url.endsWith('/states'))
            return Response.json({
              states: [{ h: changed ? String(reads++) : 'revision-laureats' }],
            });
          if (url.endsWith('/tables/Territoires/columns'))
            return Response.json({ columns });
          if (!url.endsWith('/tables/Territoires/records'))
            throw new Error('Unexpected Grist table');
          return Response.json({
            records: rows.map((fields, index) => ({
              id: index + 1,
              fields: Object.fromEntries(
                Object.entries(fields).map(([label, value]) => [
                  laureatColumns.find((column) => column.fields.label === label)
                    ?.id ?? label,
                  value,
                ])
              ),
            })),
          });
        });
    };
    const sourceLaureat = () => ({
      'Code territoire': 'reference-stable',
      'Identifiant public': siren,
      'Nature du périmètre': 'EPCI',
    });
    const laureatsInput = () => ({
      kind: 'laureats' as const,
      version: randomUUID(),
      validFrom: '2026-11-12T00:00:00.000Z',
    });
    const auditContext = {
      publishedBy: 'github:test-operator',
      workflowRun: 'https://github.com/test/repo/actions/runs/123',
    };

    const publishReferences = async (
      codes: string[],
      source: string = electrificationGristConfig.catalogue
        .indicateurReferenceSource,
      unite = 'nb',
      periodicite: typeof sampleImportIndicateurDefinition.periodicite = 'annuelle'
    ) => {
      const definitions = codes.map(() => ({
        ...sampleImportIndicateurDefinition,
        identifiantReferentiel: `reference_${randomUUID()}`,
        unite,
        periodicite,
        categories: [],
        thematiques: [],
        parents: null,
        valeurCalcule: null,
      }));
      const imported = await app
        .get(ImportIndicateurDefinitionService)
        .upsertIndicateurDefinitions(
          definitions,
          [],
          codes.map((codeExterne, index) => ({
            source,
            codeExterne,
            lienSource: catalogueUrl,
            identifiantReferentiel: definitions[index].identifiantReferentiel,
          }))
        );
      const ids = imported.definitions
        .filter((definition) =>
          definitions.some(
            (candidate) =>
              candidate.identifiantReferentiel ===
              definition.identifiantReferentiel
          )
        )
        .map(({ id }) => id);
      onTestFinished(async () => {
        for (const id of ids)
          await db.db
            .delete(indicateurDefinitionTable)
            .where(eq(indicateurDefinitionTable.id, id));
      });
      return definitions;
    };

    test('suit le document publié même sans mapping TeT, en conservant les versions précédentes', async () => {
      const initial = catalogue();
      await publish('catalogue', initial);
      const nextDocumentId = 'replacement-catalogue';
      const nextUrl = `https://grist.numerique.gouv.fr/o/test/${nextDocumentId}/Catalogue/p/86`;
      await db.db
        .update(indicateurReferenceExterneTable)
        .set({ lienSource: nextUrl })
        .where(testReference);
      const read = mockGrist(sourceTables(), false, 'stable', nextDocumentId);
      const prepared = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version: randomUUID(),
      });
      expect(prepared).toMatchObject({
        valid: true,
        data: {
          source: `https://grist.numerique.gouv.fr/${nextDocumentId}`,
          fiches: {
            indicateurs: [
              {
                code: 'test-indicateur',
                validation: 'pending',
                identifiantReferentiel: null,
              },
            ],
          },
        },
      });
      const sourceCalls = read.mock.calls.filter(([url]) =>
        String(url).includes('grist.numerique.gouv.fr')
      );
      expect(sourceCalls).toHaveLength(8);
      expect(
        sourceCalls.every(([url]) =>
          String(url).includes(`/api/docs/${nextDocumentId}/`)
        )
      ).toBe(true);
      expect(await data.getCatalogue()).toEqual({
        success: true,
        data: initial,
      });
      const candidate = await sync.sync('catalogue', true, auditContext);
      expect(candidate).toMatchObject({
        success: true,
        data: {
          source: `https://grist.numerique.gouv.fr/${nextDocumentId}`,
          published: true,
        },
      });
      if (!candidate.success) throw new Error('Missing publication');
      versions.push({ kind: 'catalogue', version: candidate.data.version });
      expect(
        await admin.plans.plans.electrificationData.get({
          kind: 'catalogue',
          version: initial.version,
        })
      ).toEqual(initial);
      read.mockRestore();
      // Une adresse différente produit une nouvelle version, même à contenu métier identique.
      await db.db
        .update(indicateurReferenceExterneTable)
        .set({ lienSource: catalogueUrl })
        .where(testReference);
      mockGrist();
      const otherDocument = await sync.sync('catalogue', false, auditContext);
      expect(otherDocument.success).toBe(true);
      if (!otherDocument.success) throw new Error('Missing preview');
      expect(otherDocument.data.version).not.toBe(candidate.data.version);
    });

    test('accepte plusieurs pages du même document pour les deux espaces de références', async () => {
      const engagementSource =
        electrificationGristConfig.catalogue.engagementReferenceSource;
      await db.db.insert(indicateurReferenceExterneTable).values({
        source: engagementSource,
        codeExterne: 'E01.principale',
        version: 'test-pending',
        lienSource: `https://grist.numerique.gouv.fr/o/test/${catalogueDocumentId}/Autre-page/p/7`,
      });
      onTestFinished(async () => {
        await db.db
          .delete(indicateurReferenceExterneTable)
          .where(eq(indicateurReferenceExterneTable.source, engagementSource));
      });
      const read = mockGrist();
      const prepared = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version: randomUUID(),
      });
      expect(prepared.valid).toBe(true);
      read.mockClear();
      await db.db
        .update(indicateurReferenceExterneTable)
        .set({ lienSource: 'https://grist.numerique.gouv.fr/another-document' })
        .where(eq(indicateurReferenceExterneTable.source, engagementSource));
      await expect(
        admin.plans.plans.electrificationData.prepare({
          kind: 'catalogue',
          version: randomUUID(),
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(
        read.mock.calls.filter(([url]) =>
          String(url).includes('grist.numerique.gouv.fr')
        )
      ).toEqual([]);
    });

    test('refuse une adresse absente ou inaccessible sans repli sur un ancien document', async () => {
      const initial = catalogue();
      await publish('catalogue', initial);
      const read = mockGrist();
      await db.db.delete(indicateurReferenceExterneTable).where(testReference);
      expect(await sync.sync('catalogue', true, auditContext)).toMatchObject({
        success: false,
        error: 'SOURCE_NOT_CONFIGURED',
      });
      expect(
        read.mock.calls.filter(([url]) =>
          String(url).includes('grist.numerique.gouv.fr')
        )
      ).toEqual([]);
      await db.db.insert(indicateurReferenceExterneTable).values({
        source: referenceSource,
        codeExterne: 'test-indicateur',
        version: 'test',
        lienSource: 'https://grist.numerique.gouv.fr/inaccessible-document',
      });
      expect(await sync.sync('catalogue', true, auditContext)).toMatchObject({
        success: false,
        error: 'SOURCE_UNAVAILABLE',
      });
      const sourceCalls = read.mock.calls.filter(([url]) =>
        String(url).includes('grist.numerique.gouv.fr')
      );
      expect(sourceCalls).toHaveLength(1);
      expect(String(sourceCalls[0][0])).toContain('/inaccessible-document/');
      expect(await data.getCatalogue()).toEqual({
        success: true,
        data: initial,
      });
    });

    test('exige la configuration du document des lauréats avant toute lecture Grist', async () => {
      const read = mockLaureats([sourceLaureat()]);
      const config = syncApp.get(ConfigurationService);
      const get = ConfigurationService.prototype.get.bind(config);
      vi.spyOn(config, 'get').mockImplementation((key) =>
        key === 'ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID'
          ? undefined
          : get(key)
      );
      expect(await sync.sync('laureats', false, auditContext)).toMatchObject({
        success: false,
        error: 'SOURCE_NOT_CONFIGURED',
      });
      expect(read).not.toHaveBeenCalled();
    });

    test('prépare le catalogue depuis les références publiées et conserve les compléments TeT', async () => {
      const initial = catalogue();
      initial.fiches.actions = [
        {
          code: '1.1.1',
          validation: 'validated',
          axeNumero: 1,
          sousAxeNumero: '1.1',
          champs: {
            titre: 'Ancien titre',
            description: 'Ancienne description',
            objectifs: 'Objectif complémentaire TeT',
          },
          sousActions: [],
          indicateurCodes: [],
          aides: [],
        },
      ];
      initial.fiches.indicateurs = [
        {
          code: 'test-indicateur',
          type: 'booleen',
          titre: 'Jalon validé',
          validation: 'validated',
        },
      ];
      await publish('catalogue', initial);
      const [definition] = await publishReferences(['test-indicateur']);
      mockGrist();
      const version = randomUUID();
      const prepared = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version,
      });
      expect(prepared).toMatchObject({
        valid: true,
        issues: [],
        data: {
          version,
          fiches: {
            indicateurs: [
              {
                code: 'test-indicateur',
                type: 'quantitatif',
                validation: 'validated',
                identifiantReferentiel: definition.identifiantReferentiel,
                unite: 'nb',
                periodicite: 'annuelle',
              },
            ],
            actions: [
              {
                code: '1.1.1',
                champs: {
                  titre: 'Titre actualisé',
                  description: 'Description actualisée',
                  objectifs: 'Objectif complémentaire TeT',
                },
                sousActions: [
                  {
                    code: 'sous-action-042',
                    champs: { titre: 'Sous-action actualisée' },
                  },
                ],
                aides: [
                  { titre: 'Aide actualisée', url: 'https://example.com/aide' },
                ],
              },
            ],
          },
        },
      });
      expect(await data.getCatalogue()).toEqual({
        success: true,
        data: initial,
      });
      expect(await data.getCatalogue(version)).toMatchObject({
        success: false,
        error: 'DATA_UNAVAILABLE',
      });
      await publish('catalogue', prepared.data);
      expect(await data.getCatalogue()).toEqual({
        success: true,
        data: prepared.data,
      });
      expect(await data.getCatalogue(initial.version)).toEqual({
        success: true,
        data: initial,
      });
    });

    test('lit les engagements Grist et résout leurs cibles depuis leur source de références dédiée', async () => {
      const initial = catalogue();
      await publish('catalogue', initial);
      const tables = sourceTables();
      tables.Axes[0].fields.Code_signe = ' E02 + E01 ';
      tables.Axes[3].fields.Parametre_signe = 'Étudier le réseau (non chiffré)';
      tables.Axes[6].fields.Parametre_signe =
        'Identifier ___ site clés en main';
      tables.Axes[6].fields.Titre = 'Recharge des poids lourds';
      // Un même code dans une autre source ne valide pas une cible d'engagement.
      await publishReferences(['E01.principale']);
      const [definition] = await publishReferences(
        ['E01.principale'],
        electrificationGristConfig.catalogue.engagementReferenceSource,
        '%'
      );
      const bornes = await publishReferences(
        ['E07.total', 'E07.rapides'],
        electrificationGristConfig.catalogue.engagementReferenceSource,
        'Nombre de bornes'
      );
      mockGrist(tables);
      const prepared = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version: randomUUID(),
      });
      expect(prepared.valid).toBe(true);
      const result = prepared.data as ElectrificationConfig;
      expect(result.engagements).toHaveLength(12);
      expect(result.engagements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'E01',
            axeNumero: 1,
            actionTitre: null,
            cibles: [
              {
                key: 'principale',
                identifiantReferentiel: definition.identifiantReferentiel,
                unite: '%',
                periodicite: 'annuelle',
                validation: 'validated',
              },
            ],
          }),
          expect.objectContaining({
            code: 'E02',
            axeNumero: 1,
            cibles: [
              {
                key: 'principale',
                identifiantReferentiel: null,
                unite: null,
                periodicite: null,
                validation: 'pending',
              },
            ],
          }),
          {
            code: 'E03',
            axeNumero: 4,
            actionTitre: 'Étudier le réseau',
            cibles: [],
          },
          {
            code: 'E12',
            axeNumero: 7,
            actionTitre: 'Recharge des poids lourds',
            cibles: [],
          },
          {
            code: 'E07',
            axeNumero: 6,
            actionTitre: null,
            cibles: bornes.map((definition, index) => ({
              key: index === 0 ? 'total' : 'rapides',
              identifiantReferentiel: definition.identifiantReferentiel,
              unite: 'Nombre de bornes',
              periodicite: 'annuelle',
              validation: 'validated',
            })),
          },
        ])
      );
      expect(await data.getCatalogue()).toEqual({
        success: true,
        data: initial,
      });
      await publish('catalogue', prepared.data);
      await db.db
        .delete(indicateurReferenceExterneTable)
        .where(
          and(
            eq(
              indicateurReferenceExterneTable.source,
              electrificationGristConfig.catalogue.engagementReferenceSource
            ),
            eq(indicateurReferenceExterneTable.codeExterne, 'E01.principale')
          )
        );
      const next = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version: randomUUID(),
      });
      expect(next.valid).toBe(true);
      expect(
        (next.data as ElectrificationConfig).engagements.find(
          ({ code }) => code === 'E01'
        )?.cibles
      ).toEqual([
        {
          key: 'principale',
          identifiantReferentiel: null,
          unite: null,
          periodicite: null,
          validation: 'pending',
        },
      ]);
      expect(await data.getCatalogue(prepared.data.version)).toEqual({
        success: true,
        data: prepared.data,
      });
    });

    test('refuse une cible dont la définition TeT publiée n’est pas annuelle', async () => {
      const initial = catalogue();
      await publish('catalogue', initial);
      await publishReferences(
        ['E01.principale'],
        electrificationGristConfig.catalogue.engagementReferenceSource,
        '%',
        'trimestrielle'
      );
      mockGrist();

      const prepared = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version: randomUUID(),
      });

      expect(prepared).toMatchObject({
        valid: false,
        issues: [
          expect.objectContaining({ location: 'engagements[0].cibles[0]' }),
        ],
      });
      await expect(publish('catalogue', prepared.data)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
      expect(await data.getCatalogue()).toEqual({
        success: true,
        data: initial,
      });
    });

    test.each([
      'colonne absente',
      'code inconnu',
      'code dupliqué',
      'code vide',
      'engagement absent',
    ] as const)(
      'refuse les engagements Grist invalides : %s',
      async (scenario) => {
        const initial = catalogue();
        await publish('catalogue', initial);
        const tables = sourceTables();
        if (scenario === 'colonne absente')
          Reflect.deleteProperty(tables.Axes[0].fields, 'Code_signe');
        if (scenario === 'code inconnu')
          tables.Axes[0].fields.Code_signe = 'E99';
        if (scenario === 'code dupliqué')
          tables.Axes[0].fields.Code_signe = 'E01+E01+E02';
        if (scenario === 'code vide')
          tables.Axes[0].fields.Code_signe = 'E01++E02';
        if (scenario === 'engagement absent')
          tables.Axes[0].fields.Code_signe = 'E01';
        mockGrist(tables);
        expect(await sync.sync('catalogue', true, auditContext)).toEqual({
          success: false,
          error: 'INVALID_SOURCE',
        });
        expect(await data.getCatalogue()).toEqual({
          success: true,
          data: initial,
        });
      }
    );

    test.each(['E07.inconnue', 'E03.principale'])(
      'refuse une référence qui ne désigne pas une cible du canevas : %s',
      async (code) => {
        const initial = catalogue();
        await publish('catalogue', initial);
        await publishReferences(
          [code],
          electrificationGristConfig.catalogue.engagementReferenceSource
        );
        mockGrist();
        expect(await sync.sync('catalogue', true, auditContext)).toEqual({
          success: false,
          error: 'INVALID_SOURCE',
        });
        expect(await data.getCatalogue()).toEqual({
          success: true,
          data: initial,
        });
      }
    );

    test('conserve l’identité d’une sous-action renommée, déplacée et réordonnée', async () => {
      await publish('catalogue', catalogue());
      const tables = sourceTables();
      mockGrist(tables);
      const first = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version: randomUUID(),
      });
      const sousAction = (first.data as ElectrificationConfig).fiches
        .actions?.[0].sousActions[0];
      if (!sousAction)
        throw new Error('Sous-action attendue dans le catalogue préparé');
      sousAction.champs.objectifs = 'Objectif complémentaire TeT';
      await publish('catalogue', first.data);
      tables.Actions.push({
        id: 2,
        fields: { ...tables.Actions[0].fields, Numero: '1.1.2' },
      });
      tables.Actions[0].fields.Sous_actions = ['L'];
      tables.Sous_actions[0].fields.Action = 2;
      tables.Sous_actions[0].fields.Titre = 'Nouveau titre';
      tables.Sous_actions[0].fields.Ordre = 0;
      const next = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version: randomUUID(),
      });
      expect(next).toMatchObject({
        valid: true,
        data: {
          fiches: {
            actions: [
              { code: '1.1.1', sousActions: [] },
              {
                code: '1.1.2',
                sousActions: [
                  {
                    code: 'sous-action-042',
                    champs: {
                      titre: 'Nouveau titre',
                      objectifs: 'Objectif complémentaire TeT',
                    },
                  },
                ],
              },
            ],
          },
        },
      });
    });

    test('garde les nouveaux indicateurs en attente sans déduire une correspondance TeT', async () => {
      await publish('catalogue', catalogue());
      const tables = sourceTables();
      tables.Indicateurs[0].fields.Unite = '% et nb';
      tables.Indicateurs[0].fields.Frequence = 'Ponctuelle (une fois)';
      mockGrist(tables);
      expect(
        await admin.plans.plans.electrificationData.prepare({
          kind: 'catalogue',
          version: randomUUID(),
        })
      ).toMatchObject({
        valid: true,
        data: {
          fiches: {
            indicateurs: [
              {
                validation: 'pending',
                identifiantReferentiel: null,
                unite: null,
                periodicite: null,
              },
            ],
          },
        },
      });
    });

    test.each([
      'reference-absente',
      'revision-modifiee',
      'format-invalide',
      'catalogue-vide',
    ] as const)(
      'refuse le Grist %s sans modifier la version active',
      async (scenario) => {
        const initial = catalogue();
        await publish('catalogue', initial);
        const tables = sourceTables();
        if (scenario === 'reference-absente')
          tables.Actions[0].fields.Ressources = ['L', 9999];
        if (scenario === 'format-invalide') tables.Axes[0].fields.Numero = -1;
        if (scenario === 'catalogue-vide') tables.Actions = [];
        mockGrist(tables, scenario === 'revision-modifiee');
        await expect(
          admin.plans.plans.electrificationData.prepare({
            kind: 'catalogue',
            version: randomUUID(),
          })
        ).rejects.toMatchObject({
          code: scenario === 'revision-modifiee' ? 'CONFLICT' : 'BAD_REQUEST',
        });
        expect(await data.getCatalogue()).toEqual({
          success: true,
          data: initial,
        });
      }
    );

    test('prépare les lauréats Grist, ignore les colonnes privées et conserve le contenu relu', async () => {
      const initial = laureats();
      await publish('laureats', initial);
      const rows = [
        sourceLaureat(),
        {
          'Code territoire': 'groupement-sans-porteur',
          'Identifiant public': '',
          'Nature du périmètre': 'Groupement de collectivités',
          Contact: 'privé',
        },
      ];
      const read = mockLaureats(rows);
      const input = laureatsInput();
      const prepared = await admin.plans.plans.electrificationData.prepare(
        input
      );
      expect(prepared).toEqual({
        valid: true,
        issues: [],
        sourceRevision: 'revision-laureats',
        excluded: 1,
        data: {
          version: input.version,
          validFrom: input.validFrom,
          validUntil: null,
          source: `https://grist.numerique.gouv.fr/${laureatsDocumentId}`,
          laureats: [{ reference: 'reference-stable', collectiviteId }],
        },
      });
      expect(await data.getLaureats()).toEqual({
        success: true,
        data: initial,
      });
      rows[0] = {
        ...sourceLaureat(),
        'Code territoire': 'modifié-après-relecture',
      };
      read.mockClear();
      await publish('laureats', prepared.data);
      expect(
        read.mock.calls.filter(([url]) =>
          String(url).includes('grist.numerique.gouv.fr')
        )
      ).toHaveLength(0);
      expect(await data.getLaureats()).toEqual({
        success: true,
        data: prepared.data,
      });
    });

    const verifySync = async (kind: ElectrificationDataKind) => {
      const result = await sync.sync(kind, false, auditContext);
      expect(result.success).toBe(true);
      if (!result.success) throw new Error(result.error);
      const existing =
        kind === 'catalogue'
          ? await data.getCatalogue(result.data.version)
          : await data.getLaureats(result.data.version);
      if (!existing.success && existing.error === 'DATA_UNAVAILABLE') {
        versions.push({ kind, version: result.data.version });
      }
      return result.data;
    };

    const activeMetadata = async (kind: ElectrificationDataKind) => {
      const [active] = await db.db
        .select({ metadata: storageObjectTable.userMetadata })
        .from(storageObjectTable)
        .where(
          and(
            eq(
              storageObjectTable.bucketId,
              electrificationStorageConfig.bucket
            ),
            eq(storageObjectTable.name, `${kind}/active.json`)
          )
        );
      return active?.metadata;
    };

    test('le workflow calcule la version, date la première publication et ne réécrit pas un contenu inchangé', async () => {
      const initial = laureats();
      await publish('laureats', initial);
      const rows = [sourceLaureat()];
      mockLaureats(rows);
      const syncStorage = syncApp.get(SupabaseService);
      const save = vi.spyOn(syncStorage, 'saveInStorage');
      const preview = await verifySync('laureats');
      expect(preview).toMatchObject({
        published: false,
        status: 'verified',
        count: 1,
      });
      expect(save).not.toHaveBeenCalled();
      expect(await data.getLaureats()).toEqual({
        success: true,
        data: initial,
      });
      expect(await data.getLaureats(preview.version)).toMatchObject({
        success: false,
        error: 'DATA_UNAVAILABLE',
      });

      const before = new Date().toISOString();
      expect(await sync.sync('laureats', true, auditContext)).toMatchObject({
        success: true,
        data: {
          version: preview.version,
          published: true,
          status: 'published',
        },
      });
      const published = await data.getLaureats();
      if (!published.success) throw new Error(published.error);
      expect(published.data.validFrom >= before).toBe(true);
      expect(published.data.validFrom <= new Date().toISOString()).toBe(true);
      const metadata = await activeMetadata('laureats');
      expect(metadata).toMatchObject({
        ...auditContext,
        sourceRevision: 'revision-laureats',
        publishedAt: published.data.validFrom,
      });
      save.mockClear();
      expect(
        await sync.sync('laureats', true, {
          ...auditContext,
          workflowRun: 'https://github.com/test/repo/actions/runs/456',
        })
      ).toMatchObject({
        success: true,
        data: {
          version: preview.version,
          published: false,
          status: 'unchanged',
        },
      });
      expect(save).not.toHaveBeenCalled();
      expect(await activeMetadata('laureats')).toEqual(metadata);
      expect(await data.getLaureats()).toEqual(published);

      // Une correction métier crée automatiquement une autre version ; le retour au contenu
      // initial réactive sa version et sa première date, sans réécrire son objet immuable.
      rows[0]['Code territoire'] = 'autre-contenu';
      const next = await verifySync('laureats');
      expect(next.version).not.toBe(preview.version);
      expect(await sync.sync('laureats', true, auditContext)).toMatchObject({
        success: true,
        data: { version: next.version },
      });
      rows[0]['Code territoire'] = 'reference-stable';
      save.mockClear();
      expect(await sync.sync('laureats', true, auditContext)).toMatchObject({
        success: true,
        data: { version: preview.version },
      });
      expect(save.mock.calls.map(([args]) => args.path)).toEqual([
        'laureats/active.json',
      ]);
      expect(await data.getLaureats()).toEqual(published);
    });

    test('conserve la première date après un échec d’activation et sérialise les reruns concurrents', async () => {
      const initial = laureats();
      await publish('laureats', initial);
      mockLaureats([
        { ...sourceLaureat(), 'Code territoire': 'reprise-publication' },
      ]);
      const preview = await verifySync('laureats');
      const syncStorage = syncApp.get(SupabaseService);
      const save = syncStorage.saveInStorage.bind(syncStorage);
      const failActivation = vi
        .spyOn(syncStorage, 'saveInStorage')
        .mockImplementation((args) =>
          args.path.endsWith('/active.json')
            ? Promise.resolve(failure('UPLOAD_STORAGE_ERROR'))
            : save(args)
        );
      expect(await sync.sync('laureats', true, auditContext)).toEqual({
        success: false,
        error: 'STORAGE_ERROR',
      });
      const stored = await data.getLaureats(preview.version);
      expect(stored.success).toBe(true);
      expect(await data.getLaureats()).toEqual({
        success: true,
        data: initial,
      });
      failActivation.mockRestore();
      const writes = vi.spyOn(syncStorage, 'saveInStorage');
      const results = await Promise.all([
        sync.sync('laureats', true, auditContext),
        sync.sync('laureats', true, auditContext),
      ]);
      expect(results.every((result) => result.success)).toBe(true);
      expect(
        results.map((result) => result.success && result.data.status).sort()
      ).toEqual(['published', 'unchanged']);
      expect(writes.mock.calls.map(([args]) => args.path)).toEqual([
        'laureats/active.json',
      ]);
      expect(await data.getLaureats()).toEqual(stored);
    });

    test('une publication administrative identique garde son identité et sa date pendant la synchronisation', async () => {
      mockLaureats([sourceLaureat()]);
      const prepared = await admin.plans.plans.electrificationData.prepare(
        laureatsInput()
      );
      await publish('laureats', prepared.data);
      const save = vi.spyOn(syncApp.get(SupabaseService), 'saveInStorage');
      expect(await sync.sync('laureats', true, auditContext)).toMatchObject({
        success: true,
        data: { version: prepared.data.version, status: 'unchanged' },
      });
      expect(save).not.toHaveBeenCalled();
      expect(await data.getLaureats()).toEqual({
        success: true,
        data: prepared.data,
      });
    });

    test('la version suit le contenu validé et les mappings TeT, pas la révision ni les clés JSON', async () => {
      await publish('catalogue', catalogue());
      const read = mockGrist();
      const first = await verifySync('catalogue');
      expect(await sync.sync('catalogue', true, auditContext)).toMatchObject({
        success: true,
      });
      const active = await data.getCatalogue();
      if (!active.success) throw new Error(active.error);
      await publishReferences(['test-indicateur']);
      const changed = structuredClone(active.data);
      const next = await verifySync('catalogue');
      expect(next.sourceRevision).toBe(first.sourceRevision);
      expect(next.version).not.toBe(first.version);
      const reordered = Object.fromEntries(Object.entries(changed).reverse());
      await publish('catalogue', {
        ...reordered,
        version: randomUUID(),
      } as ElectrificationConfig);
      expect((await verifySync('catalogue')).version).toBe(next.version);
      read.mockRestore();
      const tables = sourceTables();
      tables.Actions[0].fields.Descriptif = ' Description actualisée '; // trim du DTO validé
      mockGrist(tables, false, 'nouvelle-revision');
      expect(await verifySync('catalogue')).toMatchObject({
        version: next.version,
        sourceRevision: 'nouvelle-revision',
      });
    });

    test('reprend la périodicité publiée dans TeT même si Grist décrit encore un recensement ponctuel', async () => {
      const old = await data.getCatalogue();
      await storage.client.storage
        .from(electrificationStorageConfig.bucket)
        .remove(['catalogue/active.json']);
      try {
        const tables = sourceTables();
        tables.Actions[0].fields.Titre =
          'Action lue lors de la première publication';
        const definitions = await publishReferences(['9.1.1-a', '11.1.1-a']);
        tables.Indicateurs = ['9.1.1-a', '11.1.1-a'].map((code, index) => ({
          id: index + 1,
          fields: {
            Code: code,
            Unite: 'nb',
            Frequence: 'Ponctuelle (une fois)',
          },
        }));
        tables.Actions[0].fields.Indicateurs = ['L', 1, 2];
        mockGrist(tables);
        const preview = await verifySync('catalogue');
        expect(preview.published).toBe(false);
        expect(await data.getCatalogue()).toEqual({
          success: false,
          error: 'DATA_UNAVAILABLE',
        });
        expect(await sync.sync('catalogue', true, auditContext)).toMatchObject({
          success: true,
          data: { published: true },
        });
        const published = await data.getCatalogue();
        expect(published).toMatchObject({
          success: true,
          data: {
            version: preview.version,
            fiches: {
              actions: [
                expect.objectContaining({
                  code: '1.1.1',
                  champs: expect.objectContaining({
                    titre: 'Action lue lors de la première publication',
                  }),
                }),
              ],
              indicateurs: ['9.1.1-a', '11.1.1-a'].map((code, index) => ({
                code,
                type: 'quantitatif',
                unite: 'nb',
                periodicite: 'annuelle',
                validation: 'validated',
                identifiantReferentiel:
                  definitions[index].identifiantReferentiel,
              })),
            },
          },
        });
        expect(await sync.sync('catalogue', true, auditContext)).toMatchObject({
          success: true,
          data: { version: preview.version, status: 'unchanged' },
        });
        expect(await data.getCatalogue()).toEqual(published);
      } finally {
        if (old.success) await publish('catalogue', old.data);
      }
    });

    test('ne dépend pas des métadonnées Grist d’un indicateur sans référence TeT', async () => {
      const tables = sourceTables();
      mockGrist(tables);
      const initial = await verifySync('catalogue');
      tables.Indicateurs[0].fields.Unite = '';
      Reflect.deleteProperty(tables.Indicateurs[0].fields, 'Frequence');

      const next = await verifySync('catalogue');

      expect(next.version).toBe(initial.version);
    });

    test('une correspondance retirée redevient en attente sans modifier le catalogue déjà publié', async () => {
      await publish('catalogue', catalogue());
      await publishReferences(['test-indicateur']);
      mockGrist();
      expect(await sync.sync('catalogue', true, auditContext)).toMatchObject({
        success: true,
      });
      const previousCatalogue = await data.getCatalogue();
      await db.db
        .update(indicateurReferenceExterneTable)
        .set({ indicateurId: null })
        .where(
          and(
            eq(
              indicateurReferenceExterneTable.source,
              electrificationGristConfig.catalogue.indicateurReferenceSource
            ),
            eq(indicateurReferenceExterneTable.codeExterne, 'test-indicateur')
          )
        );
      const preview = await admin.plans.plans.electrificationData.prepare({
        kind: 'catalogue',
        version: randomUUID(),
      });
      expect(preview).toMatchObject({
        valid: true,
        data: {
          fiches: {
            indicateurs: [
              {
                code: 'test-indicateur',
                validation: 'pending',
                identifiantReferentiel: null,
                unite: null,
                periodicite: null,
              },
            ],
          },
        },
      });
      expect(await data.getCatalogue()).toEqual(previousCatalogue);
    });

    test('ne réinitialise pas un catalogue dont la version active est introuvable', async () => {
      const initial = catalogue();
      await publish('catalogue', initial);
      await storage.saveInStorage({
        bucket: electrificationStorageConfig.bucket,
        path: 'catalogue/active.json',
        file: JSON.stringify({ version: 'missing-version' }),
        mimeType: 'application/json',
        metadata: { version: 'missing-version' },
      });
      try {
        const read = mockGrist();
        expect(await sync.sync('catalogue', true, auditContext)).toEqual({
          success: false,
          error: 'INVALID_DATA',
        });
        expect(
          read.mock.calls.filter(([url]) =>
            String(url).includes('grist.numerique.gouv.fr')
          )
        ).toHaveLength(0);
      } finally {
        await publish('catalogue', initial);
      }
    });

    test('le workflow synchronise le catalogue sans remplacer les lauréats ni les versions précédentes', async () => {
      const previousCatalogue = catalogue();
      const previousLaureats = laureats();
      await publish('catalogue', previousCatalogue);
      await publish('laureats', previousLaureats);
      mockGrist();
      const preview = await verifySync('catalogue');
      expect(await sync.sync('catalogue', true, auditContext)).toMatchObject({
        success: true,
        data: { count: 1, published: true },
      });
      expect(await data.getCatalogue(preview.version)).toMatchObject({
        success: true,
        data: {
          version: preview.version,
          fiches: { actions: [expect.objectContaining({ code: '1.1.1' })] },
        },
      });
      expect(await data.getCatalogue(previousCatalogue.version)).toEqual({
        success: true,
        data: previousCatalogue,
      });
      expect(await data.getLaureats()).toEqual({
        success: true,
        data: previousLaureats,
      });
    });

    test.each([
      { label: 'vide', rows: [] },
      { label: 'colonnes absentes', rows: [{ Nom: 'Territoire' }] },
      {
        label: 'identifiant absent',
        rows: [{ 'Code territoire': 'test', 'Nature du périmètre': 'EPCI' }],
      },
      {
        label: 'nature inconnue',
        rows: [
          {
            'Code territoire': 'test',
            'Identifiant public': '123',
            'Nature du périmètre': 'Inconnue',
          },
        ],
      },
      {
        label: 'identifiant numérique',
        rows: [
          {
            'Code territoire': 'test',
            'Identifiant public': 123,
            'Nature du périmètre': 'EPCI',
          },
        ],
      },
      {
        label: 'groupement sans porteur',
        rows: [
          {
            'Code territoire': 'test',
            'Identifiant public': '',
            'Nature du périmètre': 'Groupement de collectivités',
          },
        ],
      },
    ])(
      'refuse une source $label sans toucher à la version active',
      async ({ rows }) => {
        const initial = laureats();
        await publish('laureats', initial);
        mockLaureats(rows);
        expect(await sync.sync('laureats', true, auditContext)).toEqual({
          success: false,
          error: 'INVALID_SOURCE',
        });
        expect(await data.getLaureats()).toEqual({
          success: true,
          data: initial,
        });
      }
    );

    test.each([
      { options: { changed: true }, error: 'SOURCE_CHANGED' },
      { options: { status: 403 }, error: 'SOURCE_UNAVAILABLE' },
      { options: { status: 302 }, error: 'SOURCE_UNAVAILABLE' },
    ])(
      'ne publie pas si la lecture échoue ($error)',
      async ({ options, error }) => {
        const initial = laureats();
        await publish('laureats', initial);
        mockLaureats([sourceLaureat()], options);
        expect(await sync.sync('laureats', true, auditContext)).toEqual({
          success: false,
          error,
        });
        expect(await data.getLaureats()).toEqual({
          success: true,
          data: initial,
        });
      }
    );

    test('refuse les codes et collectivités dupliqués, exclut les identifiants inconnus', async () => {
      const initial = laureats();
      await publish('laureats', initial);
      const rows = [sourceLaureat(), sourceLaureat()];
      mockLaureats(rows);
      expect(await sync.sync('laureats', true, auditContext)).toEqual({
        success: false,
        error: 'INVALID_SOURCE',
      });
      rows[1]['Code territoire'] = 'autre';
      rows[1]['Identifiant public'] = 'inconnu';
      expect(await sync.sync('laureats', false, auditContext)).toMatchObject({
        success: true,
        data: { count: 1, excluded: 1, published: false },
      });
      rows[1]['Identifiant public'] = siren;
      expect(await sync.sync('laureats', true, auditContext)).toEqual({
        success: false,
        error: 'INVALID_DATA',
      });
      expect(await data.getLaureats()).toEqual({
        success: true,
        data: initial,
      });
    });

    test('résout les communes par code INSEE et les EPCI par SIREN, sans reprendre les anciens porteurs', async () => {
      const commune = await addTestCollectiviteAndUser(db, {
        user: {},
        collectivite: { type: 'commune', communeCode: 'ZZ001' },
      });
      onTestFinished(commune.cleanup);
      const initial = laureats();
      initial.laureats = [
        { reference: 'groupement-sans-porteur', collectiviteId },
      ];
      await publish('laureats', initial);
      mockLaureats([
        sourceLaureat(),
        {
          'Code territoire': 'commune-source',
          'Identifiant public': 'ZZ001',
          'Nature du périmètre': 'Commune',
        },
        {
          'Code territoire': 'groupement-sans-porteur',
          'Identifiant public': null,
          'Nature du périmètre': 'Groupement de collectivités',
        },
        {
          ...sourceLaureat(),
          'Code territoire': 'type-incohérent',
          'Nature du périmètre': 'Commune',
        },
        {
          ...sourceLaureat(),
          'Code territoire': 'sans-identifiant',
          'Identifiant public': '',
        },
      ]);
      const prepared = await admin.plans.plans.electrificationData.prepare(
        laureatsInput()
      );
      expect(prepared).toMatchObject({
        valid: true,
        excluded: 3,
        data: {
          laureats: [
            {
              reference: 'commune-source',
              collectiviteId: commune.collectivite.id,
            },
            { reference: 'reference-stable', collectiviteId },
          ],
        },
      });
      await publish('laureats', prepared.data);
      expect(await data.getLaureats()).toEqual({
        success: true,
        data: prepared.data,
      });
    });

    test.each([
      { label: 'absente', columns: laureatColumns.slice(1) },
      {
        label: 'ambiguë',
        columns: [
          ...laureatColumns,
          { id: 'autre_code', fields: { label: 'Code territoire' } },
        ],
      },
    ])(
      'refuse une colonne source $label sans modifier la publication',
      async ({ columns }) => {
        const initial = laureats();
        await publish('laureats', initial);
        mockLaureats([sourceLaureat()], { columns });
        expect(await sync.sync('laureats', true, auditContext)).toEqual({
          success: false,
          error: 'INVALID_SOURCE',
        });
        expect(await data.getLaureats()).toEqual({
          success: true,
          data: initial,
        });
      }
    );

    test('authentifie la lecture privée sans suivre de redirection', async () => {
      const config = syncApp.get(ConfigurationService);
      const get = ConfigurationService.prototype.get.bind(config);
      vi.spyOn(config, 'get').mockImplementation((key) =>
        key === 'GRIST_API_KEY'
          ? 'synthetic-grist-token'
          : key === 'ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID'
          ? laureatsDocumentId
          : get(key)
      );
      const read = mockLaureats([sourceLaureat()]);
      expect(await sync.sync('laureats', false, auditContext)).toMatchObject({
        success: true,
      });
      const sourceCalls = read.mock.calls.filter(([url]) =>
        String(url).includes('grist.numerique.gouv.fr')
      );
      expect(sourceCalls).toHaveLength(4);
      for (const [, options] of sourceCalls)
        expect(options).toMatchObject({
          redirect: 'error',
          headers: { Authorization: 'Bearer synthetic-grist-token' },
        });
    });
  });
});
