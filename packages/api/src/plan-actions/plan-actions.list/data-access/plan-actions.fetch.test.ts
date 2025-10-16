import { signIn, signOut } from '@/api/tests/auth';
import { dbAdmin, supabase } from '@/api/tests/supabase';

import { FetchOptions } from '../domain/fetch-options.schema';
import { planActionsFetch } from './plan-actions.fetch';
import { sortBy } from 'es-toolkit';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
};

beforeEach(async () => {
  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test('Fetch sans filtre', async () => {
  const { plans } = await planActionsFetch(params);

  expect(plans).toHaveLength(2);

  for (const plan of plans) {
    expect(plan).toMatchObject({
      parent: null,
    });
  }
});

test("Fetch avec filtre sur l'id de plan d'action", async () => {
  const options: FetchOptions = {
    filtre: {
      planActionIds: [1],
    },
  };

  const { plans } = await planActionsFetch({ ...params, options });
  expect(plans).toHaveLength(1);
});

test('Fetch avec sort par ordre alphabétique croissant', async () => {
  const sortAsc: FetchOptions = {
    sort: [{ field: 'nom', direction: 'asc' }],
  };

  const { plans } = await planActionsFetch({ ...params, options: sortAsc });
  expect(plans).toHaveLength(2);

  // Vérifie que les plans sont triés par ordre alphabétique
  const titles = plans.map((plan) => plan.nom);
  const sortedTitles = sortBy(titles);

  titles.forEach((title, index) => {
    expect(sortedTitles[index]).toEqual(title);
  });
});

test('Fetch avec sort par ordre alphabétique décroissant', async () => {
  const sortAsc: FetchOptions = {
    sort: [{ field: 'nom', direction: 'desc' }],
  };

  const { plans } = await planActionsFetch({ ...params, options: sortAsc });
  expect(plans).toHaveLength(2);

  // Vérifie que les plans sont triés par ordre alphabétique
  const titles = plans.map((plan) => plan.nom);
  const sortedTitles = sortBy(titles).reverse();

  titles.forEach((title, index) => {
    expect(sortedTitles[index]).toEqual(title);
  });
});

describe('Fetch avec select', () => {
  const PLAN_ID = 1;

  beforeAll(async () => {
    // Set type for plans d'action
    await dbAdmin.from('axe').update({ type: 1 }).eq('plan', PLAN_ID);
  });

  afterAll(async () => {
    // Reset type for plans d'action
    await dbAdmin.from('axe').update({ type: null }).eq('plan', PLAN_ID);
  });

  test("Fetch contient toujours l'objet type de plan", async () => {
    const { plans } = await planActionsFetch({
      ...params,
    });

    for (const plan of plans) {
      if (plan.plan === PLAN_ID) {
        expect(plan.type).toMatchObject({
          id: expect.any(Number),
          type: expect.any(String),
          detail: expect.any(String),
          categorie: expect.any(String),
        });
      } else {
        expect(plan.type).toBe(null);
      }
    }
  });

  test('Fetch avec les objets sous-axes', async () => {
    const { plans } = await planActionsFetch({
      ...params,
      withSelect: ['axes'],
    });

    for (const plan of plans) {
      expect(plan.axes).toEqual(expect.any(Array));
    }
  });
});
