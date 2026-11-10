import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
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
import { subMonths, subYears } from 'date-fns';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Suivi du plan : faire avancer le plan', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let admin: AuthenticatedUser;
  let visiteur: AuthenticatedUser;
  let collectiviteId: number;
  let planId: number;
  let thematiqueId: number;
  const fiches: Record<string, number> = {};

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = collectivite.id;
    admin = getAuthUserFromUserCredentials(user);
    const caller = router.createCaller({ user: admin });

    const { user: visiteurUser } = await addTestUser(db, {
      collectiviteId: null,
      role: CollectiviteRole.LECTURE,
    });
    visiteur = getAuthUserFromUserCredentials(visiteurUser);

    const [thematique] = await caller.shared.thematiques.list();
    thematiqueId = thematique.id;

    const plan = await caller.plans.plans.create({
      nom: 'Plan à faire avancer',
      collectiviteId,
    });
    planId = plan.id;

    const createFiche = async ({
      statut,
      jauge = 0,
      modifiedAt = new Date(),
      avecPilote = true,
      avecThematique = false,
      restreint = false,
      parentId,
    }: {
      statut: Statut | null;
      jauge?: number;
      modifiedAt?: Date;
      avecPilote?: boolean;
      avecThematique?: boolean;
      restreint?: boolean;
      parentId?: number;
    }) => {
      const { id } = await caller.plans.fiches.create({
        fiche: { titre: 'Action', collectiviteId, parentId, restreint },
        ficheFields: {
          axes: parentId ? [] : [{ id: planId }],
          pilotes: avecPilote ? [{ userId: admin.id }] : [],
          thematiques: avecThematique ? [{ id: thematiqueId }] : [],
        },
      });
      await db.db
        .update(ficheActionTable)
        .set({ statut, jauge, modifiedAt: modifiedAt.toISOString() })
        .where(eq(ficheActionTable.id, id));
      return id;
    };

    const ilYADeuxAns = subYears(new Date(), 2);

    fiches.enCoursSansAvancement = await createFiche({
      statut: StatutEnum.EN_COURS,
      avecPilote: false,
      avecThematique: true,
    });
    fiches.enCoursAvance = await createFiche({
      statut: StatutEnum.EN_COURS,
      jauge: 40,
    });
    fiches.enCoursSansAvancementRestreinte = await createFiche({
      statut: StatutEnum.EN_COURS,
      restreint: true,
    });
    fiches.enRetardAncienne = await createFiche({
      statut: StatutEnum.EN_RETARD,
      jauge: 30,
      modifiedAt: ilYADeuxAns,
      avecThematique: true,
    });
    fiches.bloqueeAncienne = await createFiche({
      statut: StatutEnum.BLOQUE,
      jauge: 30,
      modifiedAt: ilYADeuxAns,
      avecPilote: false,
    });
    fiches.realiseeAncienne = await createFiche({
      statut: StatutEnum.REALISE,
      jauge: 100,
      modifiedAt: ilYADeuxAns,
    });
    fiches.sansStatutAncienne = await createFiche({
      statut: null,
      modifiedAt: ilYADeuxAns,
    });
    fiches.aDiscuterRecente = await createFiche({
      statut: StatutEnum.A_DISCUTER,
      jauge: 10,
      modifiedAt: subMonths(new Date(), 11),
    });
    fiches.sousAction = await createFiche({
      statut: StatutEnum.EN_COURS,
      avecPilote: false,
      modifiedAt: ilYADeuxAns,
      parentId: fiches.enCoursAvance,
    });

    return async () => {
      await app.close();
    };
  });

  const getFaireAvancerLePlan = (
    user: AuthenticatedUser,
    thematiqueIds?: number[]
  ) =>
    router
      .createCaller({ user })
      .plans.suivi.getFaireAvancerLePlan({ planId, thematiqueIds });

  it('compte les quatre listes d’actions à faire avancer, sous-actions exclues', async () => {
    expect(await getFaireAvancerLePlan(admin)).toEqual({
      enCoursSansAvancement: 2,
      nonModifieesDepuisPlusDUnAn: 2,
      aDecider: 3,
      sansPilote: 2,
    });
  });

  it('ne retient que les fiches portant une des thématiques choisies', async () => {
    expect(await getFaireAvancerLePlan(admin, [thematiqueId])).toEqual({
      enCoursSansAvancement: 1,
      nonModifieesDepuisPlusDUnAn: 1,
      aDecider: 1,
      sansPilote: 1,
    });
  });

  it('exclut la fiche restreinte pour qui ne peut pas la voir', async () => {
    const { enCoursSansAvancement } = await getFaireAvancerLePlan(visiteur);

    expect(enCoursSansAvancement).toBe(1);
  });

  const listFicheIds = async (filters: {
    enCoursSansAvancement?: boolean;
    notModifiedForOverAYear?: boolean;
  }) => {
    const { data } = await router
      .createCaller({ user: admin })
      .plans.fiches.listFiches({
        collectiviteId,
        filters: { planActionIds: [planId], ...filters },
      });
    return data.map((fiche) => fiche.id).sort();
  };

  it('filtre les fiches En cours à jauge 0 %', async () => {
    expect(await listFicheIds({ enCoursSansAvancement: true })).toEqual(
      [
        fiches.enCoursSansAvancement,
        fiches.enCoursSansAvancementRestreinte,
      ].sort()
    );
  });

  it('filtre les fiches non modifiées depuis plus d’un an, quel que soit leur statut', async () => {
    expect(await listFicheIds({ notModifiedForOverAYear: true })).toEqual(
      [
        fiches.enRetardAncienne,
        fiches.bloqueeAncienne,
        fiches.realiseeAncienne,
        fiches.sansStatutAncienne,
      ].sort()
    );
  });
});
