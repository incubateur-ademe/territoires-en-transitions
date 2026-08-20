import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import {
  completeTestDiagnosticPcaet,
  completeTestDossierPcaet,
  coverTestDocumentsPcaet,
} from '../demarches-pcaet.test-fixture';

describe('Mettre à jour une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

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

    return async () => {
      await app.close();
    };
  });

  test('Mettre à jour les champs du header et remplacer les pilotes', async () => {
    const {
      caller,
      collectivite: localCollectivite,
      user,
    } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
      pilotes: [{ userId: user.id, tagId: null }],
    });

    const updated = await caller.demarches.pcaet.update({
      collectiviteId: localCollectivite.id,
      demarcheId: created.id,
      titre: 'Titre mis à jour',
      description: 'Une description',
      obligation: 'volontaire',
      launchedAt: '2023-06-01T00:00:00.000Z',
      pilotes: [],
    });

    expect(updated.titre).toBe('Titre mis à jour');
    expect(updated.description).toBe('Une description');
    expect(updated.obligation).toBe('volontaire');
    expect(updated.launchedAt).toBeTruthy();
    expect(updated.pilotes).toEqual([]);
    expect(updated.modifiedAt).not.toBe(created.modifiedAt);
  });

  test('Rattacher un plan de la collectivité, refuser un plan étranger', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    const plan = await caller.plans.plans.create({
      nom: 'Plan PCAET de test',
      collectiviteId: localCollectivite.id,
    });

    const updated = await caller.demarches.pcaet.update({
      collectiviteId: localCollectivite.id,
      demarcheId: created.id,
      planActionId: plan.id,
    });
    expect(updated.planActionId).toBe(plan.id);

    // Un plan d'une autre collectivité est refusé.
    const other = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const otherCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });
    const foreignPlan = await otherCaller.plans.plans.create({
      nom: 'Plan étranger',
      collectiviteId: other.collectivite.id,
    });

    await expect(
      caller.demarches.pcaet.update({
        collectiviteId: localCollectivite.id,
        demarcheId: created.id,
        planActionId: foreignPlan.id,
      })
    ).rejects.toThrow(
      'Le plan d’action à rattacher n’existe pas dans cette collectivité'
    );
  });

  test('Refuser un plan tenu par une autre démarche active', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    const plan = await caller.plans.plans.create({
      nom: 'Plan convoité',
      collectiviteId: localCollectivite.id,
    });

    // État conflictuel inatteignable via l'API publique (une seule démarche
    // active par collectivité et par type, plans cloisonnés par collectivité) :
    // on le seede directement, c'est précisément ce que l'exclusivité couvre.
    const other = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    await db.db.insert(demarcheTable).values({
      collectiviteId: other.collectivite.id,
      type: DemarcheTypeEnum.PCAET,
      titre: 'Démarche déjà servie',
      planActionId: plan.id,
    });

    await expect(
      caller.demarches.pcaet.update({
        collectiviteId: localCollectivite.id,
        demarcheId: created.id,
        planActionId: plan.id,
      })
    ).rejects.toThrow(
      'Ce plan d’action est déjà rattaché à une autre démarche en cours'
    );
  });

  test('Re-lier son propre plan est idempotent', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    const plan = await caller.plans.plans.create({
      nom: 'Plan relié deux fois',
      collectiviteId: localCollectivite.id,
    });

    await caller.demarches.pcaet.update({
      collectiviteId: localCollectivite.id,
      demarcheId: created.id,
      planActionId: plan.id,
    });
    const relinked = await caller.demarches.pcaet.update({
      collectiviteId: localCollectivite.id,
      demarcheId: created.id,
      planActionId: plan.id,
    });
    expect(relinked.planActionId).toBe(plan.id);
  });

  test('Une démarche adoptée libère son plan pour le cycle suivant', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();
    const first = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    const plan = await caller.plans.plans.create({
      nom: 'Plan du premier cycle',
      collectiviteId: localCollectivite.id,
    });
    await caller.demarches.pcaet.update({
      collectiviteId: localCollectivite.id,
      demarcheId: first.id,
      planActionId: plan.id,
    });

    // Dossier complet sans toucher au plan déjà rattaché (la fixture composée
    // en rattacherait un nouveau).
    const options = {
      collectiviteId: localCollectivite.id,
      demarcheId: first.id,
    };
    await coverTestDocumentsPcaet(db, options);
    await completeTestDiagnosticPcaet(db, options);

    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: localCollectivite.id,
      demarcheId: first.id,
    });
    // Antidate l'échéance d'avis pour rendre l'adoption possible.
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, first.id));
    await caller.demarches.pcaet.adopter({
      collectiviteId: localCollectivite.id,
      demarcheId: first.id,
    });

    const second = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    const updated = await caller.demarches.pcaet.update({
      collectiviteId: localCollectivite.id,
      demarcheId: second.id,
      planActionId: plan.id,
    });
    expect(updated.planActionId).toBe(plan.id);
  });

  test('Refuser la modification d’une démarche transmise pour avis', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: localCollectivite.id,
      demarcheId: created.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: localCollectivite.id,
      demarcheId: created.id,
    });

    await expect(
      caller.demarches.pcaet.update({
        collectiviteId: localCollectivite.id,
        demarcheId: created.id,
        titre: 'Titre interdit',
      })
    ).rejects.toThrow('Une démarche transmise pour avis n’est plus modifiable');
  });
});
