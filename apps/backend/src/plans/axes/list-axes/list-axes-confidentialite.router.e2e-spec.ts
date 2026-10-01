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
import { CollectiviteRole } from '@tet/domain/users';
import { beforeAll, describe, expect, it } from 'vitest';

describe('les fiches des axes et la confidentialité', () => {
  let router: TrpcRouter;
  let collectiviteId: number;
  let planId: number;
  let axeId: number;
  let ficheRestreintTrueId: number;
  let ficheRestreintFalseId: number;
  let ficheRestreintNullId: number;
  let lectureMember: AuthenticatedUser;
  let verifiedVisitor: AuthenticatedUser;

  beforeAll(async () => {
    const app: INestApplication = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    const { collectivite } = await addTestCollectivite(db);
    collectiviteId = collectivite.id;

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
    axeId = axe.id;

    const createFicheInAxe = async (
      titre: string,
      restreint: boolean | null
    ): Promise<number> => {
      const fiche = await adminCaller.plans.fiches.create({
        fiche: { collectiviteId, titre, restreint },
        ficheFields: { axes: [{ id: axeId }] },
      });
      return fiche.id;
    };

    ficheRestreintTrueId = await createFicheInAxe('Fiche restreinte', true);
    ficheRestreintFalseId = await createFicheInAxe('Fiche ouverte', false);
    ficheRestreintNullId = await createFicheInAxe(
      'Fiche sans confidentialité renseignée',
      null
    );

    return async () => {
      await app.close();
    };
  });

  const listAxeFicheIdsAs = async (
    user: AuthenticatedUser
  ): Promise<Set<number>> => {
    const axes = await router
      .createCaller({ user })
      .plans.axes.listRecursively({ collectiviteId, parentId: planId });
    return new Set(axes.find((axe) => axe.id === axeId)?.fiches);
  };

  it("ne rend au visiteur vérifié non membre que les fiches non restreintes de l'axe", async () => {
    expect(await listAxeFicheIdsAs(verifiedVisitor)).toEqual(
      new Set([ficheRestreintFalseId, ficheRestreintNullId])
    );
  });

  it("rend toutes les fiches de l'axe au membre en lecture", async () => {
    expect(await listAxeFicheIdsAs(lectureMember)).toEqual(
      new Set([
        ficheRestreintTrueId,
        ficheRestreintFalseId,
        ficheRestreintNullId,
      ])
    );
  });

  it('ne rend pas la fiche restreinte dans les axes du plan lu par le visiteur vérifié', async () => {
    const plan = await router
      .createCaller({ user: verifiedVisitor })
      .plans.plans.get({ planId });
    expect(new Set(plan.axes.find((axe) => axe.id === axeId)?.fiches)).toEqual(
      new Set([ficheRestreintFalseId, ficheRestreintNullId])
    );
  });
});
