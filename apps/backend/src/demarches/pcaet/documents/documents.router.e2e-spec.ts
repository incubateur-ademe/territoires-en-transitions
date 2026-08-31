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
import { demarcheDocumentDefinitionTable } from '@tet/backend/demarches/shared/models/demarche-document-definition.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import {
  CollectiviteSousTypeEnum,
  CollectiviteTypeEnum,
} from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import {
  PCAET_DOCUMENT_GLOBAL_ID,
  addTestBibliothequeFichier,
  cloreTestInstructionPcaet,
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

  /**
   * Une collectivité dont l'identité déclenche les pièces conditionnelles. Sans
   * population ni nature INSEE — le cas des autres tests — aucune ne s'applique.
   */
  const freshDemarcheAssujettie = async (
    collectivite: { population?: number; natureInsee?: 'CA' | 'SMF' } = {}
  ) => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
      collectivite,
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
    });
    return { collectivite: fixture.collectivite, user, caller, demarche };
  };

  const listDocumentIds = async (
    caller: ReturnType<TrpcRouter['createCaller']>,
    collectiviteId: number,
    demarcheId: number
  ) => {
    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId,
      demarcheId,
    });
    return snapshot.definitions.map(({ id }) => id);
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

    // Ni assujettie aux plans annexes, ni en renouvellement : le socle commun.
    expect(snapshot.definitions).toHaveLength(12);
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

    // Une seule liste : le PCAET global y est une pièce comme les autres, à son
    // rang, et rien ne le distingue plus dans le modèle que son ordre.
    const sections = snapshot.definitions;
    expect(sections).toHaveLength(12);
    expect(sections[0].id).toBe(PCAET_DOCUMENT_GLOBAL_ID);
    // Les sections sont triées par ordre d'affichage : la chronologie de la
    // démarche, de la délibération d'engagement à celle d'adoption.
    expect(sections.map((section) => section.id)).toEqual([
      PCAET_DOCUMENT_GLOBAL_ID,
      'pcaet_deliberation_engagement',
      'pcaet_diagnostic',
      'pcaet_strategie_territoriale',
      'pcaet_plan_actions',
      'pcaet_dispositif_suivi_evaluation',
      'pcaet_ees',
      'pcaet_etude_impact',
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
    // Le PCAET global couvre d'office les sections qu'il regroupe toujours, ni
    // les optionnelles ni les pièces aval.
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
    ]);
    // L'étude d'impact et la délibération d'arrêt, elles, ne s'y retrouvent pas
    // systématiquement : leur inclusion se déclare, comme celle du dispositif de
    // suivi dans le programme d'actions.
    expect(
      sections
        .filter((section) =>
          section.substitutsDeclarables.includes(PCAET_DOCUMENT_GLOBAL_ID)
        )
        .map((section) => section.id)
    ).toEqual(['pcaet_etude_impact', 'pcaet_deliberation_arret']);
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
    // Le dispositif de suivi vit dans le programme d'actions : son inclusion se
    // déclare, comme celles que le PCAET global n'absorbe pas d'office.
    expect(
      sections.find(
        (section) => section.id === 'pcaet_dispositif_suivi_evaluation'
      )?.substitutsDeclarables
    ).toEqual(['pcaet_plan_actions']);

    expect(isDemarcheDossierDocumentsComplet(snapshot)).toBe(false);
  });

  test('Le PCAET global couvre les sections qu’il regroupe d’office', async () => {
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
    // Le dossier n'est pas complet pour autant : les pièces requises que le
    // global ne regroupe pas d'office attendent la déclaration d'inclusion.
    expect(isDemarcheDossierDocumentsComplet(snapshot)).toBe(false);

    for (const definition of snapshot.definitions.filter(
      ({ substitutsDeclarables }) =>
        substitutsDeclarables.includes(PCAET_DOCUMENT_GLOBAL_ID)
    )) {
      await caller.demarches.pcaet.documents.setCouverture({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: definition.id,
        couvert: true,
      });
    }

    const apresDeclarations = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(isDemarcheDossierDocumentsComplet(apresDeclarations)).toBe(true);
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

  test('La déclaration d’inclusion n’accepte que les pièces éligibles', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();

    // Seul le modèle décide : l'EES n'est rangée dans aucune autre pièce.
    await expect(
      caller.demarches.pcaet.documents.setCouverture({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_ees',
        couvert: true,
      })
    ).rejects.toThrow(
      'Cette pièce ne peut pas être déclarée comprise dans une autre pièce du dossier'
    );

    // Une inclusion cochée d'office au dépôt se décoche : `automatic` est un
    // défaut, pas une couverture imposée.
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
      fichierId: fichier.id,
    });
    const apresDepot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(
      computeDemarcheDocumentsCoverage(apresDepot).find(
        ({ documentId }) => documentId === 'pcaet_diagnostic'
      )?.couvert
    ).toBe(true);

    await caller.demarches.pcaet.documents.setCouverture({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: 'pcaet_diagnostic',
      couvert: false,
    });
    const apresDecochage = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(
      computeDemarcheDocumentsCoverage(apresDecochage).find(
        ({ documentId }) => documentId === 'pcaet_diagnostic'
      )?.couvert
    ).toBe(false);

    await caller.demarches.pcaet.documents.remove({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
    });

    // Le dépôt de la pièce qui accueille l'inclusion n'est pas exigé pour la
    // déclarer : c'est la règle de couverture qui décide si elle vaut.
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
    // Le programme d'actions n'étant pas déposé, la déclaration ne couvre encore
    // rien — elle est enregistrée, pas effective.
    expect(
      computeDemarcheDocumentsCoverage(snapshot).find(
        ({ documentId }) => documentId === 'pcaet_dispositif_suivi_evaluation'
      )?.couvert
    ).toBe(false);

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

  test('L’étude d’impact et la délibération d’arrêt se déclarent comprises dans le PCAET global', async () => {
    const { caller, collectivite, demarche } = await freshDemarche();
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
    });
    const ids = { collectiviteId: collectivite.id, demarcheId: demarche.id };

    // Le PCAET global déposé ne couvre plus ces deux pièces d'office.
    await caller.demarches.pcaet.documents.add({
      ...ids,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
      fichierId: fichier.id,
    });
    const avecGlobal = await caller.demarches.pcaet.documents.list(ids);
    const couvertureDe = (
      snapshot: Awaited<
        ReturnType<typeof caller.demarches.pcaet.documents.list>
      >,
      documentId: string
    ) =>
      computeDemarcheDocumentsCoverage(snapshot).find(
        (entry) => entry.documentId === documentId
      );

    expect(couvertureDe(avecGlobal, 'pcaet_etude_impact')?.couvert).toBe(false);
    expect(couvertureDe(avecGlobal, 'pcaet_deliberation_arret')?.couvert).toBe(
      false
    );
    // Les sections qui y sont bien systématiquement, elles, restent couvertes.
    expect(couvertureDe(avecGlobal, 'pcaet_diagnostic')?.origine).toBe(
      'substitut'
    );

    // La collectivité déclare l'inclusion, pièce par pièce.
    await caller.demarches.pcaet.documents.setCouverture({
      ...ids,
      documentId: 'pcaet_etude_impact',
      couvert: true,
    });
    const apresDeclaration = await caller.demarches.pcaet.documents.list(ids);
    expect(couvertureDe(apresDeclaration, 'pcaet_etude_impact')).toMatchObject({
      couvert: true,
      origine: 'substitut',
      substitutId: PCAET_DOCUMENT_GLOBAL_ID,
    });

    // La déclaration ne vaut que tant que le document qui l'accueille est là.
    await caller.demarches.pcaet.documents.remove({
      ...ids,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
    });
    const sansGlobal = await caller.demarches.pcaet.documents.list(ids);
    expect(couvertureDe(sansGlobal, 'pcaet_etude_impact')?.couvert).toBe(false);
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
    // Le global ne regroupe pas d'office l'étude d'impact ni la délibération
    // d'arrêt : sans leur déclaration d'inclusion, le dossier reste incomplet.
    for (const documentId of [
      'pcaet_etude_impact',
      'pcaet_deliberation_arret',
    ]) {
      await caller.demarches.pcaet.documents.setCouverture({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId,
        couvert: true,
      });
    }
    const plan = await caller.plans.plans.create({
      nom: 'Programme d’actions du PCAET',
      collectiviteId: collectivite.id,
    });
    await caller.demarches.pcaet.update({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      planActionIds: [plan.id],
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

    // La lecture reste possible : le dépôt du global, les quatre inclusions qu'il
    // coche d'office et les deux déclarées avant la transmission.
    const snapshot = await caller.demarches.pcaet.documents.list({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    expect(snapshot.documents).toHaveLength(7);
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
    await cloreTestInstructionPcaet(app, db, {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    // Instruit : la pièce aval se dépose et se retire, l'amont n'est plus modifiable.
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

    // Le catalogue avant tout ajout : c'est son immobilité qui compte, pas son
    // cardinal — il grandit avec le référentiel.
    const avantAjout = await caller.demarches.pcaet.documents.list(dossier);

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
    expect(snapshot.definitions).toHaveLength(avantAjout.definitions.length);

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

    await cloreTestInstructionPcaet(app, db, dossier);

    // Instruit : l'aval s'ouvre, l'amont reste gelé.
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

    // La configuration est une donnée partagée par le type : on relit l'état
    // d'origine pour le rendre tel quel, et ne pas fermer le dépôt de pièces
    // additionnelles aux cas suivants.
    const [origine] = await db.db
      .select({
        documentsAdditionalAmont:
          demarcheDefinitionTable.documentsAdditionalAmont,
      })
      .from(demarcheDefinitionTable)
      .where(eq(demarcheDefinitionTable.demarcheType, 'pcaet'));
    await db.db
      .update(demarcheDefinitionTable)
      .set({ documentsAdditionalAmont: false })
      .where(eq(demarcheDefinitionTable.demarcheType, 'pcaet'));
    onTestFinished(async () => {
      await db.db
        .update(demarcheDefinitionTable)
        .set({
          documentsAdditionalAmont: origine.documentsAdditionalAmont,
        })
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

  /**
   * Une condition illisible laisse sa pièce au catalogue plutôt que de la
   * masquer en silence — masquer une pièce requise rendrait le dossier
   * faussement complet. Cette garde est la contrepartie : une coquille de
   * migration casse la CI, pas la production.
   *
   * Elle évalue, elle ne se contente pas de parser : `validateExpression` ne
   * contrôle ni le nom du champ ni la valeur passés à `identite(...)`, donc un
   * `plus_de_4500` mal tapé passerait le parsing.
   */
  it('toutes les conditions d’assujettissement du catalogue s’évaluent', async () => {
    const expressionService = app.get(PersonnalisationsExpressionService);
    const conditions = await db.db
      .select({
        id: demarcheDocumentDefinitionTable.id,
        exprApplicable: demarcheDocumentDefinitionTable.exprApplicable,
      })
      .from(demarcheDocumentDefinitionTable);

    const identiteCollectivite = {
      type: CollectiviteTypeEnum.EPCI,
      soustype: CollectiviteSousTypeEnum.EPCI_FP,
      populationTags: [],
      drom: false,
    };

    const renseignees = conditions.filter(
      ({ exprApplicable }) => exprApplicable !== null
    );
    expect(renseignees.length).toBeGreaterThan(0);

    for (const { id, exprApplicable } of renseignees) {
      const evaluer = () =>
        expressionService.parseAndEvaluateExpression(exprApplicable as string, {
          identiteCollectivite,
          reponses: {},
          // Toutes les dimensions du contexte, sans quoi une condition qui en
          // dépend s'évaluerait à faux par défaut : vraie, mais creuse.
          demarcheContext: { renouvellement: false },
        });
      expect(evaluer, `condition de ${id}`).not.toThrow();
      expect(typeof evaluer(), `condition de ${id}`).toBe('boolean');
    }
  });

  describe('Bilan du PCAET précédent : attendu des seuls renouvellements', () => {
    const BILAN = 'pcaet_bilan_pcaet_precedent';

    /** Un dépôt antérieur mené à son terme, inséré tel quel : ce qui est testé
     *  ici est la lecture de l'historique, pas le workflow de publication. */
    const addDemarcheAnterieure = async (
      collectiviteId: number,
      status: 'publie' | 'archive' | 'instruit'
    ) => {
      const [demarche] = await db.db
        .insert(demarcheTable)
        .values({
          collectiviteId,
          type: 'pcaet',
          titre: 'PCAET précédent',
          status,
        })
        .returning({ id: demarcheTable.id });
      return demarche;
    };

    it('une première élaboration ne se voit pas demander le bilan', async () => {
      const { caller, collectivite, demarche } = await freshDemarche();

      const ids = await listDocumentIds(caller, collectivite.id, demarche.id);

      expect(ids).not.toContain(BILAN);
    });

    it('un renouvellement se le voit demander, obligatoire et déclarable dans le PCAET global', async () => {
      const { caller, collectivite } = await freshEditor();
      await addDemarcheAnterieure(collectivite.id, 'publie');
      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });

      const snapshot = await caller.demarches.pcaet.documents.list({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });

      const bilan = snapshot.definitions.find(({ id }) => id === BILAN);
      expect(bilan?.requis).toBe(true);
      expect(bilan?.substituts).toEqual([]);
      expect(bilan?.substitutsDeclarables).toEqual([PCAET_DOCUMENT_GLOBAL_ID]);
    });

    // Le piège : sans exclure la démarche consultée, un PCAET publié passerait
    // pour le renouvellement de lui-même.
    it('la démarche publiée ne se voit pas demander son propre bilan', async () => {
      const { caller, collectivite } = await freshEditor();
      const precedente = await addDemarcheAnterieure(collectivite.id, 'publie');

      const ids = await listDocumentIds(caller, collectivite.id, precedente.id);

      expect(ids).not.toContain(BILAN);
    });

    it('un dépôt antérieur resté en instruction ne fait pas un renouvellement', async () => {
      // Dans cet ordre : une démarche en instruction est « en cours », elle
      // interdirait la création d'une seconde par l'API.
      const { caller, collectivite, demarche } = await freshDemarche();
      await addDemarcheAnterieure(collectivite.id, 'instruit');

      const ids = await listDocumentIds(caller, collectivite.id, demarche.id);

      expect(ids).not.toContain(BILAN);
    });

    it('le bilan n’est pas couvert d’office par le PCAET global : son inclusion se déclare', async () => {
      const { caller, collectivite } = await freshEditor();
      await addDemarcheAnterieure(collectivite.id, 'archive');
      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      const fichier = await addTestBibliothequeFichier(db, {
        collectiviteId: collectivite.id,
      });

      await caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
        fichierId: fichier.id,
      });

      const couvertureDe = async () => {
        const snapshot = await caller.demarches.pcaet.documents.list({
          collectiviteId: collectivite.id,
          demarcheId: demarche.id,
        });
        return computeDemarcheDocumentsCoverage(snapshot).find(
          ({ documentId }) => documentId === BILAN
        );
      };

      // Le PCAET global ne contient pas systématiquement le bilan du précédent.
      expect((await couvertureDe())?.couvert).toBe(false);

      await caller.demarches.pcaet.documents.setCouverture({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: BILAN,
        couvert: true,
      });

      const apres = await couvertureDe();
      expect(apres?.couvert).toBe(true);
      expect(apres?.origine).toBe('substitut');
      expect(apres?.substitutId).toBe(PCAET_DOCUMENT_GLOBAL_ID);
    });
  });

  describe('Pièces attendues des seules collectivités assujetties', () => {
    // Sans population ni nature INSEE, la collectivité des autres tests n'est
    // assujettie à rien : les deux plans annexes lui sont invisibles.
    it('un EPCI à fiscalité propre de plus de 100 000 habitants voit les deux plans', async () => {
      const { caller, collectivite, demarche } = await freshDemarcheAssujettie({
        population: 684371,
        natureInsee: 'CA',
      });

      const snapshot = await caller.demarches.pcaet.documents.list({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });

      expect(snapshot.definitions).toHaveLength(14);
      expect(snapshot.definitions.map(({ id }) => id)).toEqual([
        PCAET_DOCUMENT_GLOBAL_ID,
        'pcaet_deliberation_engagement',
        'pcaet_diagnostic',
        'pcaet_strategie_territoriale',
        'pcaet_plan_actions',
        'pcaet_plan_qualite_air',
        'pcaet_plan_chaleur_froid',
        'pcaet_dispositif_suivi_evaluation',
        'pcaet_ees',
        'pcaet_etude_impact',
        'pcaet_deliberation_arret',
        'pcaet_memoire_reponse_avis',
        'pcaet_synthese_consultation_publique',
        'pcaet_deliberation_adoption',
      ]);

      // Les deux se déclarent comprises dans le programme d'actions, et nulle
      // part ailleurs : l'écran ne propose qu'une case.
      for (const id of ['pcaet_plan_qualite_air', 'pcaet_plan_chaleur_froid']) {
        const plan = snapshot.definitions.find(
          (definition) => definition.id === id
        );
        expect(plan?.requis).toBe(true);
        expect(plan?.substituts).toEqual([]);
        expect(plan?.substitutsDeclarables).toEqual(['pcaet_plan_actions']);
      }
    });

    it('les deux conditions sont indépendantes : à 60 000 habitants, seul le plan chaleur et froid est attendu', async () => {
      const { caller, collectivite, demarche } = await freshDemarcheAssujettie({
        population: 60000,
        natureInsee: 'CA',
      });

      const ids = await listDocumentIds(caller, collectivite.id, demarche.id);

      expect(ids).toContain('pcaet_plan_chaleur_froid');
      expect(ids).not.toContain('pcaet_plan_qualite_air');
    });

    it('le seuil est strict : à exactement 100 000 habitants la qualité de l’air n’est pas attendue', async () => {
      const { caller, collectivite, demarche } = await freshDemarcheAssujettie({
        population: 100000,
        natureInsee: 'CA',
      });

      const ids = await listDocumentIds(caller, collectivite.id, demarche.id);

      expect(ids).not.toContain('pcaet_plan_qualite_air');
      // 100 000 reste au-dessus de 45 000.
      expect(ids).toContain('pcaet_plan_chaleur_froid');
    });

    it('un syndicat n’est pas assujetti à la qualité de l’air, quelle que soit sa taille', async () => {
      const { caller, collectivite, demarche } = await freshDemarcheAssujettie({
        population: 200000,
        natureInsee: 'SMF',
      });

      const ids = await listDocumentIds(caller, collectivite.id, demarche.id);

      expect(ids).not.toContain('pcaet_plan_qualite_air');
      expect(ids).toContain('pcaet_plan_chaleur_froid');
    });

    it('une pièce qui ne concerne pas la collectivité ne peut ni être déposée ni être déclarée incluse', async () => {
      const { caller, collectivite, demarche } = await freshDemarche();
      const fichier = await addTestBibliothequeFichier(db, {
        collectiviteId: collectivite.id,
      });

      await expect(
        caller.demarches.pcaet.documents.add({
          collectiviteId: collectivite.id,
          demarcheId: demarche.id,
          documentId: 'pcaet_plan_chaleur_froid',
          fichierId: fichier.id,
        })
      ).rejects.toThrow();

      await expect(
        caller.demarches.pcaet.documents.setCouverture({
          collectiviteId: collectivite.id,
          demarcheId: demarche.id,
          documentId: 'pcaet_plan_chaleur_froid',
          couvert: true,
        })
      ).rejects.toThrow();
    });

    it('déclarer le plan compris dans le programme d’actions suffit à couvrir la pièce', async () => {
      const { caller, collectivite, demarche } = await freshDemarcheAssujettie({
        population: 60000,
        natureInsee: 'CA',
      });
      const fichier = await addTestBibliothequeFichier(db, {
        collectiviteId: collectivite.id,
      });

      // La case ne vaut rien tant que le programme d'actions n'est pas déposé.
      await caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_plan_actions',
        fichierId: fichier.id,
      });
      await caller.demarches.pcaet.documents.setCouverture({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_plan_chaleur_froid',
        couvert: true,
      });

      const snapshot = await caller.demarches.pcaet.documents.list({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });
      const couverture = computeDemarcheDocumentsCoverage(snapshot).find(
        ({ documentId }) => documentId === 'pcaet_plan_chaleur_froid'
      );
      expect(couverture?.couvert).toBe(true);
      expect(couverture?.origine).toBe('substitut');
      expect(couverture?.substitutId).toBe('pcaet_plan_actions');
    });

    it('une pièce conditionnelle non couverte retient la complétude du dossier', async () => {
      const { caller, collectivite, demarche } = await freshDemarcheAssujettie({
        population: 60000,
        natureInsee: 'CA',
      });
      // Dépose le document global, qui couvre d'office les sections requises
      // inconditionnelles — mais pas les deux plans annexes.
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });

      const avant = await caller.demarches.pcaet.documents.list({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });
      expect(isDemarcheDossierDocumentsComplet(avant)).toBe(false);

      const fichier = await addTestBibliothequeFichier(db, {
        collectiviteId: collectivite.id,
      });
      await caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_plan_chaleur_froid',
        fichierId: fichier.id,
      });

      const apres = await caller.demarches.pcaet.documents.list({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });
      expect(isDemarcheDossierDocumentsComplet(apres)).toBe(true);
    });
  });
});
