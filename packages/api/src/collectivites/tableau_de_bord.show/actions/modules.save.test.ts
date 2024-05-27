import {beforeAll, expect, test} from 'vitest';
import {signIn, signOut} from '../../../tests/auth';
import {supabase} from '../../../tests/supabase';
import {modulesSave} from './modules.save';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
};

beforeAll(async () => {
  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test('filtre vide', async () => {
  const {data} = await modulesSave({
    ...params,
    options: {
      filter: {},
    },
  });

  expect(data).toMatchObject({});
});

test('filtre sur un statut', async () => {
  const {data} = await modulesSave({
    ...params,
    options: {filter: {statuts: ['En cours']}},
  });

  expect(data).toMatchObject({});
});
