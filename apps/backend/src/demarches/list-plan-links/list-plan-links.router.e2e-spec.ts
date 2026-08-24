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
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';

describe('Lister les plans rattachés aux démarches', () => {
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

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Retourner les liens de toute démarche avec plan, quel que soit son statut', async () => {
    const { caller, collectivite } = await freshEditor();
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    // Sans plan rattaché : aucun lien.
    expect(
      await caller.demarches.listPlanLinks({ collectiviteId: collectivite.id })
    ).toEqual([]);

    const plan = await caller.plans.plans.create({
      nom: 'Plan rattaché',
      collectiviteId: collectivite.id,
    });
    await caller.demarches.pcaet.update({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      planActionIds: [plan.id],
    });

    expect(
      await caller.demarches.listPlanLinks({ collectiviteId: collectivite.id })
    ).toEqual([
      {
        demarcheId: demarche.id,
        type: 'pcaet',
        titre: demarche.titre,
        status: 'en_elaboration',
        planActionId: plan.id,
      },
    ]);

    // Une démarche tenant plusieurs plans apparaît une fois par plan.
    const autrePlan = await caller.plans.plans.create({
      nom: 'Second plan rattaché',
      collectiviteId: collectivite.id,
    });
    await caller.demarches.pcaet.update({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      planActionIds: [plan.id, autrePlan.id],
    });
    expect(
      await caller.demarches.listPlanLinks({ collectiviteId: collectivite.id })
    ).toEqual(
      [plan.id, autrePlan.id].map((planActionId) => ({
        demarcheId: demarche.id,
        type: 'pcaet',
        titre: demarche.titre,
        status: 'en_elaboration',
        planActionId,
      }))
    );
    await caller.demarches.pcaet.update({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      planActionIds: [plan.id],
    });

    // Une démarche adoptée garde son lien : c'est ce que le bandeau du plan
    // continue d'afficher. L'exclusivité (elle) ignore les démarches
    // inactives — c'est un filtre propre au consommateur, pas à cette liste.
    await db.db
      .update(demarcheTable)
      .set({ status: 'adopte' })
      .where(eq(demarcheTable.id, demarche.id));
    expect(
      await caller.demarches.listPlanLinks({ collectiviteId: collectivite.id })
    ).toEqual([
      {
        demarcheId: demarche.id,
        type: 'pcaet',
        titre: demarche.titre,
        status: 'adopte',
        planActionId: plan.id,
      },
    ]);
  });

  test('Refuser un utilisateur sans droits sur la collectivité', async () => {
    const { collectivite } = await freshEditor();
    const stranger = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const strangerCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(stranger.user),
    });

    await expect(
      strangerCaller.demarches.listPlanLinks({
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow();
  });
});
