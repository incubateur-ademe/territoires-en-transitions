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
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
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

describe('Fiches d’un plan dont les secteurs sont à vérifier', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  const communs = new FakeCommunsSecteursApiService();

  let membre: AuthenticatedUser;
  let visiteur: AuthenticatedUser;
  let collectiviteId: number;
  let collectivitePriveeId: number;
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
    });
    collectiviteId = collectivite.id;
    membre = getAuthUserFromUserCredentials(users[0]);

    const { user: visitor } = await addTestUser(db, {
      collectiviteId: null,
      role: CollectiviteRole.LECTURE,
    });
    visiteur = getAuthUserFromUserCredentials(visitor);

    const privee = await addTestCollectiviteAndUsers(db, {
      users: [{ role: CollectiviteRole.EDITION }],
      collectivite: { accesRestreint: true },
    });
    collectivitePriveeId = privee.collectivite.id;

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

  const createPlan = async (
    typeId: number | null,
    planCollectiviteId = collectiviteId
  ) => {
    const [plan] = await db.db
      .insert(axeTable)
      .values({
        nom: 'Plan secteurs',
        collectiviteId: planCollectiviteId,
        typeId,
      })
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
    values: {
      titre?: string | null;
      parentId?: number;
      deleted?: boolean;
      restreint?: boolean | null;
    } = {}
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
      .values({ ficheId, axeId, createdBy: membre.id });

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

  const listFiches = (
    planId: number,
    user = membre,
    planCollectiviteId = collectiviteId
  ) =>
    router.createCaller({ user }).plans.fiches.listPlanFichesSecteursAVerifier({
      collectiviteId: planCollectiviteId,
      planId,
    });

  test('liste les fiches du plan, de ses axes et leurs sous-actions avec leur état, sans les fiches attribuées ni supprimées', async () => {
    const planId = await createPlan(pcaetTypeId);
    const axeId = await createAxe(planId);
    const sousAxeId = await createAxe(planId, axeId);

    const enCours = await createFiche({ titre: 'En cours' });
    const sansTitre = await createFiche({ titre: null });
    const automatiqueVide = await createFiche({ titre: 'Automatique vide' });
    const manuelleVide = await createFiche({ titre: 'Manuelle vide' });
    const indisponible = await createFiche({ titre: 'Indisponible' });
    const attribuee = await createFiche({ titre: 'Attribuée' });
    const supprimee = await createFiche({ deleted: true });
    const sousAction = await createFiche({
      titre: 'Sous-action',
      parentId: attribuee,
    });
    await createFiche({ parentId: attribuee, deleted: true });

    await rangeFiche(enCours, planId);
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

    expect(await listFiches(planId)).toEqual([
      {
        ficheId: enCours,
        titre: 'En cours',
        parentId: null,
        parentTitre: null,
        etat: 'en_cours_de_calcul',
      },
      {
        ficheId: sansTitre,
        titre: null,
        parentId: null,
        parentTitre: null,
        etat: 'en_cours_de_calcul',
      },
      {
        ficheId: automatiqueVide,
        titre: 'Automatique vide',
        parentId: null,
        parentTitre: null,
        etat: 'non_attribuable',
      },
      {
        ficheId: manuelleVide,
        titre: 'Manuelle vide',
        parentId: null,
        parentTitre: null,
        etat: 'non_attribuable',
      },
      {
        ficheId: indisponible,
        titre: 'Indisponible',
        parentId: null,
        parentTitre: null,
        etat: 'a_renseigner',
      },
      {
        ficheId: sousAction,
        titre: 'Sous-action',
        parentId: attribuee,
        parentTitre: 'Attribuée',
        etat: 'en_cours_de_calcul',
      },
    ]);
  });

  test('une fiche rangée dans plusieurs axes du même plan n’apparaît qu’une fois', async () => {
    const planId = await createPlan(pcaetTypeId);
    const axeA = await createAxe(planId);
    const axeB = await createAxe(planId);
    const enCours = await createFiche();
    for (const axeId of [planId, axeA, axeB]) {
      await rangeFiche(enCours, axeId);
    }

    expect(await listFiches(planId)).toEqual([
      expect.objectContaining({ ficheId: enCours }),
    ]);
  });

  test('une sous-action rangée aussi dans un axe du plan n’apparaît qu’une fois, avec le titre de sa parente', async () => {
    const planId = await createPlan(pcaetTypeId);
    const axeId = await createAxe(planId);
    const parente = await createFiche({ titre: 'Parente' });
    await rangeFiche(parente, axeId);
    await attribue(parente, 'automatique', ['dechets']);
    const sousAction = await createFiche({
      titre: 'Sous-action rangée',
      parentId: parente,
    });
    await rangeFiche(sousAction, axeId);

    expect(await listFiches(planId)).toEqual([
      {
        ficheId: sousAction,
        titre: 'Sous-action rangée',
        parentId: parente,
        parentTitre: 'Parente',
        etat: 'en_cours_de_calcul',
      },
    ]);
  });

  test('liste les fiches d’un plan lié à une démarche PCAET d’un autre type, rien pour un plan hors PCAET', async () => {
    const planLie = await createPlan(autreTypeId);
    await lieADemarchePcaet(planLie);
    const ficheLiee = await createFiche();
    await rangeFiche(ficheLiee, planLie);
    const planHorsPcaet = await createPlan(autreTypeId);
    await rangeFiche(await createFiche(), planHorsPcaet);

    expect(await listFiches(planLie)).toEqual([
      expect.objectContaining({ ficheId: ficheLiee }),
    ]);
    expect(await listFiches(planHorsPcaet)).toEqual([]);
  });

  test('cache les fiches restreintes et leurs sous-actions à qui ne peut pas les lire', async () => {
    const planId = await createPlan(pcaetTypeId);
    const ouverte = await createFiche({ restreint: false });
    const sansConfidentialite = await createFiche({ restreint: null });
    const restreinte = await createFiche({ restreint: true });
    const sousActionDeRestreinte = await createFiche({ parentId: restreinte });
    for (const ficheId of [ouverte, sansConfidentialite, restreinte]) {
      await rangeFiche(ficheId, planId);
    }

    const ficheIds = async (user: AuthenticatedUser) =>
      (await listFiches(planId, user)).map(({ ficheId }) => ficheId);

    expect(await ficheIds(membre)).toEqual([
      ouverte,
      sansConfidentialite,
      restreinte,
      sousActionDeRestreinte,
    ]);
    expect(await ficheIds(visiteur)).toEqual([ouverte, sansConfidentialite]);
  });

  test('n’appelle jamais Communs', async () => {
    const getSecteurs = vi.spyOn(communs, 'getSecteurs');
    const getAction = vi.spyOn(communs, 'getAction');
    const planId = await createPlan(pcaetTypeId);
    await rangeFiche(await createFiche(), planId);

    await listFiches(planId);

    expect(getSecteurs).not.toHaveBeenCalled();
    expect(getAction).not.toHaveBeenCalled();
    getSecteurs.mockRestore();
    getAction.mockRestore();
  });

  test('refuse un non-membre sur une collectivité à accès restreint', async () => {
    const planId = await createPlan(pcaetTypeId, collectivitePriveeId);

    await expect(
      listFiches(planId, membre, collectivitePriveeId)
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
