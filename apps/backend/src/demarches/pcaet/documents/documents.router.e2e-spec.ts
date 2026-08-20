import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  computeDemarcheDocumentsCoverage,
  isDemarcheDossierDocumentsComplet,
} from '@tet/domain/demarches';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { demarcheDefinitionTable } from '@tet/backend/demarches/shared/models/demarche-definition.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import {
  PCAET_DOCUMENT_GLOBAL_ID,
  addTestBibliothequeFichier,
  completeTestDiagnosticPcaet,
  completeTestDossierPcaet,
} from '../demarches-pcaet.test-fixture';

describe('Documents d’une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  // Une seule démarche active par collectivité : chaque cas part d'une
  // collectivité neuve.
  const freshEditor = async (
    role: CollectiviteRole = CollectiviteRole.EDITION
  ) => {
    const fixture = await addTestCollectiviteAndUser(db, { user: { role } });
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectivite: fixture.collectivite,
      user,
      caller: router.createCaller({ user }),
    };
  };

  const freshDemarche = async (role?: CollectiviteRole) => {
    const editor = await freshEditor(role);
    const demarche = await editor.caller.demarches.pcaet.create({
      collectiviteId: editor.collectivite.id,
    });
    return { ...editor, demarche };
  };

  // Antidate l'échéance d'avis (figée à la transmission) pour qu'elle soit écoulée.
  const backdateTransmission = async (demarcheId: number) => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Le modèle de démarche est servi par la base, dossier vide', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    expect(snapshot.definitions).toHaveLength(13);
    expect(snapshot.documents).toEqual([]);
    expect(snapshot.documentsAdditional).toEqual([]);
    // Le dossier PCAET est réglementaire : PDF uniquement, et la collectivité
    // peut joindre ses propres pièces aux deux étapes.
    expect(snapshot.config).toEqual({
      additionalAmont: true,
      additionalAval: true,
      formatsAutorises: ['pdf'],
      mimeTypesAutorises: ['application/pdf'],
    });

    const global = snapshot.definitions.find(
      (definition) => definition.portee === 'global'
    );
    expect(global?.id).toBe(PCAET_DOCUMENT_GLOBAL_ID);

    const sections = snapshot.definitions.filter(
      (definition) => definition.portee === 'section'
    );
    expect(sections).toHaveLength(12);
    // Les sections sont triées par ordre d'affichage : la chronologie de la
    // démarche, de la délibération d'engagement à celle d'adoption.
    expect(sections.map((section) => section.id)).toEqual([
      'pcaet_deliberation_engagement',
      'pcaet_diagnostic',
      'pcaet_strategie_territoriale',
      'pcaet_plan_actions',
      'pcaet_dispositif_suivi_evaluation',
      'pcaet_ees',
      'pcaet_etude_impact',
      'pcaet_bilan_pcaet_precedent',
      'pcaet_deliberation_arret',
      'pcaet_memoire_reponse_avis',
      'pcaet_synthese_consultation_publique',
      'pcaet_deliberation_adoption',
    ]);
    // Les pièces produites après les avis, dans l'ordre du dépôt : réponse aux
    // avis, synthèse de la consultation, puis délibération d'adoption.
    expect(
      sections
        .filter((section) => section.etape === 'aval')
        .map((section) => section.id)
    ).toEqual([
      'pcaet_memoire_reponse_avis',
      'pcaet_synthese_consultation_publique',
      'pcaet_deliberation_adoption',
    ]);
    // Le document global regroupe le dossier d'élaboration : il substitue les
    // sections amont requises, ni les optionnelles ni les pièces aval.
    expect(
      sections
        .filter((section) =>
          section.substituts.includes(PCAET_DOCUMENT_GLOBAL_ID)
        )
        .map((section) => section.id)
    ).toEqual([
      'pcaet_diagnostic',
      'pcaet_strategie_territoriale',
      'pcaet_plan_actions',
      'pcaet_dispositif_suivi_evaluation',
      'pcaet_etude_impact',
      'pcaet_deliberation_arret',
    ]);
    expect(
      sections
        .filter((section) => !section.requis || section.etape === 'aval')
        .every((section) => section.substituts.length === 0)
    ).toBe(true);
    const deliberation = sections.find(
      (section) => section.id === 'pcaet_deliberation_adoption'
    );
    expect(deliberation?.etape).toBe('aval');
    expect(deliberation?.requis).toBe(true);
    expect(deliberation?.nom).toBe("Délibération d'adoption du PCAET");
    expect(deliberation?.substituts).toEqual([]);
    expect(
      sections.filter((section) => section.requis).map((section) => section.id)
    ).toEqual([
      'pcaet_diagnostic',
      'pcaet_strategie_territoriale',
      'pcaet_plan_actions',
      'pcaet_dispositif_suivi_evaluation',
      'pcaet_etude_impact',
      'pcaet_deliberation_arret',
      'pcaet_deliberation_adoption',
    ]);
    expect(
      sections.find(
        (section) => section.id === 'pcaet_dispositif_suivi_evaluation'
      )?.couverturePlateforme
    ).toBe('plan_actions');

    expect(isDemarcheDossierDocumentsComplet(snapshot)).toBe(false);
  });

  test('Le document global couvre les sections requises de l’élaboration', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });

    const depose = await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
      fichierId: fichier.id,
    });
    expect(depose.documentId).toBe(PCAET_DOCUMENT_GLOBAL_ID);
    expect(depose.fichier?.id).toBe(fichier.id);
    expect(depose.fichier?.filename).toBe(fichier.filename);

    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    const coverage = computeDemarcheDocumentsCoverage(snapshot);
    // Le dépôt du document global couvre les pièces qu'il substitue, et elles
    // seules : les sections amont requises. Une pièce optionnelle ou aval reste
    // à déposer — elle n'est pas dans la liste des substitutions du catalogue.
    const substitueesParLeGlobal = new Set(
      snapshot.definitions
        .filter(({ substituts }) =>
          substituts.includes(PCAET_DOCUMENT_GLOBAL_ID)
        )
        .map(({ id }) => id)
    );
    expect(
      coverage
        .filter(({ documentId }) => substitueesParLeGlobal.has(documentId))
        .every(({ couvert, origine }) => couvert && origine === 'substitut')
    ).toBe(true);
    expect(
      coverage
        .filter(
          ({ documentId }) =>
            documentId !== PCAET_DOCUMENT_GLOBAL_ID &&
            !substitueesParLeGlobal.has(documentId)
        )
        .every(({ couvert }) => !couvert)
    ).toBe(true);
    // Le dossier d'élaboration est complet : seules les pièces requises pèsent.
    expect(isDemarcheDossierDocumentsComplet(snapshot)).toBe(true);
  });

  test('Retirer le document global découvre les sections', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
      fichierId: fichier.id,
    });

    const removed = await caller.demarches.pcaet.documents.remove({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
    });
    expect(removed.documentId).toBe(PCAET_DOCUMENT_GLOBAL_ID);

    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(snapshot.documents).toEqual([]);
    expect(isDemarcheDossierDocumentsComplet(snapshot)).toBe(false);

    // Retirer une pièce non déposée est une erreur explicite.
    await expect(
      caller.demarches.pcaet.documents.remove({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
      })
    ).rejects.toThrow("Aucun document n'est déposé pour cette pièce attendue");
  });

  test('Un second dépôt sur la même pièce remplace le fichier', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const premier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'diagnostic-v1.pdf',
    });
    const second = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'diagnostic-v2.pdf',
    });

    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: 'pcaet_diagnostic',
      fichierId: premier.id,
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: 'pcaet_diagnostic',
      fichierId: second.id,
    });

    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(snapshot.documents).toHaveLength(1);
    expect(snapshot.documents[0].fichier?.filename).toBe('diagnostic-v2.pdf');
  });

  test('Seuls les PDF sont acceptés', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'diagnostic.docx',
    });

    await expect(
      caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_diagnostic',
        fichierId: fichier.id,
      })
    ).rejects.toThrow(
      "Le format de ce fichier n'est pas accepté dans ce dossier"
    );
  });

  test('Un fichier d’une autre collectivité est introuvable', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const autre = await freshEditor();
    const fichierEtranger = await addTestBibliothequeFichier(db, {
      collectiviteId: autre.collectivite.id,
    });

    await expect(
      caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_diagnostic',
        fichierId: fichierEtranger.id,
      })
    ).rejects.toThrow(
      "Le fichier n'a pas été trouvé dans la bibliothèque de la collectivité"
    );
  });

  test('Une pièce hors modèle de démarche est refusée', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });

    await expect(
      caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'piece_inventee',
        fichierId: fichier.id,
      })
    ).rejects.toThrow("Cette pièce n'est pas attendue au dépôt du PCAET");
  });

  test('La couverture par le plan d’actions n’accepte que les pièces éligibles', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    // Seul le modèle décide quelles pièces sont couvrables ainsi.
    await expect(
      caller.demarches.pcaet.documents.setCouverture({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_diagnostic',
        couvert: true,
      })
    ).rejects.toThrow(
      'Cette pièce ne peut pas être couverte par le plan d’actions suivi sur la plateforme'
    );

    // Aucun plan rattaché n'est exigé pour cocher la case.
    await caller.demarches.pcaet.documents.setCouverture({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: 'pcaet_dispositif_suivi_evaluation',
      couvert: true,
    });

    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    // La couverture est une pièce satisfaite sans fichier.
    expect(
      snapshot.documents.find(
        ({ documentId }) => documentId === 'pcaet_dispositif_suivi_evaluation'
      )?.fichier
    ).toBeNull();
    expect(
      computeDemarcheDocumentsCoverage(snapshot).find(
        ({ documentId }) => documentId === 'pcaet_dispositif_suivi_evaluation'
      )?.origine
    ).toBe('plan_actions');

    // Décocher retire la déclaration.
    await caller.demarches.pcaet.documents.setCouverture({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: 'pcaet_dispositif_suivi_evaluation',
      couvert: false,
    });
    const apresRetrait = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(apresRetrait.documents).toEqual([]);
  });

  test('La couverture refuse de s’appliquer sur une pièce déjà pourvue d’un dépôt', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });
    const couvrable = {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: 'pcaet_dispositif_suivi_evaluation',
    };

    await caller.demarches.pcaet.documents.add({
      ...couvrable,
      fichierId: fichier.id,
    });

    // Un dépôt occupe la place : la déclarer couverte ne doit pas passer pour un
    // succès alors que rien ne serait enregistré.
    await expect(
      caller.demarches.pcaet.documents.setCouverture({
        ...couvrable,
        couvert: true,
      })
    ).rejects.toThrow('Un document est déjà déposé pour cette pièce');

    const snapshot = await caller.demarches.pcaet.documents.list(couvrable);
    expect(
      snapshot.documents.find(
        ({ documentId }) => documentId === couvrable.documentId
      )?.fichier?.id
    ).toBe(fichier.id);

    // Le fichier retiré, la couverture s'applique — et reste idempotente.
    await caller.demarches.pcaet.documents.remove(couvrable);
    await caller.demarches.pcaet.documents.setCouverture({
      ...couvrable,
      couvert: true,
    });
    await caller.demarches.pcaet.documents.setCouverture({
      ...couvrable,
      couvert: true,
    });

    const apresCouverture = await caller.demarches.pcaet.documents.list(
      couvrable
    );
    expect(apresCouverture.documents).toHaveLength(1);
    expect(apresCouverture.documents[0].fichier).toBeNull();
  });

  test('Un dossier transmis pour avis n’accepte plus de dépôt ni de retrait', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
      fichierId: fichier.id,
    });
    const plan = await caller.plans.plans.create({
      nom: 'Programme d’actions du PCAET',
      collectiviteId: collectivite.id,
    });
    await caller.demarches.pcaet.update({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      planActionId: plan.id,
    });
    await completeTestDiagnosticPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    const autreFichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });
    await expect(
      caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_diagnostic',
        fichierId: autreFichier.id,
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );
    await expect(
      caller.demarches.pcaet.documents.remove({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );
    // La couverture modifie aussi l'état documentaire : elle gèle avec le reste.
    await expect(
      caller.demarches.pcaet.documents.setCouverture({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_dispositif_suivi_evaluation',
        couvert: true,
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );

    // La lecture reste possible.
    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(snapshot.documents).toHaveLength(1);
  });

  test('La délibération d’adoption (pièce aval) se dépose une fois le PCAET adopté', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const deliberation = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'deliberation-adoption.pdf',
    });

    // Pendant l'élaboration, la pièce aval n'est pas encore déposable.
    await expect(
      caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_deliberation_adoption',
        fichierId: deliberation.id,
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );

    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    await backdateTransmission(demarche.id);
    await caller.demarches.pcaet.adopter({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    // Adopté : la pièce aval se dépose et se retire, l'amont n'est plus modifiable.
    const depose = await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: 'pcaet_deliberation_adoption',
      fichierId: deliberation.id,
    });
    expect(depose.documentId).toBe('pcaet_deliberation_adoption');

    const amont = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });
    await expect(
      caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_diagnostic',
        fichierId: amont.id,
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );

    await caller.demarches.pcaet.documents.remove({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: 'pcaet_deliberation_adoption',
    });
  });

  test('Une démarche n’est pas accessible via une autre collectivité (IDOR)', async () => {
    const { collectivite, demarche } = await freshDemarche();
    const autre = await freshEditor();

    await expect(
      autre.caller.demarches.pcaet.documents.list({
        collectiviteId: autre.collectivite.id,
        demarcheId: demarche.id,
      })
    ).rejects.toThrow("La démarche PCAET demandée n'a pas été trouvée");

    // Le collectiviteId du payload ne peut pas cibler la démarche d'autrui.
    await expect(
      autre.caller.demarches.pcaet.documents.list({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('Une pièce additionnelle s’ouvre sans nom, puis se nomme et reçoit son fichier', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const dossier = {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    };

    // La ligne s'ouvre vide : elle n'attend ni nom ni fichier pour exister.
    const cree = await caller.demarches.pcaet.documents.createAdditional({
      ...dossier,
      etape: 'amont',
    });
    expect(cree.titre).toBe('');
    expect(cree.etape).toBe('amont');
    expect(cree.fichier).toBeNull();

    // Le fichier peut arriver avant le nom : rien n'impose l'ordre.
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'annexe-locale.pdf',
    });
    const avecFichier = await caller.demarches.pcaet.documents.updateAdditional(
      {
        ...dossier,
        documentAdditionalId: cree.id,
        fichierId: fichier.id,
      }
    );
    expect(avecFichier.fichier?.id).toBe(fichier.id);
    expect(avecFichier.fichier?.filename).toBe('annexe-locale.pdf');
    expect(avecFichier.titre).toBe('');

    const nomme = await caller.demarches.pcaet.documents.updateAdditional({
      ...dossier,
      documentAdditionalId: cree.id,
      titre: 'Mon document perso',
    });
    expect(nomme.titre).toBe('Mon document perso');
    // Nommer ne touche pas au fichier déposé.
    expect(nomme.fichier?.id).toBe(fichier.id);

    // Renommage et remplacement passent par la même route.
    const remplacant = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'annexe-locale-v2.pdf',
    });
    const renomme = await caller.demarches.pcaet.documents.updateAdditional({
      ...dossier,
      documentAdditionalId: cree.id,
      titre: 'Annexe locale',
      fichierId: remplacant.id,
    });
    expect(renomme.titre).toBe('Annexe locale');
    expect(renomme.fichier?.id).toBe(remplacant.id);

    // Un titre vide rend son anonymat à la pièce : la ligne reste, sans nom.
    const anonyme = await caller.demarches.pcaet.documents.updateAdditional({
      ...dossier,
      documentAdditionalId: cree.id,
      titre: '   ',
    });
    expect(anonyme.titre).toBe('');
    expect(anonyme.fichier?.id).toBe(remplacant.id);

    const snapshot = await caller.demarches.pcaet.documents.list(dossier);
    expect(snapshot.documentsAdditional).toHaveLength(1);
    // Une pièce additionnelle est hors catalogue : elle ne s'invente pas de définition.
    expect(snapshot.definitions).toHaveLength(13);

    await caller.demarches.pcaet.documents.removeAdditional({
      ...dossier,
      documentAdditionalId: cree.id,
    });
    const apresRetrait = await caller.demarches.pcaet.documents.list(dossier);
    expect(apresRetrait.documentsAdditional).toEqual([]);
  });

  test('Plusieurs pièces additionnelles coexistent, dans leur ordre d’ajout', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const dossier = {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    };

    // Un même titre deux fois n'est pas une erreur, et une pièce sans nom
    // coexiste avec les autres : rien ne les distingue en base, c'est la
    // collectivité qui juge.
    for (const titre of [
      'Étude acoustique',
      'Concertation citoyenne',
      'Étude acoustique',
      '',
    ]) {
      const cree = await caller.demarches.pcaet.documents.createAdditional({
        ...dossier,
        etape: 'amont',
      });
      if (titre) {
        await caller.demarches.pcaet.documents.updateAdditional({
          ...dossier,
          documentAdditionalId: cree.id,
          titre,
        });
      }
    }

    const snapshot = await caller.demarches.pcaet.documents.list(dossier);
    expect(snapshot.documentsAdditional.map(({ titre }) => titre)).toEqual([
      'Étude acoustique',
      'Concertation citoyenne',
      'Étude acoustique',
      '',
    ]);
  });

  test('Une pièce additionnelle n’accepte que les formats du dossier', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const dossier = {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    };

    const additional = await caller.demarches.pcaet.documents.createAdditional({
      ...dossier,
      etape: 'amont',
    });
    const docx = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'annexe.docx',
    });

    // Ce qui est joint en pièce additionnelle l'est dans les formats du dossier.
    await expect(
      caller.demarches.pcaet.documents.updateAdditional({
        ...dossier,
        documentAdditionalId: additional.id,
        fichierId: docx.id,
      })
    ).rejects.toThrow(
      "Le format de ce fichier n'est pas accepté dans ce dossier"
    );

    // Le fichier d'une autre collectivité reste introuvable, comme pour les
    // pièces attendues.
    const autre = await freshEditor();
    const fichierEtranger = await addTestBibliothequeFichier(db, {
      collectiviteId: autre.collectivite.id,
      filename: 'ailleurs.pdf',
    });
    await expect(
      caller.demarches.pcaet.documents.updateAdditional({
        ...dossier,
        documentAdditionalId: additional.id,
        fichierId: fichierEtranger.id,
      })
    ).rejects.toThrow(
      "Le fichier n'a pas été trouvé dans la bibliothèque de la collectivité"
    );
  });

  test('Une pièce additionnelle d’une autre démarche est introuvable (IDOR)', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const autre = await freshDemarche();
    const additionalDAutrui =
      await autre.caller.demarches.pcaet.documents.createAdditional({
        collectiviteId: autre.collectivite.id,
        demarcheId: autre.demarche.id,
        etape: 'amont',
      });
    await autre.caller.demarches.pcaet.documents.updateAdditional({
      collectiviteId: autre.collectivite.id,
      demarcheId: autre.demarche.id,
      documentAdditionalId: additionalDAutrui.id,
      titre: 'Pièce d’autrui',
    });

    const cible = {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentAdditionalId: additionalDAutrui.id,
    };
    await expect(
      caller.demarches.pcaet.documents.updateAdditional({
        ...cible,
        titre: 'Détournée',
      })
    ).rejects.toThrow("Ce document n'a pas été trouvé dans le dossier");
    await expect(
      caller.demarches.pcaet.documents.removeAdditional(cible)
    ).rejects.toThrow("Ce document n'a pas été trouvé dans le dossier");

    // La pièce visée est intacte.
    const snapshot = await autre.caller.demarches.pcaet.documents.list({
      collectiviteId: autre.collectivite.id,
      demarcheId: autre.demarche.id,
    });
    expect(snapshot.documentsAdditional[0].titre).toBe('Pièce d’autrui');
  });

  test('Une pièce additionnelle sans fichier ne retient pas la transmission', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const dossier = {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    };

    await completeTestDossierPcaet(db, dossier);
    await caller.demarches.pcaet.documents.createAdditional({
      ...dossier,
      etape: 'amont',
    });

    // Une pièce additionnelle est optionnelle par nature : elle ne pèse pas sur la
    // complétude du dossier, même vide.
    const snapshot = await caller.demarches.pcaet.documents.list(dossier);
    expect(isDemarcheDossierDocumentsComplet(snapshot)).toBe(true);
    await caller.demarches.pcaet.transmettrePourAvis(dossier);
  });

  test('La transmission gèle les pièces additionnelles amont, l’adoption ouvre l’aval', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const dossier = {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    };

    const amont = await caller.demarches.pcaet.documents.createAdditional({
      ...dossier,
      etape: 'amont',
    });
    // L'aval n'est pas encore ouvert : la pièce se rattache à une partie du
    // dossier qui n'existe pas avant l'adoption.
    await expect(
      caller.demarches.pcaet.documents.createAdditional({
        ...dossier,
        etape: 'aval',
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );

    await completeTestDossierPcaet(db, dossier);
    await caller.demarches.pcaet.transmettrePourAvis(dossier);

    await expect(
      caller.demarches.pcaet.documents.updateAdditional({
        ...dossier,
        documentAdditionalId: amont.id,
        titre: 'Renommée trop tard',
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );
    await expect(
      caller.demarches.pcaet.documents.removeAdditional({
        ...dossier,
        documentAdditionalId: amont.id,
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );

    await backdateTransmission(demarche.id);
    await caller.demarches.pcaet.adopter(dossier);

    // Adopté : l'aval s'ouvre, l'amont reste gelé.
    const aval = await caller.demarches.pcaet.documents.createAdditional({
      ...dossier,
      etape: 'aval',
    });
    expect(aval.etape).toBe('aval');
    await expect(
      caller.demarches.pcaet.documents.removeAdditional({
        ...dossier,
        documentAdditionalId: amont.id,
      })
    ).rejects.toThrow(
      'Cette pièce n’est pas modifiable au statut actuel de la démarche'
    );
  });

  test('Un type de démarche qui n’ouvre pas le dépôt de pièces additionnelles le refuse', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    // La configuration est une donnée partagée par le type : on la restaure
    // aussitôt pour ne pas fermer le dépôt de pièces additionnelles aux cas suivants.
    await db.db
      .update(demarcheDefinitionTable)
      .set({ documentsAdditionalAmont: false })
      .where(eq(demarcheDefinitionTable.demarcheType, 'pcaet'));
    onTestFinished(async () => {
      await db.db
        .update(demarcheDefinitionTable)
        .set({ documentsAdditionalAmont: true })
        .where(eq(demarcheDefinitionTable.demarcheType, 'pcaet'));
    });

    await expect(
      caller.demarches.pcaet.documents.createAdditional({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        etape: 'amont',
      })
    ).rejects.toThrow(
      'Cette partie du dossier n’accepte pas de document hors des pièces attendues'
    );
  });

  test('Un rôle lecture ne peut ni lire ni déposer les documents du dossier', async () => {
    const { collectivite, demarche } = await freshDemarche();
    const lecteur = await addTestUser(db, {
      collectiviteId: collectivite.id,
      role: CollectiviteRole.LECTURE,
    });
    const lecteurCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(lecteur.user),
    });
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });

    await expect(
      lecteurCaller.demarches.pcaet.documents.list({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");

    await expect(
      lecteurCaller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
        fichierId: fichier.id,
      })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
