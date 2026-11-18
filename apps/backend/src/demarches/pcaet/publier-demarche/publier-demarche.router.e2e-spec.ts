import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { getDateCivileFrance } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { desc, eq } from 'drizzle-orm';
import { onTestFinished, vi } from 'vitest';
import { failure } from '@tet/backend/utils/result.type';
import { ArchiverDemarchePcaetService } from '../archiver-demarche/archiver-demarche.service';
import { DEMARCHE_PCAET_EXPORTS_BUCKET } from '../generate-exports/demarche-pcaet-exports-storage.service';
import { GenerateDemarchePcaetExportsService } from '../generate-exports/generate-demarche-pcaet-exports.service';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import {
  addTestBibliothequeFichier,
  addTestFichePcaet,
  attachTestPlanToDemarchePcaet,
  cloreTestInstructionPcaet,
  completeTestDiagnosticPcaet,
  completeTestDossierPcaet,
  listTestDemarchePcaetExports,
  loadTestDemarchePcaetExportWorkbook,
} from '../demarches-pcaet.test-fixture';

describe('Publication d’une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshEditor = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectivite: fixture.collectivite,
      user,
      caller: router.createCaller({ user }),
    };
  };

  /** Amène le dossier jusqu'à la finalisation, seul point d'où l'on publie. */
  const instruireDemarche = async (
    caller: ReturnType<TrpcRouter['createCaller']>,
    collectiviteId: number,
    demarcheId: number
  ) => {
    await completeTestDossierPcaet(db, { collectiviteId, demarcheId });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId,
      demarcheId,
    });
    await cloreTestInstructionPcaet(app, db, { collectiviteId, demarcheId });
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Refuser la publication tant que l’instruction n’est pas close', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    // Publier est une étape du cycle : la transition n'existe pas avant la
    // clôture de l'instruction, ce n'est pas une condition non remplie.
    expect(created.transitions.publier.reachable).toBe(false);

    await expect(
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        dateAdoption: '2026-01-15',
      })
    ).rejects.toThrow('TRANSITION_NOT_ALLOWED');
  });

  /**
   * Le `max` du champ de la modale ne protège rien : la mutation s'appelle
   * directement. Une adoption datée du futur avancerait le départ des six ans
   * de validité, donc l'échéance de renouvellement que la plateforme surveille.
   */
  test('Refuser une date d’adoption dans le futur, mutation appelée directement', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await instruireDemarche(caller, collectivite.id, created.id);

    const deliberation = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'deliberation-adoption.pdf',
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      documentId: 'pcaet_deliberation_adoption',
      fichierId: deliberation.id,
    });

    // Le dossier est par ailleurs publiable : seule la date le retient.
    await expect(
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        dateAdoption: '2099-01-01',
      })
    ).rejects.toThrow('DATE_ADOPTION_FUTURE');

    // Demain suffit à être refusé : la borne est la date du jour, pas l'année.
    // Dérivé de la date civile de Paris — celle que le serveur compare. Ajouter
    // 24 h à `Date.now()` puis lire l'ISO en UTC rendrait le test instable : la
    // nuit, « demain » en UTC est encore aujourd'hui à Paris, et le refus
    // attendu n'aurait pas lieu.
    const [annee, mois, jour] = getDateCivileFrance(new Date())
      .split('-')
      .map(Number);
    const demain = getDateCivileFrance(
      new Date(Date.UTC(annee, mois - 1, jour + 1, 12))
    );
    await expect(
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        dateAdoption: demain,
      })
    ).rejects.toThrow('DATE_ADOPTION_FUTURE');

    // Rien n'a été écrit : le refus précède la transition.
    const intacte = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(intacte.status).toBe('instruit');
    expect(intacte.adoptedAt).toBeNull();

    // Antidater reste la norme : le dépôt suit le conseil de plusieurs semaines.
    const publiee = await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      dateAdoption: '2025-03-04',
    });
    expect(publiee.adoptedAt).toBe('2025-03-04');
  });

  test('Publier une démarche instruite, sans retour possible', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await instruireDemarche(caller, collectivite.id, created.id);

    // La délibération d'adoption (pièce aval requise) conditionne la publication.
    await expect(
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        dateAdoption: '2026-01-15',
      })
    ).rejects.toThrow('DOCUMENTS_AVAL_INCOMPLETS');

    const deliberation = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'deliberation-adoption.pdf',
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      documentId: 'pcaet_deliberation_adoption',
      fichierId: deliberation.id,
    });

    const publiee = await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      dateAdoption: '2026-01-15',
    });
    expect(publiee.status).toBe('publie');
    expect(publiee.publishedAt).toBeTruthy();
    // La date saisie est celle de la délibération, pas celle de la mise en
    // ligne : elle est conservée telle quelle.
    expect(publiee.adoptedAt).toBe('2026-01-15');
    expect(publiee.transitions.publier.reachable).toBe(false);
    // Publier vaut adopter : la seule suite d'un dossier publié est l'archivage,
    // fermé tant qu'aucun PCAET suivant n'est adopté.
    expect(
      Object.entries(publiee.transitions)
        .filter(([, evaluation]) => evaluation.reachable)
        .map(([transition]) => transition)
    ).toEqual(['pcaet_suivant_adopte']);
    expect(publiee.transitions.pcaet_suivant_adopte.blockedBy).toEqual([
      'pcaetSuivantAdopte',
    ]);

    const history = await db.db
      .select()
      .from(demarcheStatusHistoryTable)
      .where(eq(demarcheStatusHistoryTable.demarcheId, created.id))
      // L'assertion porte sur l'enchaînement : sans tri, Postgres est libre de
      // rendre les lignes dans n'importe quel ordre, et le test devient flaky.
      .orderBy(demarcheStatusHistoryTable.id);
    // Le journal nomme la cause de la bascule en instruit : ici le délai échu.
    expect(history.map((entry) => entry.transition)).toEqual([
      'transmettre_pour_avis',
      'delai_avis_echu',
      'publier',
    ]);
  });

  test('Figer les classeurs une seconde fois à la publication, sans toucher à ceux de la transmission', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await instruireDemarche(caller, collectivite.id, created.id);
    const planIds = (
      await caller.demarches.pcaet.get({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).planActionIds;

    // Le plan change entre la transmission et la publication.
    await db.db
      .update(axeTable)
      .set({ nom: 'Plan revu après les avis' })
      .where(eq(axeTable.id, planIds[0]));

    await deposerDeliberation(caller, collectivite.id, created.id);
    await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      dateAdoption: '2026-01-15',
    });

    const exports = await listTestDemarchePcaetExports(db, created.id);
    expect(toExportKeys(exports)).toEqual([
      'transmettre_pour_avis/plan',
      'transmettre_pour_avis/indicateurs',
      'publier/plan',
      'publier/indicateurs',
    ]);
    const [planTransmis, , planPublie] = exports;
    expect(planPublie.filename).toMatch(
      /^PCAET_.+_Plan_publie_\d{4}-\d{2}-\d{2}\.xlsx$/
    );

    // Chaque export figé garde l'état de son moment.
    const transmis = await loadTestDemarchePcaetExportWorkbook(
      app,
      planTransmis
    );
    expect(transmis.worksheets.map(({ name }) => name)).toEqual([
      'Programme d’actions du PCAET',
    ]);
    const publie = await loadTestDemarchePcaetExportWorkbook(app, planPublie);
    expect(publie.worksheets.map(({ name }) => name)).toEqual([
      'Plan revu après les avis',
    ]);
  });

  /** `transition/type` de chaque classeur figé, dans l'ordre des lignes. */
  const toExportKeys = (exports: { transition: string; type: string }[]) =>
    exports.map(({ transition, type }) => `${transition}/${type}`);

  /** La délibération d'adoption, dernière pièce exigée avant de publier. */
  const deposerDeliberation = async (
    caller: ReturnType<TrpcRouter['createCaller']>,
    collectiviteId: number,
    demarcheId: number
  ) => {
    const deliberation = await addTestBibliothequeFichier(db, {
      collectiviteId,
      filename: 'deliberation-adoption.pdf',
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId,
      demarcheId,
      documentId: 'pcaet_deliberation_adoption',
      fichierId: deliberation.id,
    });
  };

  test('Refuser la publication si les classeurs ne peuvent pas être enregistrés', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await instruireDemarche(caller, collectivite.id, created.id);
    await deposerDeliberation(caller, collectivite.id, created.id);
    const exportsTransmis = await listTestDemarchePcaetExports(db, created.id);

    const stockage = vi
      .spyOn(app.get(SupabaseService), 'saveInStorage')
      .mockResolvedValue({ success: false, error: 'UPLOAD_STORAGE_ERROR' });
    onTestFinished(() => stockage.mockRestore());

    await expect(
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        dateAdoption: '2026-01-15',
      })
    ).rejects.toThrow('EXPORT_GENERATION_ERROR');

    // Rien n'est publié, et l'export figé de la transmission reste intact.
    const apres = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(apres.status).toBe('instruit');
    expect(apres.publishedAt).toBeNull();
    expect(apres.adoptedAt).toBeNull();
    expect(await listTestDemarchePcaetExports(db, created.id)).toEqual(
      exportsTransmis
    );

    // Le stockage revenu, la collectivité réessaie et la publication passe.
    stockage.mockRestore();
    const publiee = await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      dateAdoption: '2026-01-15',
    });
    expect(publiee.status).toBe('publie');
    expect(
      toExportKeys(await listTestDemarchePcaetExports(db, created.id))
    ).toEqual([
      'transmettre_pour_avis/plan',
      'transmettre_pour_avis/indicateurs',
      'publier/plan',
      'publier/indicateurs',
    ]);
  });

  test('Retirer du stockage les classeurs figés quand la publication est annulée après coup', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await instruireDemarche(caller, collectivite.id, created.id);
    await deposerDeliberation(caller, collectivite.id, created.id);
    const exportsTransmis = await listTestDemarchePcaetExports(db, created.id);

    // Les classeurs sont écrits, puis l'archivage échoue : la transaction est
    // annulée, rien ne désigne plus ces objets.
    const supabase = app.get(SupabaseService);
    const saveInStorageSpy = vi.spyOn(supabase, 'saveInStorage');
    const archiveReplacedSpy = vi
      .spyOn(app.get(ArchiverDemarchePcaetService), 'archiverRemplacees')
      .mockResolvedValue(failure('DATABASE_ERROR'));
    onTestFinished(() => {
      saveInStorageSpy.mockRestore();
      archiveReplacedSpy.mockRestore();
    });

    await expect(
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        dateAdoption: '2026-01-15',
      })
    ).rejects.toThrow();

    const download = (path: string) =>
      supabase.client.storage
        .from(DEMARCHE_PCAET_EXPORTS_BUCKET)
        .download(path);
    const paths = saveInStorageSpy.mock.calls.map(([{ path }]) => path);
    expect(paths).toHaveLength(2);
    for (const path of paths) {
      expect((await download(path)).data).toBeNull();
    }
    // Les classeurs validés de la transmission ne sont pas touchés.
    expect(await listTestDemarchePcaetExports(db, created.id)).toEqual(
      exportsTransmis
    );
    for (const { storagePath } of exportsTransmis) {
      expect((await download(storagePath)).data).not.toBeNull();
    }

    // COMMIT ambigu : la base a pu valider des lignes que le service croit
    // annulées. Un chemin encore désigné n'est jamais retiré.
    await app
      .get(GenerateDemarchePcaetExportsService)
      .discard(exportsTransmis.map(({ storagePath }) => storagePath));
    for (const { storagePath } of exportsTransmis) {
      expect((await download(storagePath)).data).not.toBeNull();
    }
  });

  test('Figer la variante sans fiche restreinte quand une fiche le devient après la transmission', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await instruireDemarche(caller, collectivite.id, created.id);
    const [planId] = (
      await caller.demarches.pcaet.get({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).planActionIds;

    // Le programme d'actions se rouvre après les avis : une fiche restreinte y
    // entre entre la transmission et la publication.
    await addTestFichePcaet(caller, {
      collectiviteId: collectivite.id,
      titre: 'Fiche confidentielle',
      restreint: true,
      axeId: planId,
    });

    await deposerDeliberation(caller, collectivite.id, created.id);
    await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      dateAdoption: '2026-01-15',
    });

    const exports = await listTestDemarchePcaetExports(db, created.id);
    expect(toExportKeys(exports)).toEqual([
      'transmettre_pour_avis/plan',
      'transmettre_pour_avis/indicateurs',
      'publier/plan',
      'publier/plan_expurge',
      'publier/indicateurs',
    ]);
    const planExpurge = exports.find(
      ({ transition, type }) =>
        transition === 'publier' && type === 'plan_expurge'
    );
    expect(planExpurge?.storagePath).toMatch(
      new RegExp(`^${created.id}/publier/[0-9a-f-]{36}/plan_expurge\\.xlsx$`)
    );
  });

  test('Un dépôt hors plateforme n’a que l’export figé de sa publication', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
      transmittedOffPlatform: true,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await deposerDeliberation(caller, collectivite.id, created.id);

    const publiee = await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      dateAdoption: '2026-01-15',
    });
    expect(publiee.status).toBe('publie');

    const exports = await listTestDemarchePcaetExports(db, created.id);
    expect(toExportKeys(exports)).toEqual([
      'publier/plan',
      'publier/indicateurs',
    ]);
  });

  /**
   * Un PCAET en vigueur, inséré tel quel — ce qui est testé ici est sa
   * succession, pas sa propre publication —, puis son renouvellement mené
   * jusqu'au seuil de la publication.
   */
  const publierPuisRenouveler = async (dateAdoptionPrecedent: string) => {
    const { caller, collectivite } = await freshEditor();
    const [precedent] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: collectivite.id,
        type: 'pcaet',
        titre: 'PCAET précédent',
        status: 'publie',
        publishedAt: new Date().toISOString(),
        adoptedAt: dateAdoptionPrecedent,
      })
      .returning({ id: demarcheTable.id });

    const suivant = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    // Un renouvellement doit le bilan du PCAET qu'il remplace.
    const bilan = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'bilan-pcaet-precedent.pdf',
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: suivant.id,
      documentId: 'pcaet_bilan_pcaet_precedent',
      fichierId: bilan.id,
    });
    await instruireDemarche(caller, collectivite.id, suivant.id);
    const deliberation = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'deliberation-adoption.pdf',
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: suivant.id,
      documentId: 'pcaet_deliberation_adoption',
      fichierId: deliberation.id,
    });

    return { caller, collectivite, precedent, suivant };
  };

  test('Archiver le PCAET précédent à l’adoption du suivant, et seulement là', async () => {
    const { caller, collectivite, precedent, suivant } =
      await publierPuisRenouveler('2019-06-20');

    // Le renouvellement en cours ne remplace rien : au-delà de ses six ans, le
    // précédent reste en vigueur tant que le suivant n'est pas adopté.
    const enVigueur = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: precedent.id,
    });
    expect(enVigueur.status).toBe('publie');

    const publiee = await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: suivant.id,
      dateAdoption: '2026-01-15',
    });
    expect(publiee.status).toBe('publie');

    const archivee = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: precedent.id,
    });
    expect(archivee.status).toBe('archive');
    // L'archivage ne réécrit rien de ce qui a été adopté.
    expect(archivee.adoptedAt).toBe('2019-06-20');

    const [entree] = await db.db
      .select()
      .from(demarcheStatusHistoryTable)
      .where(eq(demarcheStatusHistoryTable.demarcheId, precedent.id))
      .orderBy(desc(demarcheStatusHistoryTable.id))
      .limit(1);
    // L'acte de personne : le journal le nomme sans l'imputer à l'utilisateur
    // qui a publié le suivant.
    expect(entree).toMatchObject({
      fromStatus: 'publie',
      toStatus: 'archive',
      transition: 'pcaet_suivant_adopte',
      createdBy: null,
    });
  });

  test('Archiver le dépôt publié lui-même quand son adoption précède celle du PCAET en vigueur', async () => {
    const { caller, collectivite, precedent, suivant } =
      await publierPuisRenouveler('2026-01-15');

    // Saisi après, adopté avant : c'est la délibération qui ordonne.
    const publiee = await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: suivant.id,
      dateAdoption: '2019-06-20',
    });
    expect(publiee.status).toBe('archive');

    const enVigueur = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: precedent.id,
    });
    expect(enVigueur.status).toBe('publie');
  });

  test('Laisser un seul PCAET en vigueur quand deux publications de la même collectivité se croisent', async () => {
    const { caller, collectivite } = await freshEditor();

    // Deux dossiers instruits côte à côte : la plateforme ne les produit pas
    // d'elle-même, mais une reprise de données ou un dépôt hors plateforme le
    // peuvent. Ce qui est testé est la succession, pas leur instruction.
    const instruits = await db.db
      .insert(demarcheTable)
      .values(
        ['PCAET A', 'PCAET B'].map((titre) => ({
          collectiviteId: collectivite.id,
          type: 'pcaet' as const,
          titre,
          status: 'instruit' as const,
          transmittedAt: new Date().toISOString(),
        }))
      )
      .returning({ id: demarcheTable.id });
    for (const { id } of instruits) {
      // La publication revérifie le diagnostic et le programme d'actions,
      // rouverts après les avis : ils doivent être complets.
      await attachTestPlanToDemarchePcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: id,
      });
      await completeTestDiagnosticPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: id,
      });
      const deliberation = await addTestBibliothequeFichier(db, {
        collectiviteId: collectivite.id,
        filename: 'deliberation-adoption.pdf',
      });
      await caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: id,
        documentId: 'pcaet_deliberation_adoption',
        fichierId: deliberation.id,
      });
    }

    const [ancien, recent] = instruits;
    await Promise.all([
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: ancien.id,
        dateAdoption: '2019-06-20',
      }),
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: recent.id,
        dateAdoption: '2026-01-15',
      }),
    ]);

    const statuts = await Promise.all(
      instruits.map(({ id }) =>
        caller.demarches.pcaet
          .get({ collectiviteId: collectivite.id, demarcheId: id })
          .then(({ status }) => status)
      )
    );
    expect(statuts).toEqual(['archive', 'publie']);
  });
});
