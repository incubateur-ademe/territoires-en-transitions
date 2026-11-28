import { getTestApp, getTestDatabase, getTestRouter } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PrioriteEnum, StatutEnum } from '@tet/domain/plans';
import { createListFichesScenario } from './list-fiches.test-fixture';

/**
 * Tests de caractérisation (lot 1a) : ils figent le comportement des filtres
 * de listFiches quand les sous-actions sont incluses. Un changement de
 * résultat attendu doit être volontaire et signalé dans la PR (lot 2a :
 * rattachement des sous-actions au plan et aux axes de leur action parente).
 *
 * Chaque test crée ses fiches dans une collectivité neuve : les titres listés
 * sont exactement ceux du scénario.
 */
describe('listFiches et les sous-actions', () => {
  let router: TrpcRouter;
  let db: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  const createScenario = () => createListFichesScenario({ router, db });

  describe('filtres sur le plan et les axes', () => {
    // Lot 2a : une sous-action appartient au plan et aux axes de son action
    // parente ; ses propres lignes d'axe sont ignorées dès que les
    // sous-actions sont incluses (`withChildren` ou `onlyChildren`).

    test('planActionIds : une sous-action sans axe propre est dans le plan de son action parente', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const action = await s.createAction('Action du plan', { axes: [plan] });
      await s.createSousAction(action, 'Sous-action sans axe');

      expect(
        await s.listTitres({ planActionIds: [plan.id], withChildren: true })
      ).toEqual(['Action du plan', 'Sous-action sans axe']);
    });

    test('planActionIds : une sous-action suit le plan de son action parente, sous-axe compris, et son axe propre est ignoré', async () => {
      const s = await createScenario();
      const planA = await s.createPlan('Plan A');
      const sousAxe = await s.createAxe(
        'Sous-axe',
        await s.createAxe('Axe', planA)
      );
      const planB = await s.createPlan('Plan B');
      const action = await s.createAction('Action du sous-axe du plan A', {
        axes: [sousAxe],
      });
      await s.createSousAction(action, 'Sous-action avec un axe du plan B', {
        axes: [planB],
      });

      expect(
        await s.listTitres({ planActionIds: [planA.id], withChildren: true })
      ).toEqual([
        'Action du sous-axe du plan A',
        'Sous-action avec un axe du plan B',
      ]);
      expect(
        await s.listTitres({ planActionIds: [planB.id], withChildren: true })
      ).toEqual([]);
    });

    test('planActionIds sans sous-actions incluses : le filtre lit toujours les axes propres de la fiche', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const action = await s.createAction('Action sans axe');
      await s.createSousAction(action, 'Sous-action du plan', { axes: [plan] });

      expect(
        await s.listTitres({ planActionIds: [plan.id], parentsId: [action.id] })
      ).toEqual(['Sous-action du plan']);
    });

    test('axesId : un axe retient ses fiches directes et leurs sous-actions, pas les fiches de ses sous-axes', async () => {
      const s = await createScenario();
      const axe = await s.createAxe('Axe', await s.createPlan('Plan'));
      const sousAxe = await s.createAxe('Sous-axe', axe);
      const action = await s.createAction('Action de l’axe', { axes: [axe] });
      await s.createSousAction(action, 'Sous-action sans axe');
      await s.createAction('Action du sous-axe', { axes: [sousAxe] });

      expect(
        await s.listTitres({ axesId: [axe.id], withChildren: true })
      ).toEqual(['Action de l’axe', 'Sous-action sans axe']);
    });

    test('noPlan : une sous-action suit son action parente, avec ou sans plan', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const actionDuPlan = await s.createAction('Action du plan', {
        axes: [plan],
      });
      await s.createSousAction(actionDuPlan, 'Sous-action sans axe');
      const actionSansPlan = await s.createAction('Action sans plan');
      await s.createSousAction(actionSansPlan, 'Sous-action avec un axe', {
        axes: [plan],
      });

      expect(await s.listTitres({ noPlan: true, withChildren: true })).toEqual([
        'Action sans plan',
        'Sous-action avec un axe',
      ]);
    });

    test('doesBelongToSeveralPlans : la sous-action d’une action dans deux plans en hérite', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action dans deux plans', {
        axes: [await s.createPlan('Plan A'), await s.createPlan('Plan B')],
      });
      await s.createSousAction(action, 'Sous-action sans axe');

      expect(
        await s.listTitres({
          doesBelongToSeveralPlans: true,
          withChildren: true,
        })
      ).toEqual(['Action dans deux plans', 'Sous-action sans axe']);
    });

    test('doesBelongToSeveralPlans à false écarte les fiches sans axe', async () => {
      const s = await createScenario();
      await s.createAction('Action d’un seul plan', {
        axes: [await s.createPlan('Plan')],
      });
      await s.createAction('Action sans axe');

      expect(await s.listTitres({ doesBelongToSeveralPlans: false })).toEqual([
        'Action d’un seul plan',
      ]);
    });

    test('planActionIds et doesBelongToSeveralPlans se combinent en OU, pas en ET', async () => {
      const s = await createScenario();
      const planA = await s.createPlan('Plan A');
      const planB = await s.createPlan('Plan B');
      const planC = await s.createPlan('Plan C');
      await s.createAction('Action du plan A', { axes: [planA] });
      await s.createAction('Action du plan B', { axes: [planB] });
      // dans deux plans : seul planActionIds la retient
      await s.createAction('Action des plans B et C', {
        axes: [planB, planC],
      });

      expect(
        await s.listTitres({
          planActionIds: [planB.id],
          doesBelongToSeveralPlans: false,
        })
      ).toEqual([
        'Action des plans B et C',
        'Action du plan A',
        'Action du plan B',
      ]);
    });

    test('onlyChildren applique les filtres aux seules sous-actions, rattachées par leur action parente', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const action = await s.createAction('Action du plan', { axes: [plan] });
      await s.createSousAction(action, 'Sous-action sans axe');
      const actionSansPlan = await s.createAction('Action sans plan');
      await s.createSousAction(actionSansPlan, 'Sous-action avec un axe', {
        axes: [plan],
      });

      expect(
        await s.listTitres({ planActionIds: [plan.id], onlyChildren: true })
      ).toEqual(['Sous-action sans axe']);
    });
  });

  describe('filtres sur les pilotes', () => {
    test('personnePiloteIds : le pilote d’une sous-action ne fait pas remonter son action parente', async () => {
      const s = await createScenario();
      const pilote = await s.createPersonnePilote('Pilote');
      const action = await s.createAction('Action sans pilote');
      await s.createSousAction(action, 'Sous-action pilotée', {
        pilotes: [pilote],
      });

      const filters = { personnePiloteIds: [pilote.tagId] };
      expect(await s.listTitres(filters)).toEqual([]);
      expect(await s.listTitres({ ...filters, withChildren: true })).toEqual([
        'Sous-action pilotée',
      ]);
    });

    test('utilisateurPiloteIds : le pilote d’une sous-action ne fait pas remonter son action parente', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action sans pilote');
      await s.createSousAction(action, 'Sous-action pilotée', {
        pilotes: [s.adminPilote],
      });

      const filters = { utilisateurPiloteIds: [s.admin.id] };
      expect(await s.listTitres(filters)).toEqual([]);
      expect(await s.listTitres({ ...filters, withChildren: true })).toEqual([
        'Sous-action pilotée',
      ]);
    });

    test('noPilote : une sous-action ne reprend pas les pilotes de son action parente', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action pilotée', {
        pilotes: [s.adminPilote],
      });
      await s.createSousAction(action, 'Sous-action sans pilote');

      expect(
        await s.listTitres({ noPilote: true, withChildren: true })
      ).toEqual(['Sous-action sans pilote']);
    });
  });

  describe('action parente supprimée', () => {
    // 201 sous-actions sont dans ce cas en prod (24/11/2026) : la migration
    // des étapes en sous-actions (avril 2026) a aussi converti les étapes des
    // actions déjà supprimées. La suppression d'une action emporte ses
    // sous-actions, mais la création accepte encore un parent supprimé
    // (`getFicheFromId` ne filtre pas `deleted`) : on reproduit l'état par là.
    test('une sous-action créée sous une action déjà supprimée reste listée et lisible', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action supprimée');
      await s.deleteFiche(action);
      const sousAction = await s.createSousAction(action, 'Sous-action active');

      expect(await s.listTitres({ withChildren: true })).toEqual([
        'Sous-action active',
      ]);
      expect(await s.listTitres({ parentsId: [action.id] })).toEqual([
        'Sous-action active',
      ]);
      expect(await s.getFiche(sousAction)).toMatchObject({
        id: sousAction.id,
        parentId: action.id,
      });
    });

    test('une sous-action dont l’action parente est supprimée n’est dans aucun plan', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const action = await s.createAction('Action supprimée', { axes: [plan] });
      await s.deleteFiche(action);
      await s.createSousAction(action, 'Sous-action active', { axes: [plan] });

      expect(
        await s.listTitres({ planActionIds: [plan.id], withChildren: true })
      ).toEqual([]);
      expect(await s.listTitres({ noPlan: true, withChildren: true })).toEqual([
        'Sous-action active',
      ]);
    });
  });

  test('get rend une sous-action avec ses propres axes et plans', async () => {
    const s = await createScenario();
    const plan = await s.createPlan('Plan');
    const axe = await s.createAxe('Axe', plan);
    const action = await s.createAction('Action sans axe');
    const sousAction = await s.createSousAction(action, 'Sous-action', {
      axes: [axe],
    });

    expect(await s.getFiche(sousAction)).toMatchObject({
      parentId: action.id,
      axes: [expect.objectContaining({ id: axe.id })],
      plans: [expect.objectContaining({ id: plan.id })],
    });
  });

  test('pagination et tri par titre : les sous-actions sont comptées si elles sont incluses', async () => {
    const s = await createScenario();
    const action = await s.createAction('Action 2');
    await s.createAction('Action 10');
    await s.createSousAction(action, 'Sous-action 1');
    await s.createSousAction(action, 'Sous-action 2');

    const listPage = async (
      filters: { withChildren?: boolean; onlyChildren?: boolean },
      page: number
    ) => {
      const { count, nbOfPages, nextPage, data } = await s.listFiches(filters, {
        sort: [{ field: 'titre', direction: 'asc' }],
        page,
        limit: 2,
      });
      return { count, nbOfPages, nextPage, titres: data.map((f) => f.titre) };
    };

    // tri naturel : « Action 10 » vient après « Action 2 »
    expect(await listPage({ withChildren: true }, 1)).toEqual({
      count: 4,
      nbOfPages: 2,
      nextPage: 2,
      titres: ['Action 2', 'Action 10'],
    });
    expect(await listPage({ withChildren: true }, 2)).toEqual({
      count: 4,
      nbOfPages: 2,
      nextPage: null,
      titres: ['Sous-action 1', 'Sous-action 2'],
    });
    expect(await listPage({ onlyChildren: true }, 1)).toEqual({
      count: 2,
      nbOfPages: 1,
      nextPage: null,
      titres: ['Sous-action 1', 'Sous-action 2'],
    });
    expect(await listPage({}, 1)).toEqual({
      count: 2,
      nbOfPages: 1,
      nextPage: null,
      titres: ['Action 2', 'Action 10'],
    });
  });
  describe('périmètre « Actions et sous-actions » (withSousActionsMatches)', () => {
    // Lot 2b : les filtres sur les champs d'une sous-action (titre,
    // description, statut, pilotes, date de fin) font remonter l'action dont
    // une sous-action les satisfait tous ; les autres filtres restent sur
    // l'action.
    const withSousActions = { withSousActionsMatches: true } as const;

    test('personnePiloteIds : le pilote d’une sous-action fait remonter son action', async () => {
      const s = await createScenario();
      const pilote = await s.createPersonnePilote('Pilote');
      const action = await s.createAction('Action sans pilote');
      await s.createSousAction(action, 'Sous-action pilotée', {
        pilotes: [pilote],
      });
      await s.createAction('Autre action');

      const filters = { personnePiloteIds: [pilote.tagId] };
      expect(await s.listTitres(filters)).toEqual([]);
      expect(await s.listTitres({ ...filters, ...withSousActions })).toEqual([
        'Action sans pilote',
      ]);
    });

    test('utilisateurPiloteIds : le pilote d’une sous-action fait remonter son action, sans doublon', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action pilotée', {
        pilotes: [s.adminPilote],
      });
      await s.createSousAction(action, 'Sous-action 1', {
        pilotes: [s.adminPilote],
      });
      await s.createSousAction(action, 'Sous-action 2', {
        pilotes: [s.adminPilote],
      });

      expect(
        await s.listTitres({
          utilisateurPiloteIds: [s.admin.id],
          ...withSousActions,
        })
      ).toEqual(['Action pilotée']);
    });

    test('noPilote : une sous-action sans pilote fait remonter son action pilotée', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action pilotée', {
        pilotes: [s.adminPilote],
      });
      await s.createSousAction(action, 'Sous-action sans pilote');

      expect(await s.listTitres({ noPilote: true })).toEqual([]);
      expect(
        await s.listTitres({ noPilote: true, ...withSousActions })
      ).toEqual(['Action pilotée']);
    });

    test('statuts : une sous-action en retard fait remonter son action', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action à venir', {
        champs: { statut: StatutEnum.A_VENIR },
      });
      await s.createSousAction(action, 'Sous-action en retard', {
        champs: { statut: StatutEnum.EN_RETARD },
      });

      const filters = { statuts: [StatutEnum.EN_RETARD] };
      expect(await s.listTitres(filters)).toEqual([]);
      expect(await s.listTitres({ ...filters, ...withSousActions })).toEqual([
        'Action à venir',
      ]);
    });

    test('noStatut : une sous-action sans statut fait remonter son action', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action en cours', {
        champs: { statut: StatutEnum.EN_COURS },
      });
      // le statut vaut « À venir » par défaut
      await s.createSousAction(action, 'Sous-action sans statut', {
        champs: { statut: null },
      });

      expect(
        await s.listTitres({ noStatut: true, ...withSousActions })
      ).toEqual(['Action en cours']);
    });

    test('texteNomOuDescription : le titre ou la description d’une sous-action font remonter son action', async () => {
      const s = await createScenario();
      const parTitre = await s.createAction('Action A');
      await s.createSousAction(parTitre, 'Pistes cyclables');
      const parDescription = await s.createAction('Action B');
      await s.createSousAction(parDescription, 'Sous-action', {
        champs: { description: 'Aménager des pistes' },
      });
      await s.createAction('Action C');

      const filters = { texteNomOuDescription: 'pistes' };
      expect(await s.listTitres(filters)).toEqual([]);
      expect(await s.listTitres({ ...filters, ...withSousActions })).toEqual([
        'Action A',
        'Action B',
      ]);
    });

    test('hasDateDeFinPrevisionnelle : une sous-action datée fait remonter son action', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action sans date de fin');
      await s.createSousAction(action, 'Sous-action datée', {
        champs: { dateFin: '2026-06-30' },
      });

      expect(
        await s.listTitres({
          hasDateDeFinPrevisionnelle: true,
          ...withSousActions,
        })
      ).toEqual(['Action sans date de fin']);
    });

    test('période sur la date de fin : elle s’applique aux sous-actions, pas une période sur la date de début', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action sans date');
      await s.createSousAction(action, 'Sous-action de juin', {
        champs: { dateFin: '2026-06-30' },
      });

      const periode = { debutPeriode: '2026-06-01', finPeriode: '2026-06-30' };
      expect(
        await s.listTitres({
          ...periode,
          typePeriode: 'fin',
          ...withSousActions,
        })
      ).toEqual(['Action sans date']);
      expect(
        await s.listTitres({
          ...periode,
          typePeriode: 'debut',
          ...withSousActions,
        })
      ).toEqual([]);
    });

    test('une même sous-action doit satisfaire tous les filtres qui s’appliquent aux sous-actions', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action');
      await s.createSousAction(action, 'Sous-action en retard sans pilote', {
        champs: { statut: StatutEnum.EN_RETARD },
      });
      await s.createSousAction(action, 'Sous-action pilotée à venir', {
        champs: { statut: StatutEnum.A_VENIR },
        pilotes: [s.adminPilote],
      });

      const filters = {
        statuts: [StatutEnum.EN_RETARD],
        utilisateurPiloteIds: [s.admin.id],
        ...withSousActions,
      };
      expect(await s.listTitres(filters)).toEqual([]);

      await s.createSousAction(action, 'Sous-action pilotée en retard', {
        champs: { statut: StatutEnum.EN_RETARD },
        pilotes: [s.adminPilote],
      });
      expect(await s.listTitres(filters)).toEqual(['Action']);
    });

    test('les autres filtres restent évalués sur l’action : priorité de l’action et statut de la sous-action', async () => {
      const s = await createScenario();
      const prioritaire = await s.createAction('Action prioritaire', {
        champs: { priorite: PrioriteEnum.ÉLEVÉ },
      });
      await s.createSousAction(prioritaire, 'Sous-action en retard', {
        champs: { statut: StatutEnum.EN_RETARD },
      });
      const secondaire = await s.createAction('Action secondaire', {
        champs: { priorite: PrioriteEnum.BAS },
      });
      await s.createSousAction(secondaire, 'Sous-action en retard', {
        champs: { statut: StatutEnum.EN_RETARD, priorite: PrioriteEnum.ÉLEVÉ },
      });

      expect(
        await s.listTitres({
          priorites: [PrioriteEnum.ÉLEVÉ],
          statuts: [StatutEnum.EN_RETARD],
          ...withSousActions,
        })
      ).toEqual(['Action prioritaire']);
    });

    test('le plan reste celui de l’action', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const pilote = await s.createPersonnePilote('Pilote');
      const actionDuPlan = await s.createAction('Action du plan', {
        axes: [plan],
      });
      await s.createSousAction(actionDuPlan, 'Sous-action sans axe', {
        pilotes: [pilote],
      });
      const actionHorsPlan = await s.createAction('Action hors plan');
      await s.createSousAction(actionHorsPlan, 'Sous-action du plan', {
        pilotes: [pilote],
        axes: [plan],
      });

      expect(
        await s.listTitres({
          planActionIds: [plan.id],
          personnePiloteIds: [pilote.tagId],
          ...withSousActions,
        })
      ).toEqual(['Action du plan']);
    });

    test('une sous-action supprimée ne fait pas remonter son action', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action');
      const sousAction = await s.createSousAction(action, 'Sous-action', {
        pilotes: [s.adminPilote],
      });
      await s.deleteFiche(sousAction);

      expect(
        await s.listTitres({
          utilisateurPiloteIds: [s.admin.id],
          ...withSousActions,
        })
      ).toEqual([]);
    });

    test('sans effet quand les lignes listées sont des sous-actions', async () => {
      const s = await createScenario();
      const action = await s.createAction('Action pilotée', {
        pilotes: [s.adminPilote],
      });
      await s.createSousAction(action, 'Sous-action pilotée', {
        pilotes: [s.adminPilote],
      });
      await s.createSousAction(action, 'Sous-action sans pilote');

      expect(
        await s.listTitres({
          utilisateurPiloteIds: [s.admin.id],
          onlyChildren: true,
          ...withSousActions,
        })
      ).toEqual(['Sous-action pilotée']);
    });

    describe('sousActionsCount', () => {
      const sousActionsCountByTitre = async (
        s: Awaited<ReturnType<typeof createScenario>>,
        filters: Parameters<typeof s.listFiches>[0]
      ) =>
        Object.fromEntries(
          (await s.listFiches(filters)).data.map((fiche) => [
            fiche.titre,
            fiche.sousActionsCount,
          ])
        );

      test('compte toutes les sous-actions non supprimées sans le périmètre, et celles qui correspondent avec', async () => {
        const s = await createScenario();
        const action = await s.createAction('Action pilotée', {
          pilotes: [s.adminPilote],
        });
        await s.createSousAction(action, 'Sous-action pilotée', {
          pilotes: [s.adminPilote],
        });
        await s.createSousAction(action, 'Sous-action sans pilote');
        await s.deleteFiche(
          await s.createSousAction(action, 'Sous-action supprimée', {
            pilotes: [s.adminPilote],
          })
        );
        await s.createAction('Action sans sous-action', {
          pilotes: [s.adminPilote],
        });

        const filters = { utilisateurPiloteIds: [s.admin.id] };
        expect(await sousActionsCountByTitre(s, filters)).toEqual({
          'Action pilotée': 2,
          'Action sans sous-action': 0,
        });
        expect(
          await sousActionsCountByTitre(s, { ...filters, ...withSousActions })
        ).toEqual({
          'Action pilotée': 1,
          'Action sans sous-action': 0,
        });
      });
    });

    describe('countSousActionsMatches', () => {
      test('compte les sous-actions qui correspondent et leurs actions, dans le plan de l’action', async () => {
        const s = await createScenario();
        const plan = await s.createPlan('Plan');
        const pilote = await s.createPersonnePilote('Pilote');
        const action1 = await s.createAction('Action 1', { axes: [plan] });
        await s.createSousAction(action1, 'Sous-action 1a', {
          pilotes: [pilote],
        });
        await s.createSousAction(action1, 'Sous-action 1b', {
          pilotes: [pilote],
        });
        await s.createSousAction(action1, 'Sous-action 1c');
        const action2 = await s.createAction('Action 2', { axes: [plan] });
        await s.createSousAction(action2, 'Sous-action 2a', {
          pilotes: [pilote],
        });
        const horsPlan = await s.createAction('Action hors plan');
        await s.createSousAction(horsPlan, 'Sous-action hors plan', {
          pilotes: [pilote],
          axes: [plan],
        });

        expect(
          await s.countSousActionsMatches({
            planActionIds: [plan.id],
            personnePiloteIds: [pilote.tagId],
          })
        ).toEqual({ sousActionsCount: 3, actionsCount: 2 });
      });

      test('ignore les sous-actions supprimées et celles d’une action supprimée', async () => {
        const s = await createScenario();
        const action = await s.createAction('Action');
        await s.deleteFiche(
          await s.createSousAction(action, 'Sous-action supprimée', {
            pilotes: [s.adminPilote],
          })
        );
        const actionSupprimee = await s.createAction('Action supprimée');
        await s.deleteFiche(actionSupprimee);
        await s.createSousAction(actionSupprimee, 'Sous-action orpheline', {
          pilotes: [s.adminPilote],
        });

        expect(
          await s.countSousActionsMatches({
            utilisateurPiloteIds: [s.admin.id],
          })
        ).toEqual({ sousActionsCount: 0, actionsCount: 0 });
      });
    });
  });
});
