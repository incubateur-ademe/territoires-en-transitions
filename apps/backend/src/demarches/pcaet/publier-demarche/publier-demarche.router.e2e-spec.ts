import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
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
    const demain = new Date(Date.now() + 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
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
    // Publier vaut adopter : la seule suite d'un dossier publié est l'archivage.
    expect(
      Object.entries(publiee.transitions)
        .filter(([, evaluation]) => evaluation.reachable)
        .map(([transition]) => transition)
    ).toEqual(['archiver']);

    const history = await db.db
      .select()
      .from(demarcheStatusHistoryTable)
      .where(eq(demarcheStatusHistoryTable.demarcheId, created.id));
    // Le journal nomme la cause de la bascule en instruit : ici le délai échu.
    expect(history.map((entry) => entry.transition)).toEqual([
      'transmettre_pour_avis',
      'delai_avis_echu',
      'publier',
    ]);
  });
});
