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

test('Fetch avec filtre sur une personne', async () => {
  const {data} = await ficheResumesFetch({
    ...params,
    options: {filtre: {personnePiloteIds: [1]}},
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      pilotes: expect.arrayContaining([{tag_id: 1, nom: 'Lou Piote'}]),
    });
  }
});

test('Fetch avec filtre sur un utilisateur', async () => {
  const yoloDodoUuid = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9';

  const {data} = await ficheResumesFetch({
    ...params,
    options: {
      filtre: {utilisateurPiloteIds: [yoloDodoUuid]},
    },
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      pilotes: expect.arrayContaining([
        {
          user_id: yoloDodoUuid,
          nom: expect.any(String),
          prenom: expect.any(String),
        },
      ]),
    });
  }
});

test('Fetch avec filtre sur un utilisateur et sur personne. Le filtre doit être un OU.', async () => {
  const yoloDodoUuid = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9';

  const {data} = await ficheResumesFetch({
    ...params,
    options: {
      filtre: {utilisateurPiloteIds: [yoloDodoUuid], personnePiloteIds: [1]},
    },
  });

  if (!data) {
    expect.fail();
  }

  expect(data.length).toBeGreaterThan(0);

  for (const fiche of data) {
    expect(fiche.pilotes.length).toBeGreaterThan(0);
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

test('Fetch avec filtre sur un plan', async () => {
  const {data} = await ficheResumesFetch({
    ...params,
    options: {
      filtre: {
        texteNomOuDescription:
          'Ajouter caméra de surveillance au parking à vélo 2020-2024',
      },
    },
  });

  if (!data) {
    expect.fail();
  }

  expect(data).toHaveLength(1);
  expect(data[0].plans?.[0]).toMatchObject({
    nom: 'Plan Vélo 2020-2024', // correspond au plan racine
    parent: null,
    collectivite_id: 1,
  });
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
