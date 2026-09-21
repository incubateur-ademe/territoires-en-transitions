import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import {
  DEMARCHE_PCAET_DEFAULT_TITRE,
  DEMARCHE_PCAET_INITIAL_STATUS,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import {
  addTestBibliothequeFichier,
  completeTestDossierPcaet,
  pickFreeRegionCode,
} from '../demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('Créer une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let noAccessUser: AuthenticatedUser;

  // Une seule démarche « en cours » par collectivité : chaque test qui crée
  // travaille sur sa propre collectivité fraîche.
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

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const collectiviteAndUser = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    collectivite = collectiviteAndUser.collectivite;
    editorUser = getAuthUserFromUserCredentials(collectiviteAndUser.user);

    const noAccessUserResult = await addTestUser(db);
    noAccessUser = getAuthUserFromUserCredentials(noAccessUserResult.user);

    return async () => {
      await app.close();
    };
  });

  test('Créer une démarche avec les valeurs par défaut', async () => {
    const caller = router.createCaller({ user: editorUser });

    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    expect(demarche.id).toBeGreaterThan(0);
    expect(demarche.collectiviteId).toBe(collectivite.id);
    expect(demarche.titre).toBe(DEMARCHE_PCAET_DEFAULT_TITRE);
    expect(demarche.status).toBe(DEMARCHE_PCAET_INITIAL_STATUS);
    expect(demarche.obligation).toBe('obligatoire');
    expect(demarche.pilotes).toEqual([]);
    expect(demarche.planActionIds).toEqual([]);
    expect(demarche.transmittedOffPlatform).toBe(false);
    expect(demarche.isScotAec).toBe(false);
  });

  describe('SCoT-AEC', () => {
    test('la déclaration est portée par la démarche', async () => {
      const { caller, collectivite } = await freshEditor();

      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
        isScotAec: true,
      });

      expect(demarche.isScotAec).toBe(true);

      const relu = await caller.demarches.pcaet.get({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });
      expect(relu.isScotAec).toBe(true);
    });

    test("la compétence Banatic n'est pas exigée pour déclarer", async () => {
      // La collectivité de test n'a aucune compétence Banatic. Le serveur
      // enregistre quand même sa déclaration : le filtre 5500 décide de
      // l'affichage de la question, et refuser ici fabriquerait une impasse
      // pour une collectivité légitime dont la ligne Banatic manque.
      const { caller, collectivite } = await freshEditor();

      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
        isScotAec: true,
      });

      expect(demarche.isScotAec).toBe(true);
    });
  });

  describe('PCAET déjà transmis pour avis hors plateforme', () => {
    test('la démarche démarre à l’étape de finalisation, les deux temps ouverts', async () => {
      const { caller, collectivite } = await freshEditor();

      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
        transmittedOffPlatform: true,
      });

      expect(demarche.status).toBe('instruit_hors_plateforme');
      expect(demarche.transmittedOffPlatform).toBe(true);
      // Ni transmission ni échéance : le circuit d'avis ne s'est pas ouvert.
      expect(demarche.transmittedAt).toBeNull();
      expect(demarche.avisDeadlineAt).toBeNull();
      // Sauter l'élaboration n'enlève rien aux pièces du dossier : l'amont
      // reste à saisir, en même temps que l'aval.
      expect(demarche.amontModifiable).toBe(true);
      expect(demarche.avalModifiable).toBe(true);
    });

    test('la publication attend le dossier amont, puis les pièces aval', async () => {
      const { caller, collectivite } = await freshEditor();

      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
        transmittedOffPlatform: true,
      });

      // Rien n'a jamais attesté ce dossier : c'est la publication qui l'exige.
      expect(demarche.transitions.publier.reachable).toBe(true);
      expect(demarche.transitions.publier.enabled).toBe(false);
      expect(demarche.transitions.publier.blockedBy).toContain(
        'dossierComplet'
      );
      // Et le circuit d'avis lui reste fermé, définitivement.
      expect(demarche.transitions.transmettre_pour_avis.reachable).toBe(false);

      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });

      const complete = await caller.demarches.pcaet.get({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });
      // Le dossier amont ne bloque plus ; restent les pièces aval.
      expect(complete.transitions.publier.blockedBy).toEqual([
        'documentsAvalComplets',
      ]);
    });

    test('un dépôt hors plateforme occupe la place d’une démarche en cours', async () => {
      const { caller, collectivite } = await freshEditor();

      await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
        transmittedOffPlatform: true,
      });

      await expect(
        caller.demarches.pcaet.create({ collectiviteId: collectivite.id })
      ).rejects.toThrow();
    });

    // L'aval d'une pièce exigée à l'amont est une reprise après avis. Sans
    // transmission il n'y a pas d'avis, et la version créée serait invisible :
    // la liste fusionnée n'affiche d'une pièce que sa version exigée.
    test('une pièce du dossier ne peut pas être reprise au titre de l’aval', async () => {
      const { caller, collectivite } = await freshEditor();
      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
        transmittedOffPlatform: true,
      });
      const fichier = await addTestBibliothequeFichier(db, {
        collectiviteId: collectivite.id,
      });

      await expect(
        caller.demarches.pcaet.documents.add({
          collectiviteId: collectivite.id,
          demarcheId: demarche.id,
          documentId: 'pcaet_diagnostic',
          fichierId: fichier.id,
          etape: 'aval',
        })
        // Ce router libelle ses erreurs : c'est le message qui remonte.
      ).rejects.toThrow(/reprise qu’après les avis/);

      // La même pièce se dépose sans difficulté à son propre temps.
      await caller.demarches.pcaet.documents.add({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        documentId: 'pcaet_diagnostic',
        fichierId: fichier.id,
      });
    });

    // Le service doit voir le dossier dans sa liste — c'est le seul endroit où
    // il l'apprendra — mais il a déjà été saisi en dehors de la plateforme : le
    // notifier lui annoncerait une instruction qu'il a menée lui-même.
    test('les services couvrants sont saisis, et aucun n’est notifié', async () => {
      const regionCode = await pickFreeRegionCode(db, 'dreal');
      const fixture = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.EDITION },
        collectivite: { regionCode },
      });
      const caller = router.createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      });

      const dreal = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: {
          type: 'dreal',
          regionCode,
          nom: 'DREAL test saisine hors plateforme',
        },
      });

      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: fixture.collectivite.id,
        transmittedOffPlatform: true,
      });

      const saisines = await db.db
        .select({
          instructeurId: pcaetDemandeAvisTable.instructeurCollectiviteId,
          source: pcaetDemandeAvisTable.source,
        })
        .from(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.demarcheId, demarche.id));

      expect(
        saisines.map(({ instructeurId }) => instructeurId)
      ).toContain(dreal.collectivite.id);
      // La provenance distingue ces saisines d'une transmission : c'est elle
      // qui dit qu'aucun avis n'est attendu et qu'aucun mail n'est parti.
      expect(
        saisines.every(({ source }) => source === 'depot_hors_plateforme')
      ).toBe(true);

      const notifications = await db.db
        .select({ id: notificationTable.id })
        .from(notificationTable)
        .where(eq(notificationTable.entityId, `${demarche.id}`));
      expect(notifications).toEqual([]);
    });

    test('il reste supprimable : seule issue d’une case cochée par erreur', async () => {
      const { caller, collectivite } = await freshEditor();

      const demarche = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
        transmittedOffPlatform: true,
      });

      await caller.demarches.pcaet.delete({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      });

      const rows = await db.db
        .select({ id: demarcheTable.id })
        .from(demarcheTable)
        .where(eq(demarcheTable.id, demarche.id));
      expect(rows).toEqual([]);
    });
  });

  test('Créer une démarche avec un titre, une date de lancement et un pilote utilisateur', async () => {
    const {
      caller,
      collectivite: localCollectivite,
      user,
    } = await freshEditor();

    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
      titre: 'PCAET réglementaire 2026',
      launchedAt: '2022-01-01T00:00:00.000Z',
      pilotes: [{ userId: user.id, tagId: null }],
    });

    expect(demarche.titre).toBe('PCAET réglementaire 2026');
    expect(demarche.launchedAt).toBeTruthy();
    expect(demarche.pilotes).toHaveLength(1);
    expect(demarche.pilotes[0].userId).toBe(user.id);
    expect(demarche.pilotes[0].nom).not.toBe('');
  });

  test('Refuser une seconde démarche tant qu’une démarche est en cours', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();

    const premiere = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });

    await expect(
      caller.demarches.pcaet.create({ collectiviteId: localCollectivite.id })
    ).rejects.toThrow(
      'Une démarche PCAET est déjà en cours pour cette collectivité'
    );

    // Une fois publiée, la démarche n'est plus « en cours » : nouveau dépôt
    // possible. Instruite, elle le bloquerait encore.
    await db.db
      .update(demarcheTable)
      .set({ status: 'publie' })
      .where(eq(demarcheTable.id, premiere.id));

    const seconde = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    expect(seconde.id).not.toBe(premiere.id);
  });

  test('Refuser la création à un utilisateur sans accès à la collectivité', async () => {
    const caller = router.createCaller({ user: noAccessUser });

    await expect(
      caller.demarches.pcaet.create({ collectiviteId: collectivite.id })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
