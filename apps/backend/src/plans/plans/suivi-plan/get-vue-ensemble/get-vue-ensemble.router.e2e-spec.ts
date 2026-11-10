import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Statut, StatutEnum } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Suivi du plan : vue d’ensemble', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let admin: AuthenticatedUser;
  let visiteur: AuthenticatedUser;
  let planId: number;
  let thematiqueTransport: number;

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

    const { user: visiteurUser } = await addTestUser(db, {
      collectiviteId: null,
      role: CollectiviteRole.LECTURE,
    });
    visiteur = getAuthUserFromUserCredentials(visiteurUser);

    const [thematiqueA, thematiqueB] = await caller.shared.thematiques.list();
    thematiqueTransport = thematiqueA.id;

    const plan = await caller.plans.plans.create({
      nom: 'Plan suivi',
      collectiviteId,
    });
    planId = plan.id;
    const createAxe = async (nom: string) =>
      (
        await caller.plans.axes.create({
          nom,
          collectiviteId,
          planId,
          parent: planId,
        })
      ).id;
    const axeA = await createAxe('Axe A');
    const axeB = await createAxe('Axe B');

    const createFiche = async ({
      axes = [],
      thematiques = [],
      statuts = [],
      jauge,
      parentId,
      restreint = false,
    }: {
      axes?: number[];
      thematiques?: number[];
      statuts?: Statut[];
      jauge?: number;
      parentId?: number;
      restreint?: boolean;
    }) => {
      const { id } = await caller.plans.fiches.create({
        fiche: { titre: 'Action', collectiviteId, parentId, restreint },
        ficheFields: {
          axes: axes.map((axeId) => ({ id: axeId })),
          thematiques: thematiques.map((thematiqueId) => ({
            id: thematiqueId,
          })),
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

    const ficheEnCours = await createFiche({
      axes: [axeA],
      thematiques: [thematiqueA.id],
      statuts: [StatutEnum.EN_COURS],
      jauge: 40,
    });
    await createFiche({
      axes: [axeA, axeB],
      thematiques: [thematiqueB.id],
      statuts: [StatutEnum.REALISE],
    });
    await createFiche({
      axes: [axeB],
      thematiques: [thematiqueA.id, thematiqueB.id],
      statuts: [StatutEnum.EN_COURS],
    });
    await createFiche({
      axes: [axeB],
      statuts: [StatutEnum.REALISE, StatutEnum.ABANDONNE],
    });
    await createFiche({ axes: [axeB], jauge: 20 });
    await createFiche({
      parentId: ficheEnCours,
      statuts: [StatutEnum.REALISE],
    });
    await createFiche({
      axes: [axeA],
      thematiques: [thematiqueA.id],
      statuts: [StatutEnum.EN_COURS],
      jauge: 80,
      restreint: true,
    });

    return async () => {
      await app.close();
    };
  });

  const getVueEnsemble = (user: AuthenticatedUser, thematiqueIds?: number[]) =>
    router
      .createCaller({ user })
      .plans.suivi.getVueEnsemble({ planId, thematiqueIds });

  const countOf = (
    repartition: { statut: Statut | null; count: number }[],
    statut: Statut | null
  ) => repartition.find((item) => item.statut === statut)?.count;

  it('calcule l’avancement par la moyenne des jauges des fiches parentes, Abandonné exclu, chaque fiche comptée une fois', async () => {
    const vue = await getVueEnsemble(admin);

    expect(vue.avancement).toBe(48);
    expect(vue.total).toBe(6);
    expect(vue.abandonnees).toBe(1);
    expect(vue.enCoursSansAvancement).toBe(1);
  });

  it('répartit les fiches par statut, Abandonné et sans statut compris', async () => {
    const { repartitionParStatut } = await getVueEnsemble(admin);

    expect(countOf(repartitionParStatut, StatutEnum.EN_COURS)).toBe(3);
    expect(countOf(repartitionParStatut, StatutEnum.REALISE)).toBe(1);
    expect(countOf(repartitionParStatut, StatutEnum.ABANDONNE)).toBe(1);
    expect(countOf(repartitionParStatut, null)).toBe(1);
    expect(countOf(repartitionParStatut, StatutEnum.A_VENIR)).toBe(0);
    expect(
      repartitionParStatut.reduce((total, { count }) => total + count, 0)
    ).toBe(6);
  });

  it('ne retient que les fiches portant au moins une des thématiques choisies', async () => {
    const vue = await getVueEnsemble(admin, [thematiqueTransport]);

    expect(vue.total).toBe(3);
    expect(vue.avancement).toBe(40);
    expect(vue.enCoursSansAvancement).toBe(1);
    expect(countOf(vue.repartitionParStatut, StatutEnum.EN_COURS)).toBe(3);
  });

  it('exclut la fiche restreinte pour qui ne peut pas la voir', async () => {
    const vue = await getVueEnsemble(visiteur);

    expect(vue.total).toBe(5);
    expect(vue.avancement).toBe(40);
    expect(countOf(vue.repartitionParStatut, StatutEnum.EN_COURS)).toBe(2);
  });

  it('refuse le suivi à qui ne peut pas lire le plan', async () => {
    const db = await getTestDatabase(app);
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { accesRestreint: true },
    });
    const planRestreint = await router
      .createCaller({ user: getAuthUserFromUserCredentials(user) })
      .plans.plans.create({
        nom: 'Plan privé',
        collectiviteId: collectivite.id,
      });
    const { collectivite: autreCollectivite } = await addTestCollectivite(db);
    const { user: autreUser } = await addTestUser(db, {
      collectiviteId: autreCollectivite.id,
      role: CollectiviteRole.ADMIN,
    });

    await expect(
      router
        .createCaller({ user: getAuthUserFromUserCredentials(autreUser) })
        .plans.suivi.getVueEnsemble({ planId: planRestreint.id })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
