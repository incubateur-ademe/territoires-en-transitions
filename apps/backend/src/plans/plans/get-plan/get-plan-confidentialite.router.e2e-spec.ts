import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { AggregatedBudget } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { beforeAll, describe, expect, it } from 'vitest';

type PlanTotals = {
  totalFiches: number | undefined;
  investissementReel: AggregatedBudget | undefined;
};

describe('les totaux du plan et la confidentialité des fiches', () => {
  let router: TrpcRouter;
  let planId: number;
  let lectureMember: AuthenticatedUser;
  let verifiedVisitor: AuthenticatedUser;

  beforeAll(async () => {
    const app: INestApplication = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    const { collectivite } = await addTestCollectivite(db);
    const collectiviteId = collectivite.id;

    const { user: admin } = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.ADMIN,
    });
    const adminCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(admin),
    });

    const { user: member } = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    lectureMember = getAuthUserFromUserCredentials(member);

    const { user: visitor } = await addTestUser(db, {
      collectiviteId: null,
      role: CollectiviteRole.LECTURE,
    });
    verifiedVisitor = getAuthUserFromUserCredentials(visitor);

    const plan = await adminCaller.plans.plans.create({
      nom: 'Plan avec une fiche restreinte',
      collectiviteId,
    });
    planId = plan.id;

    const axe = await adminCaller.plans.axes.create({
      nom: 'Axe avec une fiche restreinte',
      collectiviteId,
      planId,
      parent: planId,
    });

    const createFicheInAxe = async (
      titre: string,
      restreint: boolean | null
    ): Promise<number> => {
      const fiche = await adminCaller.plans.fiches.create({
        fiche: { collectiviteId, titre, restreint },
        ficheFields: { axes: [{ id: axe.id }] },
      });
      return fiche.id;
    };

    const ficheRestreintTrueId = await createFicheInAxe(
      'Fiche restreinte',
      true
    );
    const ficheRestreintFalseId = await createFicheInAxe(
      'Fiche ouverte',
      false
    );
    await createFicheInAxe('Fiche sans confidentialité renseignée', null);

    await adminCaller.plans.fiches.budgets.upsert([
      {
        ficheId: ficheRestreintTrueId,
        type: 'investissement',
        unite: 'HT',
        budgetReel: 1000,
      },
    ]);
    await adminCaller.plans.fiches.budgets.upsert([
      {
        ficheId: ficheRestreintFalseId,
        type: 'investissement',
        unite: 'HT',
        budgetReel: 200,
      },
    ]);

    return async () => {
      await app.close();
    };
  });

  const getPlanTotalsAs = async (
    user: AuthenticatedUser
  ): Promise<PlanTotals> => {
    const plan = await router
      .createCaller({ user })
      .plans.plans.get({ planId });
    return {
      totalFiches: plan.totalFiches,
      investissementReel: plan.budget?.investissement.HT.budgetReel,
    };
  };

  it('ne compte pour le visiteur vérifié non membre ni la fiche restreinte ni son budget', async () => {
    expect(await getPlanTotalsAs(verifiedVisitor)).toEqual({
      totalFiches: 2,
      investissementReel: { total: 200, nbFiches: 1 },
    });
  });

  it('compte toutes les fiches du plan et leurs budgets pour le membre en lecture', async () => {
    expect(await getPlanTotalsAs(lectureMember)).toEqual({
      totalFiches: 3,
      investissementReel: { total: 1200, nbFiches: 2 },
    });
  });
});
