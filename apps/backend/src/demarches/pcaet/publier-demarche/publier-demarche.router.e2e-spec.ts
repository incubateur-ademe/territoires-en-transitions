import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { getDateCivileFrance } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { desc, eq } from 'drizzle-orm';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  addTestBibliothequeFichier,
  cloreTestInstructionPcaet,
  completeTestDossierPcaet,
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
