import {beforeAll, expect, test} from 'vitest';
import {signIn, signOut} from '../../../tests/auth';
import {supabase} from '../../../tests/supabase';
import {modulesFetch} from './modules.fetch';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
  userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
};

beforeAll(async () => {
  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test("Renvoie les 3 modules par défaut si aucun n'a été précédemment enregistré", async () => {
  const {data} = await modulesFetch(params);

  expect(data).toHaveLength(3);

  expect(data[0]).toMatchObject({
    titre: /indicateurs/i,
    type: 'indicateur.list',
    options: expect.any(Object),
  });

  expect(data[1]).toMatchObject({
    titre: /actions/i,
    type: 'fiche_action.list',
    options: expect.objectContaining({
      filtre: expect.any(Object),
    }),
  });
});

test('Renvoie les modules sur un statut', async () => {
  const {data} = await modulesFetch(params);

  expect(data).toMatchObject({});
});
