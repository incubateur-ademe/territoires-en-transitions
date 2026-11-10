import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { getAnonUser, getServiceRoleUser } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { getAuthUserFromUserCredentials } from '../../../../test/get-auth-user-from-credentials';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { CollectiviteRole } from '@tet/domain/users';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { and, eq, sql } from 'drizzle-orm';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';
import {
  SNBC3_BUCKET,
  SNBC3_LAST_IMPORT_PATH,
  SNBC3_MANIFEST_PATH,
  SNBC3_METHODOLOGIE_PATH,
  SNBC3_WORKBOOK_PATH,
  Snbc3ReleaseStorageService,
} from './snbc3-release-storage.service';
import { SNBC3_FIXTURE_METHODOLOGIE } from './snbc3-release.test-fixture';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { getQueueToken } from '@nestjs/bullmq';
import { failure } from '@tet/backend/utils/result.type';
import { Job, Queue } from 'bullmq';
import {
  ImportTrajectoireSnbc3Report,
  Snbc3LastImport,
} from './import-trajectoire-snbc3.input';
import { IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME } from './import-trajectoire-snbc3.queue';
import ManageIndicateurValeursService from '@tet/backend/indicateurs/valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import ExportIndicateursService from '@tet/backend/indicateurs/indicateurs/export-indicateurs/export-indicateurs.service';
import { Workbook } from 'exceljs';
import { Snbc3ArtifactReader } from './snbc3-artifact.reader';
import { Snbc3SourceMetadonneeRepository } from './snbc3-source-metadonnee.repository';
import {
  buildSnbc3Parquet,
  FixtureSnbc3ArtifactReader,
  getSnbc3DefaultValeur,
  Snbc3TerritoireFixture,
} from './snbc3-release.test-fixture';

const randomCode = (length: number) =>
  `9${Math.random()
    .toString()
    .slice(2, 2 + length - 1)}`;

/** Valeur importée attendue d'un code : ×1000, arrondie à 2 décimales. */
const toKilo = (code: string, annee: number) =>
  Math.round(getSnbc3DefaultValeur(code, annee) * 1000 * 100) / 100;

