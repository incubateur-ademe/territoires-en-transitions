import { signIn, signOut } from '@tet/api/tests/auth';
import { supabase } from '@tet/api/tests/supabase';
import { planActionsFetch } from './plan-actions.fetch';
import { FetchOptions } from '../domain/fetch-options.schema';
import * as _ from 'lodash';

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
  const sortedTitles = _.sortBy(titles);

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
  const sortedTitles = _.sortBy(titles).reverse();

  titles.forEach((title, index) => {
    expect(sortedTitles[index]).toEqual(title);
  });
});
