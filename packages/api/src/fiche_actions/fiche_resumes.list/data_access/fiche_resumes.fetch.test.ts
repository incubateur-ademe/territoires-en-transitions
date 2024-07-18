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

  if (!data) {
    expect.fail();
  }
});

test('Fetch avec filtre sur un service', async () => {
  const {data} = await ficheResumesFetch({
    ...params,
    options: {filtre: {servicePiloteIds: [2]}},
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      services: expect.arrayContaining([
        {id: 2, nom: 'Ultra service', collectivite_id: 1},
      ]),
    });
  }
});

test('Fetch avec filtre sur un statut', async () => {
  const {data} = await ficheResumesFetch({
    ...params,
    options: {filtre: {statuts: ['En cours']}},
  });

  expect(data).toMatchObject({});
});

test('Fetch avec filtre sur la date de modification', async () => {
  const {data} = await ficheResumesFetch({
    ...params,
    options: {filtre: {modifiedSince: 'last-15-days'}},
  });

  expect(data).toMatchObject({});
});
