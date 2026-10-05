import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
  PCAET_PLAN_TYPE_KEY,
} from '@tet/domain/demarches';
import { OrigineSecteurs, SecteurReglementaire } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, ne } from 'drizzle-orm';
import { vi } from 'vitest';
import { axeTable } from '../shared/models/axe.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { planActionTypeTable } from '../shared/models/plan-action-type.table';
import { CommunsSecteursApiService } from './communs-secteurs-api.service';
import { FakeCommunsSecteursApiService } from './communs-secteurs-api.test-fixture';
import { ficheActionSecteurAttributionTable } from './fiche-action-secteur-attribution.table';

describe('Comptes des secteurs des fiches d’un plan', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  const communs = new FakeCommunsSecteursApiService();

  let lecteur: AuthenticatedUser;
  let sansAcces: AuthenticatedUser;
  let collectiviteId: number;
  let autreCollectiviteId: number;
  let pcaetTypeId: number;
  let autreTypeId: number;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(CommunsSecteursApiService)
          .useValue(communs);
      },
    });
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite, users } = await addTestCollectiviteAndUsers(db, {
      users: [{ role: CollectiviteRole.LECTURE }],
      collectivite: { accesRestreint: true },
    });
    collectiviteId = collectivite.id;
    lecteur = getAuthUserFromUserCredentials(users[0]);

    const autre = await addTestCollectiviteAndUsers(db, {
      users: [{ role: CollectiviteRole.EDITION }],
    });
    autreCollectiviteId = autre.collectivite.id;
    sansAcces = getAuthUserFromUserCredentials(autre.users[0]);

    const [pcaetType] = await db.db
      .select({ id: planActionTypeTable.id })
      .from(planActionTypeTable)
      .where(
        and(
          eq(planActionTypeTable.categorie, PCAET_PLAN_TYPE_KEY.categorie),
          eq(planActionTypeTable.type, PCAET_PLAN_TYPE_KEY.type)
        )
      );
    pcaetTypeId = pcaetType.id;
    const [autreType] = await db.db
      .select({ id: planActionTypeTable.id })
      .from(planActionTypeTable)
      .where(ne(planActionTypeTable.id, pcaetTypeId))
      .limit(1);
    autreTypeId = autreType.id;

    return async () => {
      await app.close();
    };
  });

  const createPlan = async (typeId: number | null) => {
    const [plan] = await db.db
      .insert(axeTable)
      .values({ nom: 'Plan secteurs', collectiviteId, typeId })
      .returning({ id: axeTable.id });
    return plan.id;
  };

  const createAxe = async (planId: number, parentId = planId) => {
    const [axe] = await db.db
      .insert(axeTable)
      .values({ nom: 'Axe', collectiviteId, plan: planId, parent: parentId })
      .returning({ id: axeTable.id });
    return axe.id;
  };

  const createFiche = async (
    values: { titre?: string | null; parentId?: number; deleted?: boolean } = {}
  ) => {
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({ titre: 'Fiche secteurs', collectiviteId, ...values })
      .returning({ id: ficheActionTable.id });
    return fiche.id;
  };

  const rangeFiche = (ficheId: number, axeId: number) =>
    db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId, axeId, createdBy: lecteur.id });

  const attribue = (
    ficheId: number,
    origine: OrigineSecteurs,
    secteurs: SecteurReglementaire[] = []
  ) =>
    db.db
      .insert(ficheActionSecteurAttributionTable)
      .values({ ficheId, origine, secteurs });

  const lieADemarchePcaet = async (planId: number) => {
    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: DemarcheTypeEnum.PCAET,
        titre: 'PCAET',
        status: DemarchePcaetStatusEnum.EN_ELABORATION,
      })
      .returning({ id: demarcheTable.id });
    await db.db
      .insert(demarchePlanActionTable)
      .values({ demarcheId: demarche.id, planActionId: planId });
  };

  const listCounts = (planIds: number[], user = lecteur) =>
    router
      .createCaller({ user })
      .plans.fiches.listPlanSecteursCounts({ collectiviteId, planIds });

  const createPlanAvecUneFicheEnCours = async (typeId: number | null) => {
    const planId = await createPlan(typeId);
    await rangeFiche(await createFiche(), planId);
    return planId;
  };

  test('compte les fiches du plan et de ses sous-axes : non attribuables, en cours de calcul, à renseigner', async () => {
    const planId = await createPlan(pcaetTypeId);
    const axeId = await createAxe(planId);
    const sousAxeId = await createAxe(planId, axeId);

    const sansAttribution = await createFiche();
    const sansTitre = await createFiche({ titre: null });
    const automatiqueVide = await createFiche();
    const manuelleVide = await createFiche();
    const indisponible = await createFiche();
    const attribuee = await createFiche();
    const supprimee = await createFiche({ deleted: true });

    await rangeFiche(sansAttribution, planId);
    await rangeFiche(sansTitre, axeId);
    await rangeFiche(automatiqueVide, sousAxeId);
    await rangeFiche(manuelleVide, axeId);
    await rangeFiche(indisponible, sousAxeId);
    await rangeFiche(attribuee, axeId);
    await rangeFiche(supprimee, axeId);

    await attribue(automatiqueVide, 'automatique');
    await attribue(manuelleVide, 'manuelle');
    await attribue(indisponible, 'indisponible');
    await attribue(attribuee, 'automatique', ['dechets']);

    expect(await listCounts([planId])).toEqual([
      { planId, enCoursDeCalcul: 2, aRenseigner: 1, nonAttribuables: 2 },
    ]);
  });

  test('une fiche rangée dans plusieurs axes du même plan n’est comptée qu’une fois', async () => {
    const planId = await createPlan(pcaetTypeId);
    const axeA = await createAxe(planId);
    const axeB = await createAxe(planId);
    const enCours = await createFiche();
    const indisponible = await createFiche();
    for (const axeId of [planId, axeA, axeB]) {
      await rangeFiche(enCours, axeId);
      await rangeFiche(indisponible, axeId);
    }
    await attribue(indisponible, 'indisponible');

    expect(await listCounts([planId])).toEqual([
      { planId, enCoursDeCalcul: 1, aRenseigner: 1, nonAttribuables: 0 },
    ]);
  });

  test('compte les sous-actions des fiches du plan, pas celles supprimées ni celles d’une fiche supprimée', async () => {
    const planId = await createPlan(pcaetTypeId);
    const axeId = await createAxe(planId);
    const parente = await createFiche();
    const parenteSupprimee = await createFiche({ deleted: true });
    await rangeFiche(parente, axeId);
    await rangeFiche(parenteSupprimee, axeId);
    await attribue(parente, 'automatique', ['agriculture']);

    const sousActionEnCours = await createFiche({ parentId: parente });
    const sousActionNonAttribuable = await createFiche({ parentId: parente });
    await createFiche({ parentId: parente, deleted: true });
    await createFiche({ parentId: parenteSupprimee });
    await attribue(sousActionNonAttribuable, 'automatique');

    expect(sousActionEnCours).toBeGreaterThan(0);
    expect(await listCounts([planId])).toEqual([
      { planId, enCoursDeCalcul: 1, aRenseigner: 0, nonAttribuables: 1 },
    ]);
  });

  test('renvoie les comptes d’un plan PCAET non lié et d’un plan lié à une démarche PCAET d’un autre type, pas d’un plan hors PCAET', async () => {
    const planPcaetNonLie = await createPlanAvecUneFicheEnCours(pcaetTypeId);
    const planLieAutreType = await createPlanAvecUneFicheEnCours(autreTypeId);
    await lieADemarchePcaet(planLieAutreType);
    const planHorsPcaet = await createPlanAvecUneFicheEnCours(autreTypeId);
    const planSansType = await createPlanAvecUneFicheEnCours(null);

    const counts = await listCounts([
      planPcaetNonLie,
      planLieAutreType,
      planHorsPcaet,
      planSansType,
    ]);

    expect(counts).toHaveLength(2);
    expect(counts).toEqual(
      expect.arrayContaining([
        {
          planId: planPcaetNonLie,
          enCoursDeCalcul: 1,
          aRenseigner: 0,
          nonAttribuables: 0,
        },
        {
          planId: planLieAutreType,
          enCoursDeCalcul: 1,
          aRenseigner: 0,
          nonAttribuables: 0,
        },
      ])
    );
  });

  test('un plan concerné sans rien à signaler renvoie des comptes nuls', async () => {
    const planVide = await createPlan(pcaetTypeId);
    const planAJour = await createPlan(pcaetTypeId);
    const fiche = await createFiche();
    await rangeFiche(fiche, planAJour);
    await attribue(fiche, 'manuelle', ['tertiaire']);

    expect(await listCounts([planVide, planAJour])).toEqual(
      expect.arrayContaining([
        {
          planId: planVide,
          enCoursDeCalcul: 0,
          aRenseigner: 0,
          nonAttribuables: 0,
        },
        {
          planId: planAJour,
          enCoursDeCalcul: 0,
          aRenseigner: 0,
          nonAttribuables: 0,
        },
      ])
    );
  });

  test('un même plan a les mêmes comptes, demandé seul (page du plan) ou avec d’autres (étape 3)', async () => {
    const planId = await createPlan(pcaetTypeId);
    const autrePlanId = await createPlanAvecUneFicheEnCours(pcaetTypeId);
    const partagee = await createFiche();
    await rangeFiche(partagee, planId);
    await rangeFiche(partagee, autrePlanId);
    await attribue(partagee, 'indisponible');
    await rangeFiche(await createFiche(), planId);

    const [seul] = await listCounts([planId]);
    const ensemble = await listCounts([planId, autrePlanId]);

    expect(seul).toEqual({
      planId,
      enCoursDeCalcul: 1,
      aRenseigner: 1,
      nonAttribuables: 0,
    });
    expect(ensemble.find((counts) => counts.planId === planId)).toEqual(seul);
  });

  test('n’appelle jamais Communs', async () => {
    const getSecteurs = vi.spyOn(communs, 'getSecteurs');
    const getAction = vi.spyOn(communs, 'getAction');
    const planId = await createPlanAvecUneFicheEnCours(pcaetTypeId);

    await listCounts([planId]);

    expect(getSecteurs).not.toHaveBeenCalled();
    expect(getAction).not.toHaveBeenCalled();
    getSecteurs.mockRestore();
    getAction.mockRestore();
  });

  test('ignore le plan d’une autre collectivité et refuse un utilisateur sans accès à la collectivité', async () => {
    const planId = await createPlanAvecUneFicheEnCours(pcaetTypeId);
    const [planAutreCollectivite] = await db.db
      .insert(axeTable)
      .values({
        nom: 'Plan',
        collectiviteId: autreCollectiviteId,
        typeId: pcaetTypeId,
      })
      .returning({ id: axeTable.id });

    expect(await listCounts([planId, planAutreCollectivite.id])).toEqual([
      { planId, enCoursDeCalcul: 1, aRenseigner: 0, nonAttribuables: 0 },
    ]);
    await expect(listCounts([planId], sansAcces)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
