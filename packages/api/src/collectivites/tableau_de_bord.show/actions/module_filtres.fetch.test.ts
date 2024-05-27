import {beforeAll, expect, test} from 'vitest';
import {signIn, signOut} from '../../../tests/auth';
import {supabase} from '../../../tests/supabase';
import {moduleFiltresFetch} from './module_filtres.fetch';

const getModules = async ({filtre}) => {
  return moduleFiltresFetch({
    dbClient: supabase,
    collectiviteId: 1,
    filtre,
  });
};

beforeAll(async () => {
  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test('filtre vide', async () => {
  const {data} = await getModules({
    filtre: {},
  });

  expect(data).toMatchObject({});
});

test('filtre sur les plans', async () => {
  const {data} = await getModules({
    filtre: {
      planActionIds: [1],
    },
  });

  expect(data).toMatchObject({
    plans: [
      {
        id: 1,
        nom: 'Plan Vélo 2020-2024',
      },
    ],
  });
});

test('filtre sur une personne pilote', async () => {
  const {data} = await getModules({
    filtre: {
      personnePiloteIds: [1],
    },
  });

  expect(data).toMatchObject({
    personnePilotes: [
      {
        id: 1,
        nom: 'Lou Piote',
      },
    ],
  });
});

test('filtre sur un utilisateur pilote', async () => {
  const {data} = await getModules({
    filtre: {
      utilisateurPiloteIds: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
    },
  });

  console.log(data);

  expect(data).toMatchObject({
    utilisateurPilotes: [
      {
        userId: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
        nom: 'Dada',
        prenom: 'Yala',
      },
    ],
  });
});

test('filtre sur une structure pilote', async () => {
  const {data} = await getModules({
    filtre: {
      structurePiloteIds: [2],
    },
  });

  expect(data).toMatchObject({
    structurePilotes: [
      {
        id: 2,
        nom: 'Ultra structure',
      },
    ],
  });
});

test('filtre sur un service pilote', async () => {
  const {data} = await getModules({
    filtre: {
      servicePiloteIds: [1],
    },
  });

  expect(data).toMatchObject({
    servicePilotes: [
      {
        id: 1,
        nom: 'Super service',
      },
    ],
  });
});

test('filtre sur plusieurs services pilotes', async () => {
  const {data} = await getModules({
    filtre: {
      servicePiloteIds: [1, 2],
    },
  });

  expect(data).toMatchObject({
    servicePilotes: [
      {
        id: 1,
        nom: 'Super service',
      },
      {
        id: 2,
        nom: 'Ultra service',
      },
    ],
  });
});
