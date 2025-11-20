import type { FiltreRessourceLiees } from '@tet/domain/shared';
import { beforeAll, expect, test } from 'vitest';
import { signIn, signOut } from '../../../tests/auth';
import { supabase } from '../../../tests/supabase';
import { filtreValuesFetch } from './filtre-values.fetch';

const getFiltreValues = async ({
  filtre,
}: {
  filtre: FiltreRessourceLiees;
}) => {
  return filtreValuesFetch({
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

test('Filtre vide', async () => {
  const { data } = await getFiltreValues({
    filtre: {},
  });

  expect(data).toMatchObject({});
});

test('Filtre sur les plans', async () => {
  const { data } = await getFiltreValues({
    filtre: {
      planActionIds: [1],
    },
  });

  expect(data).toMatchObject({
    planActions: [
      {
        id: 1,
        nom: 'Plan Vélo 2020-2024',
      },
    ],
  });
});

test('Filtre sur une personne pilote', async () => {
  const { data } = await getFiltreValues({
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

test('Filtre sur un utilisateur pilote', async () => {
  const { data } = await getFiltreValues({
    filtre: {
      utilisateurPiloteIds: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
    },
  });

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

test('Filtre sur une structure pilote', async () => {
  const { data } = await getFiltreValues({
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

test('Filtre sur un service pilote', async () => {
  const { data } = await getFiltreValues({
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

test('Filtre sur un financeur', async () => {
  const { data } = await getFiltreValues({
    filtre: {
      financeurIds: [1],
    },
  });

  expect(data).toEqual({
    financeurs: expect.arrayContaining([
      {
        id: 1,
        nom: 'Balthazar Picsou',
        collectiviteId: 1,
      },
    ]),
  });
});

test('Filtre sur un partenaire', async () => {
  const { data } = await getFiltreValues({
    filtre: {
      partenaireIds: [1],
    },
  });

  expect(data).toEqual({
    partenaires: expect.arrayContaining([
      {
        id: 1,
        nom: 'Super partenaire',
        collectiviteId: 1,
      },
    ]),
  });
});

test('Filtre sur plusieurs services pilotes', async () => {
  const { data } = await getFiltreValues({
    filtre: {
      servicePiloteIds: [1, 2],
    },
  });

  expect(data).toEqual({
    servicePilotes: expect.arrayContaining([
      {
        id: 1,
        nom: 'Super service',
        collectiviteId: 1,
      },
      {
        id: 2,
        nom: 'Ultra service',
        collectiviteId: 1,
      },
    ]),
  });
});

test('Filtre sur plusieurs thématiques', async () => {
  const { data } = await getFiltreValues({
    filtre: {
      thematiqueIds: [4, 6],
    },
  });

  expect(data).toMatchObject({
    thematiques: [
      {
        id: 4,
        nom: expect.any(String),
      },
      {
        id: 6,
        nom: expect.any(String),
      },
    ],
  });
});
