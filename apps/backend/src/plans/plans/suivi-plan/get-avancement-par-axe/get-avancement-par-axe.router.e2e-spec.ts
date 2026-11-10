import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Statut, StatutEnum } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Suivi du plan : avancement par axe', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let admin: AuthenticatedUser;
  let planId: number;
  let thematiqueId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const collectiviteId = collectivite.id;
    admin = getAuthUserFromUserCredentials(user);
    const caller = router.createCaller({ user: admin });

    const [thematique] = await caller.shared.thematiques.list();
    thematiqueId = thematique.id;

    const plan = await caller.plans.plans.create({
      nom: 'Plan suivi',
      collectiviteId,
    });
    planId = plan.id;
    const createAxe = async (nom: string, parent: number) =>
      (
        await caller.plans.axes.create({
          nom,
          collectiviteId,
          planId,
          parent,
        })
      ).id;
    const axeA = await createAxe('Axe A', planId);
    const sousAxeA1 = await createAxe('Sous-axe A1', axeA);
    const sousAxeA2 = await createAxe('Sous-axe A2', axeA);
    const axeB = await createAxe('Axe B', planId);

    const createFiche = async ({
      axes,
      thematiques = [],
      statuts = [],
      jauge,
      parentId,
    }: {
      axes: number[];
      thematiques?: number[];
      statuts?: Statut[];
      jauge?: number;
      parentId?: number;
    }) => {
      const { id } = await caller.plans.fiches.create({
        fiche: { titre: 'Action', collectiviteId, parentId },
        ficheFields: {
          axes: axes.map((axeId) => ({ id: axeId })),
          thematiques: thematiques.map((id) => ({ id })),
        },
      });
      for (const statut of statuts) {
        await caller.plans.fiches.update({
          ficheId: id,
          ficheFields: { statut },
        });
      }
      if (jauge !== undefined) {
        await caller.plans.fiches.update({
          ficheId: id,
          ficheFields: { jauge },
        });
      }
      return id;
    };

    await createFiche({
      axes: [sousAxeA1, sousAxeA2],
      thematiques: [thematiqueId],
      statuts: [StatutEnum.REALISE],
    });
    const ficheEnCours = await createFiche({
      axes: [sousAxeA1],
      statuts: [StatutEnum.EN_COURS],
      jauge: 40,
    });
    await createFiche({ axes: [axeA, axeB], jauge: 20 });
    await createFiche({
      axes: [axeB],
      statuts: [StatutEnum.REALISE, StatutEnum.ABANDONNE],
    });
    await createFiche({
      axes: [sousAxeA2],
      parentId: ficheEnCours,
      statuts: [StatutEnum.REALISE],
    });

    return async () => {
      await app.close();
    };
  });

  const getAvancementParAxe = (thematiqueIds?: number[]) =>
    router
      .createCaller({ user: admin })
      .plans.suivi.getAvancementParAxe({ planId, thematiqueIds });

  it('compte les fiches des sous-axes dans l’axe, une seule fois même rangées dans deux de ses sous-axes', async () => {
    const [axeA] = await getAvancementParAxe();

    expect(axeA).toMatchObject({
      nom: 'Axe A',
      total: 3,
      realisees: 1,
      avancement: 53.3,
    });
  });

  it('donne l’avancement de chaque sous-axe, sous-actions ignorées', async () => {
    const [axeA] = await getAvancementParAxe();

    expect(axeA.sousAxes).toMatchObject([
      { nom: 'Sous-axe A1', total: 2, realisees: 1, avancement: 70 },
      { nom: 'Sous-axe A2', total: 1, realisees: 1, avancement: 100 },
    ]);
  });

  it('compte une fiche rangée dans deux axes dans chacun, Abandonné exclu de l’avancement', async () => {
    const [axeA, axeB] = await getAvancementParAxe();

    expect(axeA.total).toBe(3);
    expect(axeB).toMatchObject({
      nom: 'Axe B',
      total: 2,
      realisees: 0,
      avancement: 20,
      sousAxes: [],
    });
  });

  it('ne retient que les fiches portant une des thématiques choisies', async () => {
    const [axeA, axeB] = await getAvancementParAxe([thematiqueId]);

    expect(axeA).toMatchObject({ total: 1, realisees: 1, avancement: 100 });
    expect(axeA.sousAxes).toMatchObject([
      { total: 1, avancement: 100 },
      { total: 1, avancement: 100 },
    ]);
    expect(axeB).toMatchObject({ total: 0, realisees: 0, avancement: 0 });
  });
});