describe("Route d'import de la trajectoire SNBC 3", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let database: DatabaseService;
  const snbc3Repository = new FixtureSnbc3ArtifactReader();

  /** EPCI full de l'Hexagone. */
  let hexagoneEpci: Collectivite;
  /** EPCI de l'Hexagone sous secret statistique : pas de `cons_agr`. */
  let epciWithoutAgriculture: Collectivite;
  let dromEpci: Collectivite;
  let paris: Collectivite;
  let territoires: Snbc3TerritoireFixture[];
  const unknownSiren = randomCode(9);

  /**
   * Met l'import en file par la mutation, attend la fin du job, et renvoie
   * son rapport ; un job en échec lève son code d'erreur.
   */
  const runImport = async (input: {
    commit: string;
    version: string;
    collectiviteIds?: number[];
  }) => {
    const { jobId } = await router
      .createCaller({ user: getServiceRoleUser() })
      .indicateurs.trajectoires.snbc3.import(input);
    const queue = app.get<Queue>(
      getQueueToken(IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME)
    );
    await vi.waitFor(
      async () => {
        const state = await queue.getJobState(jobId);
        if (state !== 'completed' && state !== 'failed') {
          throw new Error(`job ${jobId} : ${state}`);
        }
      },
      { timeout: 120_000, interval: 200 }
    );
    // Relu une fois terminé : un job lu avant la fin n'a pas encore de
    // `returnvalue`, même si son état, lu juste après, est `completed`.
    const job = (await queue.getJob(jobId)) as Job;
    if (job.failedReason) throw new Error(job.failedReason);
    return job.returnvalue as ImportTrajectoireSnbc3Report;
  };

  /**
   * Met le bucket et la métadonnée dans l'état que laisse un import complet de
   * la release, sans toucher aux valeurs : un import complet supprimerait la
   * trajectoire des collectivités hors de ce fichier. Les rejeux partiels de
   * cette release sont alors acceptés.
   */
  const markAsImported = async ({
    sha,
    version,
  }: {
    sha: string;
    version: string;
  }) => {
    const release = await snbc3Repository.readRelease(sha, version);
    if (!release.success) throw new Error(release.error);
    const storage = app.get(Snbc3ReleaseStorageService);
    const marked = await storage.markReleasePending(release.data);
    if (!marked.success) throw new Error(marked.error);
    const stored = await storage.storeReleaseFiles(release.data);
    if (!stored.success) throw new Error(stored.error);
    await app
      .get(Snbc3SourceMetadonneeRepository)
      .upsertMetadonnee({ dateVersion: release.data.date });
  };

  const collectiviteIds = () =>
    [hexagoneEpci, epciWithoutAgriculture, dromEpci, paris].map(({ id }) => id);

  const listSnbc3Valeurs = (collectiviteId: number) =>
    database.db
      .select({
        id: indicateurValeurTable.id,
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
        dateValeur: indicateurValeurTable.dateValeur,
        objectif: indicateurValeurTable.objectif,
        objectifCommentaire: indicateurValeurTable.objectifCommentaire,
        calculAuto: indicateurValeurTable.calculAuto,
        metadonneeId: indicateurValeurTable.metadonneeId,
      })
      .from(indicateurValeurTable)
      .innerJoin(
        indicateurDefinitionTable,
        eq(indicateurDefinitionTable.id, indicateurValeurTable.indicateurId)
      )
      .innerJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurSourceMetadonneeTable.id,
          indicateurValeurTable.metadonneeId
        )
      )
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurSourceMetadonneeTable.sourceId, 'snbc3')
        )
      );

  const findValeur = async (
    collectiviteId: number,
    identifiant: string,
    annee = 2021
  ) =>
    (await listSnbc3Valeurs(collectiviteId)).find(
      (v) => v.identifiant === identifiant && v.dateValeur === `${annee}-01-01`
    );

  const getStoredObject = async (path: string) => {
    const {
      rows: [object],
    } = await database.db.execute<{
      user_metadata: Record<string, string> | null;
      updated_at: string;
    }>(
      sql`select user_metadata, updated_at from storage.objects where bucket_id = ${SNBC3_BUCKET} and name = ${path}`
    );
    return object;
  };
  const getStoredWorkbook = () => getStoredObject(SNBC3_WORKBOOK_PATH);

  const downloadJson = async (path: string) => {
    const { data, error } = await app
      .get(SupabaseService)
      .client.storage.from(SNBC3_BUCKET)
      .download(path);
    if (error) throw error;
    return JSON.parse(await data.text()) as unknown;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    database = await getTestDatabase(app);

    const reader = app.get(Snbc3ArtifactReader);
    const spy = vi
      .spyOn(reader, 'readRelease')
      .mockImplementation((commit, version) =>
        snbc3Repository.readRelease(commit, version)
      );

    const create = async (args: Partial<Collectivite>) =>
      addTestCollectivite(database, args);
    const created = await Promise.all([
      create({ siren: randomCode(9), natureInsee: 'CC' }),
      create({ siren: randomCode(9), natureInsee: 'CA' }),
      create({ siren: randomCode(9), natureInsee: 'CC' }),
      create({ type: 'commune', communeCode: randomCode(5) }),
    ]);
    [hexagoneEpci, epciWithoutAgriculture, dromEpci, paris] = created.map(
      ({ collectivite }) => collectivite
    );

    territoires = [
      {
        code: hexagoneEpci.siren as string,
        valeur: (code) =>
          ['emi_en', 'cons_dech'].includes(code) ? null : undefined,
      },
      {
        code: epciWithoutAgriculture.siren as string,
        valeur: (code) => (code === 'cons_agr' ? null : undefined),
      },
      { code: dromEpci.siren as string, zone: 'REUNION' },
      { code: paris.communeCode as string, niveauGeo: 'COMMUNE' },
      { code: unknownSiren },
    ];

    return async () => {
      spy.mockRestore();
      await Promise.all(created.map(({ cleanup }) => cleanup()));
    };
  });

  test('refuse un appel hors service role', async () => {
    const commit = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires),
    });
    await expect(
      router
        .createCaller({ user: getAnonUser() })
        .indicateurs.trajectoires.snbc3.import({
          commit: commit.sha,
          version: commit.version,
        })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  // Imports complets : ils échouent avant toute écriture.
  test('échoue sans classeur standalone dans la release', async () => {
    const commit = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires),
      withWorkbook: false,
    });
    await expect(
      runImport({ commit: commit.sha, version: commit.version })
    ).rejects.toThrow('SNBC3_ARTIFACT_NOT_FOUND');
    expect(await listSnbc3Valeurs(hexagoneEpci.id)).toEqual([]);
    expect(
      (await downloadJson(SNBC3_LAST_IMPORT_PATH)) as Snbc3LastImport
    ).toMatchObject({
      status: 'failed',
      commit: commit.sha,
      error: 'SNBC3_ARTIFACT_NOT_FOUND',
    });
  });

  test('échoue sur un parquet sans les colonnes du contrat', async () => {
    const commit = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires, { withoutColumn: 'qualite' }),
    });
    await expect(
      runImport({ commit: commit.sha, version: commit.version })
    ).rejects.toThrow('SNBC3_PARQUET_SCHEMA_INVALID');
  });

  test('refuse un rejeu partiel sur une autre release que la dernière importée', async () => {
    const imported = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires),
    });
    await markAsImported(imported);
    const other = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires),
    });
    const caller = router.createCaller({ user: getServiceRoleUser() });

    await expect(
      caller.indicateurs.trajectoires.snbc3.import({
        commit: other.sha,
        version: other.version,
        collectiviteIds: collectiviteIds(),
      })
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    // Même commit, autre version de release.
    await expect(
      caller.indicateurs.trajectoires.snbc3.import({
        commit: imported.sha,
        version: '9.9',
        collectiviteIds: collectiviteIds(),
      })
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    expect(await listSnbc3Valeurs(hexagoneEpci.id)).toEqual([]);
  });

  test('importe la release, puis la remplace par la suivante', async () => {
    // Une valeur SNBC 2 ne doit pas bouger.
    await database.db
      .insert(indicateurSourceTable)
      .values({ id: 'snbc', libelle: 'SNBC', ordreAffichage: 2 })
      .onConflictDoNothing();
    const [snbc2] = await database.db
      .insert(indicateurSourceMetadonneeTable)
      .values({ sourceId: 'snbc', dateVersion: '2024-07-11T00:00:00' })
      .returning();
    const [ca] = await database.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.ca'));
    const [snbc2Valeur] = await database.db
      .insert(indicateurValeurTable)
      .values({
        collectiviteId: hexagoneEpci.id,
        indicateurId: ca.id,
        metadonneeId: snbc2.id,
        dateValeur: '2021-01-01',
        objectif: 4242,
      })
      .returning();
    onTestFinished(async () => {
      await database.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.id, snbc2Valeur.id));
      await database.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, snbc2.id));
    });

    const v1 = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires),
      date: '2026-11-06T12:24:49.000Z',
    });
    await markAsImported(v1);
    const workbookBefore = await getStoredWorkbook();
    const report = await runImport({
      commit: v1.sha,
      version: v1.version,
      collectiviteIds: collectiviteIds(),
    });

    expect(report).toMatchObject({
      commit: v1.sha,
      territoireCount: 5,
      unmatchedTerritoires: [unknownSiren],
      errors: [],
      valeurs: { updated: 0, unchanged: 0, deleted: 0 },
    });
    expect(report.epciIdsWithoutTrajectoire).not.toContain(hexagoneEpci.id);
    expect(report.valeurs.created).toBeGreaterThan(0);

    const [metadonnee] = await database.db
      .select()
      .from(indicateurSourceMetadonneeTable)
      .where(eq(indicateurSourceMetadonneeTable.sourceId, 'snbc3'));
    expect(metadonnee).toMatchObject({
      id: report.metadonneeId,
      nomDonnees: 'SNBC3',
    });
    // Celle de la release : un rejeu partiel n'y touche pas.
    // `date_version` est un timestamp sans fuseau, en UTC.
    expect(metadonnee.dateVersion.replace(' ', 'T').slice(0, 19)).toBe(
      v1.date.slice(0, 19)
    );

    // Sous-secteurs : ×1000, signes, construction.
    expect((await findValeur(hexagoneEpci.id, 'cae_1.ih'))?.objectif).toBe(
      toKilo('emi_ind_const', 2021)
    );
    expect((await findValeur(hexagoneEpci.id, 'cae_2.kh'))?.objectif).toBe(
      toKilo('cons_ind_const', 2021)
    );
    expect((await findValeur(hexagoneEpci.id, 'cae_63.b'))?.objectif).toBe(
      -(toKilo('emi_UTCATF_for', 2021) + toKilo('emi_UTCATF_solfor', 2021))
    );
    expect(
      (await findValeur(hexagoneEpci.id, 'cae_63.b'))?.objectif
    ).toBeGreaterThan(0);
    expect(
      (await findValeur(hexagoneEpci.id, 'cae_63.ca'))?.objectif
    ).toBeLessThan(0);
    expect(await findValeur(hexagoneEpci.id, 'cae_1.j')).toBeUndefined();

    // Commentaires.
    const missing = ' - Indicateurs manquants : cae_1.j, cae_2.j';
    expect(
      (await findValeur(hexagoneEpci.id, 'cae_1.ca'))?.objectifCommentaire
    ).toBe(`Trajectoire SNBC 3 recalée sur OREC 2021${missing}`);
    expect(
      (await findValeur(hexagoneEpci.id, 'cae_1.csc'))?.objectifCommentaire
    ).toBe(`Trajectoire SNBC 3 non recalée${missing}`);
    expect(
      (await findValeur(dromEpci.id, 'cae_1.ca'))?.objectifCommentaire
    ).toBe('Trajectoire SNBC 3 recalée sur CITEPA IGT 2021');

    // Émissions nettes : Hexagone seulement ; pas d'UTCATF aux DROM.
    expect(await findValeur(hexagoneEpci.id, 'cae_1.aa')).toBeDefined();
    expect(await findValeur(dromEpci.id, 'cae_1.aa')).toBeUndefined();
    expect(await findValeur(dromEpci.id, 'cae_63.b')).toBeUndefined();

    // Totaux recalculés par les formules.
    const industrie = await findValeur(hexagoneEpci.id, 'cae_1.i');
    expect(industrie?.calculAuto).toBe(true);
    expect(industrie?.objectif).toBeCloseTo(
      [
        'emi_ind_met',
        'emi_ind_chim',
        'emi_ind_nonmet',
        'emi_ind_iaa',
        'emi_ind_equip',
        'emi_ind_pap',
        'emi_ind_ind_autres',
        'emi_ind_const',
      ].reduce((sum, code) => sum + toKilo(code, 2021), 0),
      2
    );
    expect(await findValeur(hexagoneEpci.id, 'cae_2.a')).toBeDefined();
    expect(
      await findValeur(epciWithoutAgriculture.id, 'cae_2.a')
    ).toBeUndefined();
    expect(
      await findValeur(epciWithoutAgriculture.id, 'cae_2.e')
    ).toBeDefined();
    expect(await findValeur(paris.id, 'cae_1.ca')).toBeDefined();

    // Un rejeu partiel ne réécrit pas le classeur ; il suit l'import.
    expect(await getStoredWorkbook()).toEqual(workbookBefore);
    const lastImport = (await downloadJson(
      SNBC3_LAST_IMPORT_PATH
    )) as Snbc3LastImport;
    expect(lastImport).toMatchObject({
      status: 'done',
      commit: v1.sha,
      collectiviteIds: collectiviteIds(),
      report: { commit: v1.sha, unmatchedTerritoires: [unknownSiren] },
    });
    expect(lastImport.finishedAt).toBeDefined();

    // SNBC 2 intacte.
    const [snbc2ValeurAfter] = await database.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, snbc2Valeur.id));
    expect(snbc2ValeurAfter.objectif).toBe(4242);

    // Réimport du même commit : idempotent.
    const before = await listSnbc3Valeurs(hexagoneEpci.id);
    const replay = await runImport({
      commit: v1.sha,
      version: v1.version,
      collectiviteIds: collectiviteIds(),
    });
    // Rien n'a changé : aucune valeur n'est réécrite.
    expect(replay.valeurs).toEqual({
      created: 0,
      updated: 0,
      unchanged: report.valeurs.created,
      deleted: 0,
    });
    expect(await listSnbc3Valeurs(hexagoneEpci.id)).toEqual(
      expect.arrayContaining(before)
    );

    // Nouvelle livraison : la construction devient inconnue pour l'EPCI.
    const v2 = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(
        territoires.map((t) =>
          t.code === hexagoneEpci.siren
            ? {
                ...t,
                valeur: (code: string, annee: number) =>
                  ['emi_en', 'cons_dech', 'emi_ind_const'].includes(code)
                    ? null
                    : code === 'emi_res_ch_MI'
                    ? getSnbc3DefaultValeur(code, annee) * 2
                    : undefined,
              }
            : t
        )
      ),
    });
    await markAsImported(v2);
    const report2 = await runImport({
      commit: v2.sha,
      version: v2.version,
      collectiviteIds: collectiviteIds(),
    });
    expect(report2.metadonneeId).toBe(report.metadonneeId);
    // Construction : 3 années supprimées, et `cae_1.ih` entre dans les
    // indicateurs manquants : le commentaire de toutes les valeurs de l'EPCI
    // change (chauffage résidentiel compris, modifié). Les autres territoires
    // sont inchangés.
    const hexagoneImportees = (await listSnbc3Valeurs(hexagoneEpci.id)).filter(
      (v) => !v.calculAuto
    );
    expect(report2.valeurs).toEqual({
      created: 0,
      updated: hexagoneImportees.length,
      unchanged: report.valeurs.created - hexagoneImportees.length - 3,
      deleted: 3,
    });

    const after = await listSnbc3Valeurs(hexagoneEpci.id);
    expect(new Set(after.map((v) => v.metadonneeId))).toEqual(
      new Set([report.metadonneeId])
    );
    const idBefore = before.find(
      (v) => v.identifiant === 'cae_1.ca' && v.dateValeur === '2021-01-01'
    )?.id;
    expect(
      after.find(
        (v) => v.identifiant === 'cae_1.ca' && v.dateValeur === '2021-01-01'
      )?.id
    ).toBe(idBefore);
    const chauffage = after.find(
      (v) => v.identifiant === 'cae_1.ca' && v.dateValeur === '2021-01-01'
    );
    expect(chauffage?.objectif).toBeCloseTo(
      2 * toKilo('emi_res_ch_MI', 2021),
      2
    );
    // Le total résidentiel suit la valeur modifiée.
    const residentielBefore = before.find(
      (v) => v.identifiant === 'cae_1.c' && v.dateValeur === '2021-01-01'
    );
    expect(
      (await findValeur(hexagoneEpci.id, 'cae_1.c'))?.objectif
    ).toBeCloseTo(
      (residentielBefore?.objectif ?? 0) + toKilo('emi_res_ch_MI', 2021),
      2
    );
    expect(await findValeur(hexagoneEpci.id, 'cae_1.ih')).toBeUndefined();
    expect(
      (await findValeur(hexagoneEpci.id, 'cae_1.i'))?.objectif
    ).toBeCloseTo(
      (industrie?.objectif ?? 0) - toKilo('emi_ind_const', 2021),
      2
    );
    expect(
      ((await downloadJson(SNBC3_LAST_IMPORT_PATH)) as Snbc3LastImport).report
        ?.commit
    ).toBe(v2.sha);
    expect(
      await database.db
        .select({ id: indicateurSourceMetadonneeTable.id })
        .from(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.sourceId, 'snbc3'))
    ).toHaveLength(1);
  });

  test('isole un territoire en échec sans bloquer son lot', async () => {
    const valeursService = app.get(ManageIndicateurValeursService);
    const replace =
      valeursService.replaceMetadonneeValeurs.bind(valeursService);
    const spy = vi
      .spyOn(valeursService, 'replaceMetadonneeValeurs')
      .mockImplementation(async (input) => {
        if (input.collectiviteIds.includes(paris.id)) {
          return failure('INVALID_VALUE', new Error('échec simulé'));
        }
        return replace(input);
      });
    onTestFinished(() => spy.mockRestore());

    const release = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires),
    });
    await markAsImported(release);
    const report = await runImport({
      commit: release.sha,
      version: release.version,
      collectiviteIds: collectiviteIds(),
    });

    expect(report.errors).toEqual([
      {
        territoire: paris.communeCode,
        collectiviteId: paris.id,
        message: 'échec simulé',
      },
    ]);
    // Le lot est rejoué territoire par territoire : les autres passent.
    const writtenCollectiviteIds = spy.mock.calls.map(
      ([input]) => input.collectiviteIds
    );
    expect(writtenCollectiviteIds[0]).toEqual(collectiviteIds());
    expect(writtenCollectiviteIds.slice(1)).toEqual(
      collectiviteIds().map((id) => [id])
    );
    expect(
      ((await downloadJson(SNBC3_LAST_IMPORT_PATH)) as Snbc3LastImport).status
    ).toBe('done_with_errors');
  });

  test('arrête l’import sur une panne de la base, sans enregistrer la release', async () => {
    const valeursService = app.get(ManageIndicateurValeursService);
    const replace =
      valeursService.replaceMetadonneeValeurs.bind(valeursService);
    const spy = vi
      .spyOn(valeursService, 'replaceMetadonneeValeurs')
      .mockImplementation(async (input) => {
        if (input.collectiviteIds.includes(paris.id)) {
          return failure('DATABASE_ERROR', new Error('connexion perdue'));
        }
        return replace(input);
      });
    onTestFinished(() => spy.mockRestore());

    const storage = app.get(Snbc3ReleaseStorageService);
    const metadonnees = app.get(Snbc3SourceMetadonneeRepository);
    const metadonneeId = await metadonnees.findMetadonneeId();
    const getDateVersion = async () =>
      metadonneeId === null
        ? null
        : (
            await database.db
              .select({
                dateVersion: indicateurSourceMetadonneeTable.dateVersion,
              })
              .from(indicateurSourceMetadonneeTable)
              .where(eq(indicateurSourceMetadonneeTable.id, metadonneeId))
          )[0]?.dateVersion;
    const previous = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires),
    });
    await markAsImported(previous);
    const importedBefore = await storage.getImportedRelease();
    const dateVersionBefore = await getDateVersion();

    // Import complet : la panne survient au premier lot, avant que les
    // collectivités absentes de la release ne soient vidées.
    const release = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(territoires),
      date: '2030-01-01T00:00:00.000Z',
    });
    await expect(
      runImport({ commit: release.sha, version: release.version })
    ).rejects.toThrow('SERVER_ERROR');

    // Plus de rejeu territoire par territoire après la panne.
    expect(spy).toHaveBeenCalledTimes(1);
    expect(
      (await downloadJson(SNBC3_LAST_IMPORT_PATH)) as Snbc3LastImport
    ).toMatchObject({
      status: 'failed',
      commit: release.sha,
      error: 'connexion perdue',
    });
    // Le bucket et la métadonnée désignent toujours la release précédente.
    expect(await storage.getImportedRelease()).toEqual(importedBefore);
    expect(await getDateVersion()).toEqual(dateVersionBefore);
    // Les valeurs mélangent deux releases : pas de rejeu partiel de la
    // précédente avant un import complet.
    await expect(
      router
        .createCaller({ user: getServiceRoleUser() })
        .indicateurs.trajectoires.snbc3.import({
          commit: previous.sha,
          version: previous.version,
          collectiviteIds: collectiviteIds(),
        })
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
  });

  describe('sans le feature flag', () => {
    const mockFeatureFlag = (enabled: boolean) => {
      const trackingService = app.get(TrackingService);
      const isFeatureEnabled =
        trackingService.isFeatureEnabled.bind(trackingService);
      const spy = vi
        .spyOn(trackingService, 'isFeatureEnabled')
        .mockImplementation(async (feature, ...args) =>
          feature === 'is-trajectoire-snbc3-enabled'
            ? enabled
            : isFeatureEnabled(feature, ...args)
        );
      onTestFinished(() => spy.mockRestore());
    };

    const createLectureCaller = async () => {
      const { user, cleanup } = await addTestUser(database, {
        collectiviteId: hexagoneEpci.id,
        role: CollectiviteRole.LECTURE,
      });
      onTestFinished(cleanup);
      return router.createCaller({
        user: getAuthUserFromUserCredentials(user),
      });
    };

    test('masque les valeurs et la source snbc3', async () => {
      const caller = await createLectureCaller();
      const [ca] = await database.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(
          eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.ca')
        );
      const listValeurs = () =>
        caller.indicateurs.valeurs.list({
          collectiviteId: hexagoneEpci.id,
          identifiantsReferentiel: ['cae_1.ca'],
        });
      const sources = () =>
        caller.indicateurs.sources.available({
          collectiviteId: hexagoneEpci.id,
          indicateurId: ca.id,
        });

      mockFeatureFlag(false);
      const withoutFlag = await listValeurs();
      expect(
        Object.keys(withoutFlag.indicateurs[0]?.sources ?? {})
      ).not.toContain('snbc3');
      expect((await sources()).map(({ id }) => id)).not.toContain('snbc3');

      mockFeatureFlag(true);
      const flag = await listValeurs();
      expect(Object.keys(flag.indicateurs[0]?.sources ?? {})).toContain(
        'snbc3'
      );
      expect((await sources()).map(({ id }) => id)).toContain('snbc3');
    });

    test('retire snbc3 de l’export xlsx des indicateurs', async () => {
      const { user, cleanup } = await addTestUser(database, {
        collectiviteId: hexagoneEpci.id,
        role: CollectiviteRole.LECTURE,
      });
      onTestFinished(cleanup);
      const [ca] = await database.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(
          eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.ca')
        );
      const listExportedTexts = async () => {
        const exported = await app.get(ExportIndicateursService).exportXLSX(
          {
            mode: 'selection',
            collectiviteId: hexagoneEpci.id,
            indicateurIds: [ca.id],
          },
          getAuthUserFromUserCredentials(user)
        );
        const workbook = new Workbook();
        await workbook.xlsx.load(exported?.buffer as ArrayBuffer);
        const texts: string[] = [];
        workbook.eachSheet((sheet) =>
          sheet.eachRow((row) =>
            row.eachCell((cell) => texts.push(String(cell.value)))
          )
        );
        return texts;
      };

      mockFeatureFlag(false);
      expect((await listExportedTexts()).some((t) => t.includes('SNBC3'))).toBe(
        false
      );
      mockFeatureFlag(true);
      expect((await listExportedTexts()).some((t) => t.includes('SNBC3'))).toBe(
        true
      );
    });

    test('exclut snbc3 de la moyenne et du drapeau « open data »', async () => {
      const caller = await createLectureCaller();
      mockFeatureFlag(true);
      const valeur = await findValeur(hexagoneEpci.id, 'cae_1.ca');
      const [ca] = await database.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(
          eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.ca')
        );
      const getMoyenne = () =>
        caller.indicateurs.valeurs.average({
          collectiviteId: hexagoneEpci.id,
          indicateurId: ca.id,
        });

      const before = await getMoyenne();
      // La SNBC 3 n'a que des objectifs : un résultat artificiel entrerait
      // dans la moyenne s'il n'était pas exclu.
      await database.db
        .update(indicateurValeurTable)
        .set({ resultat: 999_999 })
        .where(eq(indicateurValeurTable.id, valeur?.id as number));
      onTestFinished(async () => {
        await database.db
          .update(indicateurValeurTable)
          .set({ resultat: null })
          .where(eq(indicateurValeurTable.id, valeur?.id as number));
      });
      expect(await getMoyenne()).toEqual(before);

      const { data } = await caller.indicateurs.indicateurs.list({
        collectiviteId: hexagoneEpci.id,
        filters: { identifiantsReferentiel: ['cae_1.ca'] },
      });
      expect(data[0]?.hasOpenData).toBe(false);
    });
  });

  /**
   * Sans `collectiviteIds`, l'import vide toutes les collectivités absentes de
   * la release. Sur une base qui a déjà une vraie trajectoire SNBC 3 (base
   * locale après un import réel), ce test la supprimerait : il ne tourne que
   * si les seules valeurs `snbc3` sont celles de ce fichier.
   */
  test('import complet : une collectivité absente perd ses valeurs', async (ctx) => {
    const metadonneeId = await app
      .get(Snbc3SourceMetadonneeRepository)
      .findMetadonneeId();
    const others = metadonneeId
      ? (
          await app
            .get(Snbc3SourceMetadonneeRepository)
            .listCollectiviteIdsWithValeurs(metadonneeId)
        ).filter((id) => !collectiviteIds().includes(id))
      : [];
    if (others.length) {
      ctx.skip(
        `${others.length} autres collectivités ont des valeurs snbc3 : un import complet les supprimerait`
      );
    }

    const full = snbc3Repository.publish({
      parquet: buildSnbc3Parquet(
        territoires.filter((t) => t.code !== dromEpci.siren)
      ),
      date: '2026-11-08T09:00:00.000Z',
    });
    const report = await runImport({
      commit: full.sha,
      version: full.version,
    });

    // Release enregistrée et date de la métadonnée mise à jour.
    expect((await getStoredWorkbook())?.user_metadata).toMatchObject({
      commit: full.sha,
      version: '2.1',
    });
    expect(
      (await getStoredObject(SNBC3_METHODOLOGIE_PATH))?.user_metadata
    ).toMatchObject({
      commit: full.sha,
      version: '2.1',
      name: SNBC3_FIXTURE_METHODOLOGIE,
    });
    expect(await downloadJson(SNBC3_MANIFEST_PATH)).toMatchObject({
      version: '2.1',
      fichiers: expect.arrayContaining([
        expect.objectContaining({ nom: 'resultats_territorialises.parquet' }),
      ]),
    });
    expect(
      await app.get(Snbc3ReleaseStorageService).getImportedRelease()
    ).toEqual({ commit: full.sha, version: '2.1' });
    const [metadonnee] = await database.db
      .select()
      .from(indicateurSourceMetadonneeTable)
      .where(eq(indicateurSourceMetadonneeTable.id, report.metadonneeId));
    expect(metadonnee.dateVersion.replace(' ', 'T').slice(0, 19)).toBe(
      full.date.slice(0, 19)
    );
    const lastImport = (await downloadJson(
      SNBC3_LAST_IMPORT_PATH
    )) as Snbc3LastImport;
    expect(lastImport).toMatchObject({ status: 'done', commit: full.sha });
    expect(lastImport.collectiviteIds).toBeUndefined();

    expect(report.clearedCollectiviteIds).toContain(dromEpci.id);
    expect(await listSnbc3Valeurs(dromEpci.id)).toEqual([]);
    expect(report.epciIdsWithoutTrajectoire).toContain(dromEpci.id);
    expect(await listSnbc3Valeurs(hexagoneEpci.id)).not.toHaveLength(0);
    expect(await listSnbc3Valeurs(epciWithoutAgriculture.id)).not.toHaveLength(
      0
    );
  });
});
