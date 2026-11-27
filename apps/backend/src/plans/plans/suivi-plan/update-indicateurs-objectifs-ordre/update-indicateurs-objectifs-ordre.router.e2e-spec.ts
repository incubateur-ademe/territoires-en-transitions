import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createIndicateurPerso } from '@tet/backend/indicateurs/indicateurs/indicateur-perso.test-fixture';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Suivi du plan : ordre des indicateurs et objectifs', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectiviteId: number;
  let admin: ReturnType<typeof getAuthUserFromUserCredentials>;
  let lecteur: ReturnType<typeof getAuthUserFromUserCredentials>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = collectivite.id;
    admin = getAuthUserFromUserCredentials(user);

    const { user: lecteurUser } = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    lecteur = getAuthUserFromUserCredentials(lecteurUser);

    return async () => {
      await app.close();
    };
  });

  // les indicateurs se créent dans le test : leur nettoyage exige un test en cours
  const creerPlanAvecIndicateurs = async () => {
    const caller = router.createCaller({ user: admin });
    const plan = await caller.plans.plans.create({
      nom: 'Plan ordre indicateurs',
      collectiviteId,
    });
    const axe = await caller.plans.axes.create({
      nom: 'Axe',
      collectiviteId,
      planId: plan.id,
      parent: plan.id,
    });
    const indicateurIds = [
      await createIndicateurPerso({
        caller,
        indicateurData: { collectiviteId, titre: 'Air', unite: 'µg' },
      }),
      await createIndicateurPerso({
        caller,
        indicateurData: { collectiviteId, titre: 'Bruit', unite: 'dB' },
      }),
      await createIndicateurPerso({
        caller,
        indicateurData: { collectiviteId, titre: 'Climat', unite: 'tCO2e' },
      }),
    ];
    await db.db.insert(axeIndicateurTable).values(
      indicateurIds.map((indicateurId) => ({
        axeId: axe.id,
        indicateurId,
        createdBy: admin.id,
      }))
    );
    return { planId: plan.id, indicateurIds };
  };

  const listerOrdre = async (planId: number) =>
    (
      await router
        .createCaller({ user: admin })
        .plans.suivi.getIndicateursObjectifs({ planId })
    ).map(({ id }) => id);

  it('applique l’ordre choisi à la liste, sans doublon', async () => {
    const { planId, indicateurIds } = await creerPlanAvecIndicateurs();
    const [air, bruit, climat] = indicateurIds;

    await router
      .createCaller({ user: admin })
      .plans.suivi.updateIndicateursObjectifsOrdre({
        planId,
        indicateurIds: [climat, air, climat, bruit],
      });

    expect(await listerOrdre(planId)).toEqual([climat, air, bruit]);
  });

  it('refuse le changement d’ordre à qui ne peut pas modifier le plan', async () => {
    const { planId, indicateurIds } = await creerPlanAvecIndicateurs();

    await expect(
      router
        .createCaller({ user: lecteur })
        .plans.suivi.updateIndicateursObjectifsOrdre({
          planId,
          indicateurIds: [indicateurIds[2]],
        })
    ).rejects.toThrow();
    expect(await listerOrdre(planId)).toEqual(indicateurIds);
  });
});
