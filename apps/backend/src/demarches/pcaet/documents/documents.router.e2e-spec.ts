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
  computePcaetDocumentsCoverage,
  isPcaetDossierDocumentsComplet,
} from '@tet/domain/demarches';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { CollectiviteRole } from '@tet/domain/users';
import {
  addTestBibliothequeFichier,
  PCAET_DOCUMENT_GLOBAL_ID,
} from '../demarches-pcaet.test-fixture';

describe('Documents d’une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  // Une seule démarche active par collectivité : chaque cas part d'une
  // collectivité neuve.
  const freshEditor = async (role: CollectiviteRole = CollectiviteRole.EDITION) => {
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

    expect(snapshot.definitions).toHaveLength(10);
    expect(snapshot.documents).toEqual([]);

    const global = snapshot.definitions.find(
      (definition) => definition.portee === 'global'
    );
    expect(global?.id).toBe(PCAET_DOCUMENT_GLOBAL_ID);

    const sections = snapshot.definitions.filter(
      (definition) => definition.portee === 'section'
    );
    expect(sections).toHaveLength(9);
    // Les sections sont triées par ordre d'affichage et toutes substituables
    // par le document global.
    expect(sections.map((section) => section.id)).toEqual([
      'pcaet_diagnostic',
      'pcaet_strategie_territoriale',
      'pcaet_plan_actions',
      'pcaet_dispositif_suivi_evaluation',
      'pcaet_ees',
      'pcaet_deliberation_adoption',
      'pcaet_memoire_reponse_avis',
      'pcaet_synthese_consultation_publique',
      'pcaet_bilan_pcaet_precedent',
    ]);
    expect(
      sections.every((section) =>
        section.substituts.includes(PCAET_DOCUMENT_GLOBAL_ID)
      )
    ).toBe(true);
    expect(
      sections.filter((section) => section.requis).map((section) => section.id)
    ).toEqual([
      'pcaet_diagnostic',
      'pcaet_strategie_territoriale',
      'pcaet_plan_actions',
      'pcaet_dispositif_suivi_evaluation',
    ]);
    expect(
      sections.find((section) => section.id === 'pcaet_dispositif_suivi_evaluation')
        ?.couverturePlateforme
    ).toBe('plan_actions');

    expect(isPcaetDossierDocumentsComplet(snapshot)).toBe(false);
  });

  test('Le document global couvre toutes les sections attendues', async () => {
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
    const coverage = computePcaetDocumentsCoverage(snapshot);
    expect(coverage.every(({ couvert }) => couvert)).toBe(true);
    expect(
      coverage.find(({ documentId }) => documentId === 'pcaet_diagnostic')?.origine
    ).toBe('substitut');
    expect(isPcaetDossierDocumentsComplet(snapshot)).toBe(true);
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
    expect(isPcaetDossierDocumentsComplet(snapshot)).toBe(false);

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
      'Seuls les fichiers PDF sont acceptés dans un dossier PCAET'
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
    await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      transition: 'transmettre_pour_avis',
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
      'Les documents d’un dossier transmis pour avis ne sont plus modifiables'
    );
    await expect(
      caller.demarches.pcaet.documents.remove({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
      })
    ).rejects.toThrow(
      'Les documents d’un dossier transmis pour avis ne sont plus modifiables'
    );

    // La lecture reste possible.
    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(snapshot.documents).toHaveLength(1);
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
