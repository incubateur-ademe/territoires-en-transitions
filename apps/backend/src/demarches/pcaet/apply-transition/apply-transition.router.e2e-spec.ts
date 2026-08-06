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
import { eq } from 'drizzle-orm';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';

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
    const transmise = await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      transition: 'transmettre_pour_avis',
    });
    expect(transmise.status).toBe('transmis_pour_avis');
    // La transmission fige sa date et l'échéance légale de remise des avis.
    expect(transmise.transmittedAt).not.toBeNull();
    expect(transmise.avisDeadlineAt).not.toBeNull();
    expect(
      new Date(transmise.avisDeadlineAt as string).getTime()
    ).toBeGreaterThan(Date.now());

    const reprise = await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      transition: 'reprendre_elaboration',
    });
    expect(reprise.status).toBe('en_elaboration');

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
    await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      transition: 'transmettre_pour_avis',
    });

    await expect(
      caller.demarches.pcaet.applyTransition({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        transition: 'adopter',
      })
    ).rejects.toThrow(
      'Les conditions requises pour cette transition ne sont pas remplies'
    );

    await backdateTransmission(created.id);

    const adoptee = await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      transition: 'adopter',
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
    await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      transition: 'transmettre_pour_avis',
    });
    await backdateTransmission(created.id);
    await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      transition: 'adopter',
    });

    await expect(
      caller.demarches.pcaet.applyTransition({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        transition: 'archiver',
      })
    ).rejects.toThrow(
      'Les conditions requises pour cette transition ne sont pas remplies'
    );
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
    expect(created.availableTransitions).toEqual([]);

    await completeTestDossierPcaet(db, {
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });

    // Les transitions applicables sont calculées par utilisateur.
    const vuePilote = await piloteCaller.demarches.pcaet.get({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(vuePilote.availableTransitions).toEqual(['transmettre_pour_avis']);

    const vueAutreEditeur = await autreEditeurCaller.demarches.pcaet.get({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(vueAutreEditeur.availableTransitions).toEqual([]);

    // Un éditeur non pilote ne peut pas transmettre…
    await expect(
      autreEditeurCaller.demarches.pcaet.applyTransition({
        collectiviteId: fixture.collectivite.id,
        demarcheId: created.id,
        transition: 'transmettre_pour_avis',
      })
    ).rejects.toThrow(
      'Les conditions requises pour cette transition ne sont pas remplies'
    );

    // …le pilote, oui.
    const transmise = await piloteCaller.demarches.pcaet.applyTransition({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
      transition: 'transmettre_pour_avis',
    });
    expect(transmise.status).toBe('transmis_pour_avis');
  });

  test('Le guard dossierComplet exige les pièces requises et le programme d’actions', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    // Dossier vide : aucune pièce requise couverte, aucun plan rattaché.
    expect(created.availableTransitions).toEqual([]);
    await expect(
      caller.demarches.pcaet.applyTransition({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        transition: 'transmettre_pour_avis',
      })
    ).rejects.toThrow(
      'Les conditions requises pour cette transition ne sont pas remplies'
    );

    // Le seul document global couvre toutes les sections requises.
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    const transmise = await caller.demarches.pcaet.applyTransition({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      transition: 'transmettre_pour_avis',
    });
    expect(transmise.status).toBe('transmis_pour_avis');
  });

  test('Une transition interdite depuis le statut courant est refusée', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    await expect(
      caller.demarches.pcaet.applyTransition({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        transition: 'adopter',
      })
    ).rejects.toThrow(
      'Cette transition n’est pas permise depuis le statut actuel de la démarche'
    );
  });
});
