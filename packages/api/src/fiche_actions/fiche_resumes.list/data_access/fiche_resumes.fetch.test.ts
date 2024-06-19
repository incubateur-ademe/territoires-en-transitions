import {beforeAll, expect, test} from 'vitest';
import {signIn, signOut} from '../../../tests/auth';
import {supabase} from '../../../tests/supabase';
import {ficheResumesFetch} from './fiche_resumes.fetch';

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

test('Fetch sans filtre', async () => {
  const {data} = await ficheResumesFetch({
    ...params,
    options: {filtre: {}},
  });

  expect(data).toMatchObject({});
});

test('Fetch avec filtre sur un statut', async () => {
  const {data} = await ficheResumesFetch({
    ...params,
    options: {filtre: {statuts: ['En cours']}},
  });

  expect(data).toMatchObject({});
});

test('Fetch avec filtre sur un statut', async () => {
  const {data} = await ficheResumesFetch({
    ...params,
    options: {filtre: {modifiedSince: 'last-15-days'}},
  });

  expect(data).toMatchObject({});
});
