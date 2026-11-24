import { getTestApp, getTestDatabase, getTestRouter } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createListFichesScenario } from './list-fiches.test-fixture';

/**
 * Tests de caractérisation (lot 1a) : ils figent le comportement actuel des
 * filtres de listFiches quand les sous-actions sont incluses, avant le
 * découpage du service. Un changement de résultat attendu doit être volontaire
 * et signalé dans la PR.
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
    test('planActionIds : une sous-action sans axe propre n’est pas dans le plan de son action parente', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const action = await s.createAction('Action du plan', { axes: [plan] });
      await s.createSousAction(action, 'Sous-action sans axe');

      expect(
        await s.listTitres({ planActionIds: [plan.id], withChildren: true })
      ).toEqual(['Action du plan']);
    });

    test('planActionIds : une sous-action est dans le plan de son axe propre, sous-axe compris, même si son action parente est ailleurs', async () => {
      const s = await createScenario();
      const planA = await s.createPlan('Plan A');
      const sousAxe = await s.createAxe(
        'Sous-axe',
        await s.createAxe('Axe', planA)
      );
      const planB = await s.createPlan('Plan B');
      const action = await s.createAction('Action du plan B', {
        axes: [planB],
      });
      await s.createSousAction(action, 'Sous-action du sous-axe du plan A', {
        axes: [sousAxe],
      });

      expect(
        await s.listTitres({ planActionIds: [planA.id], withChildren: true })
      ).toEqual(['Sous-action du sous-axe du plan A']);
    });

    test('axesId : un axe ne retient que ses fiches directes, ni leurs sous-actions ni les fiches de ses sous-axes', async () => {
      const s = await createScenario();
      const axe = await s.createAxe('Axe', await s.createPlan('Plan'));
      const sousAxe = await s.createAxe('Sous-axe', axe);
      const action = await s.createAction('Action de l’axe', { axes: [axe] });
      await s.createSousAction(action, 'Sous-action sans axe');
      await s.createAction('Action du sous-axe', { axes: [sousAxe] });

      expect(
        await s.listTitres({ axesId: [axe.id], withChildren: true })
      ).toEqual(['Action de l’axe']);
    });

    test('noPlan : une sous-action sans axe propre est « sans plan », même si son action parente est dans un plan', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const action = await s.createAction('Action du plan', { axes: [plan] });
      await s.createSousAction(action, 'Sous-action sans axe');

      expect(await s.listTitres({ noPlan: true, withChildren: true })).toEqual([
        'Sous-action sans axe',
      ]);
    });

    test('doesBelongToSeveralPlans : la sous-action d’une action dans deux plans n’en hérite pas', async () => {
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
      ).toEqual(['Action dans deux plans']);
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

    test('onlyChildren applique les filtres aux seules sous-actions', async () => {
      const s = await createScenario();
      const plan = await s.createPlan('Plan');
      const action = await s.createAction('Action du plan', { axes: [plan] });
      await s.createSousAction(action, 'Sous-action du plan', { axes: [plan] });

      expect(
        await s.listTitres({ planActionIds: [plan.id], onlyChildren: true })
      ).toEqual(['Sous-action du plan']);
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
});
