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
    const { caller, collectivite: localCollectivite, user } =
      await freshEditor();
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

  test('Refuser la modification d’une démarche transmise pour avis', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
    });
    await caller.demarches.pcaet.applyTransition({
      collectiviteId: localCollectivite.id,
      demarcheId: created.id,
      transition: 'transmettre_pour_avis',
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
