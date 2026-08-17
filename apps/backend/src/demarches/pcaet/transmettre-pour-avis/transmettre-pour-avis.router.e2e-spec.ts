import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUser,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { listEnabledTransitions } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  addTestBibliothequeFichier,
  attachTestPlanToDemarchePcaet,
  completeTestDiagnosticPcaet,
  completeTestVulnerabilitePcaet,
  completeTestDossierPcaet,
  coverTestDocumentsPcaet,
} from '../demarches-pcaet.test-fixture';

describe('Cycle de vie de la démarche PCAET (transitions)', () => {
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

  test('Transmettre pour avis puis reprendre l’élaboration (journalisé)', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    const transmise = await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');
    // La transmission ferme le dossier d'élaboration.
    expect(transmise.amontModifiable).toBe(false);
    // La transmission fige sa date et l'échéance légale de remise des avis.
    expect(transmise.transmittedAt).not.toBeNull();
    expect(transmise.avisDeadlineAt).not.toBeNull();
    expect(
      new Date(transmise.avisDeadlineAt as string).getTime()
    ).toBeGreaterThan(Date.now());

    const reprise = await caller.demarches.pcaet.reprendreElaboration({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(reprise.status).toBe('en_elaboration');
    // L'édition du dossier reprend.
    expect(reprise.amontModifiable).toBe(true);

    const history = await db.db
      .select()
      .from(demarcheStatusHistoryTable)
      .where(eq(demarcheStatusHistoryTable.demarcheId, created.id));
    expect(history.map((entry) => entry.transition)).toEqual([
      'transmettre_pour_avis',
      'reprendre_elaboration',
    ]);
    expect(history[0].fromStatus).toBe('en_elaboration');
    expect(history[0].toStatus).toBe('transmis_pour_avis');
  });

  test('Adopter : refusé avant la fin du délai d’avis, accepté après', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    await expect(
      caller.demarches.pcaet.adopter({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DELAI_AVIS_NON_ECOULE');

    await backdateTransmission(created.id);

    const adoptee = await caller.demarches.pcaet.adopter({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(adoptee.status).toBe('adopte');
  });

  test('Archiver reste fermé tant que l’évaluation finale n’est pas modélisée (fail-closed)', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await backdateTransmission(created.id);
    await caller.demarches.pcaet.adopter({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    // On n'archive qu'un dossier publié : avant la publication, ce n'est pas
    // une condition qui manque, c'est la transition qui n'existe pas.
    await expect(
      caller.demarches.pcaet.archiver({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('TRANSITION_NOT_ALLOWED');

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
    await caller.demarches.pcaet.publier({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    // Le dossier est publié : la transition est atteignable, c'est son guard
    // qui la bloque, faute de source pour l'évaluation finale.
    await expect(
      caller.demarches.pcaet.archiver({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('EVALUATION_FINALE_MANQUANTE');
  });

  test('Le guard estPilote réserve les transitions pilotées aux pilotes', async () => {
    const fixture = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.EDITION },
      ],
    });
    const pilote = getAuthUserFromUserCredentials(fixture.users[0]);
    const autreEditeur = getAuthUserFromUserCredentials(fixture.users[1]);
    const piloteCaller = router.createCaller({ user: pilote });
    const autreEditeurCaller = router.createCaller({ user: autreEditeur });

    const created = await piloteCaller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
      pilotes: [{ userId: pilote.id, tagId: null }],
    });
    // `transmettre_pour_avis` cumule estPilote et dossierComplet : même pour le
    // pilote, elle reste indisponible tant que le dossier est vide.
    expect(listEnabledTransitions(created.transitions)).toEqual([]);
    // Le dossier est bien ouvert en écriture : c'est son contenu qui manque.
    expect(created.amontModifiable).toBe(true);

    await completeTestDossierPcaet(db, {
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });

    // Les transitions applicables sont calculées par utilisateur.
    const vuePilote = await piloteCaller.demarches.pcaet.get({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(vuePilote.transitions)).toEqual([
      'transmettre_pour_avis',
    ]);

    const vueAutreEditeur = await autreEditeurCaller.demarches.pcaet.get({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(vueAutreEditeur.transitions)).toEqual([]);

    // Un éditeur non pilote ne peut pas transmettre…
    await expect(
      autreEditeurCaller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: fixture.collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('NON_PILOTE');

    // …le pilote, oui.
    const transmise = await piloteCaller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');

    // L'adoption obéit à la même règle : le délai d'avis écoulé ouvre la
    // transition, mais la décision reste celle du pilote.
    await backdateTransmission(created.id);
    await expect(
      autreEditeurCaller.demarches.pcaet.adopter({
        collectiviteId: fixture.collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('NON_PILOTE');

    const adoptee = await piloteCaller.demarches.pcaet.adopter({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(adoptee.status).toBe('adopte');
  });

  test('Le guard dossierComplet exige les pièces requises et le programme d’actions', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    // Dossier vide : aucune pièce requise couverte, aucun plan rattaché.
    expect(listEnabledTransitions(created.transitions)).toEqual([]);
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    // Les pièces requises couvertes ne suffisent pas : sans programme d'actions
    // rattaché, le serveur refuse la transmission — et ne l'annonce pas.
    await coverTestDocumentsPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    const sansPlan = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(sansPlan.transitions)).toEqual([]);
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    // Le programme d'actions rattaché ne suffit pas non plus : le diagnostic
    // doit porter un résultat et un objectif sur chaque ligne requise.
    await attachTestPlanToDemarchePcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    const sansDiagnostic = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(sansDiagnostic.transitions)).toEqual([]);
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    // Le diagnostic à indicateurs ne suffit pas davantage : la vulnérabilité du
    // territoire doit être déclarée pour chaque domaine de la liste.
    await completeTestDiagnosticPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    const sansVulnerabilite = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(sansVulnerabilite.transitions)).toEqual([]);

    // Les quatre conditions réunies, la transition s'ouvre.
    await completeTestVulnerabilitePcaet(db, { demarcheId: created.id });

    const transmise = await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');
  });

  test('Une transition interdite depuis le statut courant est refusée', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    await expect(
      caller.demarches.pcaet.adopter({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('TRANSITION_NOT_ALLOWED');
  });
});
