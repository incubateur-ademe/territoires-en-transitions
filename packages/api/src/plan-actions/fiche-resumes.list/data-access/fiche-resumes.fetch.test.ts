import { trpc } from '@/api/utils/trpc/client';
import { beforeAll, expect, test } from 'vitest';
import { signIn, signOut } from '../../../tests/auth';
import { dbAdmin, supabase } from '../../../tests/supabase';
import { ficheResumesFetch } from './fiche-resumes.fetch';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
  trpcUtils: {
    collectivites: {
      personnes: {
        list: {
          ensureData: vi.fn(async () => {
            return [
              { tagId: 1, nom: 'Lou Piote' },
              { tagId: null, userId: yoloDodoUuid, nom: 'Yolo Dodo' },
            ];
          }),
        },
      },
    },
  } as unknown as ReturnType<typeof trpc.useUtils>,
};

const yoloDodoUuid = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9';

// vi.mock('@/api/utils/trpc/client', () => {
//   return {
//     trpcUtils: {
//       collectivites: {
//         personnes: {
//           list: {
//             ensureData: vi.fn(async () => {
//               return [
//                 { tagId: 1, nom: 'Lou Piote' },
//                 { tagId: null, userId: yoloDodoUuid, nom: 'Yolo Dodo' },
//               ];
//             }),
//           },
//         },
//       },
//     },
//   };
// });

beforeAll(async () => {
  await signIn('yolododo');

  return async () => {
    vi.restoreAllMocks();
    await signOut();
  };
});

test('Fetch sans filtre', async () => {
  const { data } = await ficheResumesFetch({
    ...params,
    options: { filtre: {} },
  });

  if (!data) {
    expect.fail();
  }
});

test('Fetch avec filtre sur une personne', async () => {
  const { data } = await ficheResumesFetch({
    ...params,
    options: { filtre: { personnePiloteIds: [1] } },
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      pilotes: expect.arrayContaining([
        expect.objectContaining({ tagId: 1, nom: 'Lou Piote' }),
      ]),
    });
  }
});

test('Fetch avec filtre sur un utilisateur', async () => {
  const { data } = await ficheResumesFetch({
    ...params,
    options: {
      filtre: { utilisateurPiloteIds: [yoloDodoUuid] },
    },
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      pilotes: expect.arrayContaining([
        expect.objectContaining({
          userId: yoloDodoUuid,
          nom: 'Yolo Dodo',
          tagId: null,
        }),
      ]),
    });
  }
});

test('Fetch avec filtre sur un utilisateur et sur personne. Le filtre doit être un OU.', async () => {
  const { data } = await ficheResumesFetch({
    ...params,
    options: {
      filtre: { utilisateurPiloteIds: [yoloDodoUuid], personnePiloteIds: [1] },
    },
  });

  if (!data) {
    expect.fail();
  }

  expect(data.length).toBeGreaterThan(0);

  for (const fiche of data) {
    expect(fiche.pilotes?.length).toBeGreaterThan(0);
  }
});

test('Fetch avec filtre sur un service', async () => {
  const { data } = await ficheResumesFetch({
    ...params,
    options: { filtre: { servicePiloteIds: [2] } },
  });

  if (!data) {
    expect.fail();
  }

  for (const fiche of data) {
    expect(fiche).toMatchObject({
      services: expect.arrayContaining([
        { id: 2, nom: 'Ultra service', collectiviteId: 1 },
      ]),
    });
  }
});

test('Fetch avec filtre sur un plan', async () => {
  const { data } = await ficheResumesFetch({
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
    collectiviteId: 1,
  });
});

test('Fetch avec filtre sur une action du referentiel associée', async () => {
  // Test avec une action associée à plusieurs fiches
  const { data: fichesWithAction } = await ficheResumesFetch({
    ...params,
    options: {
      filtre: {
        referentielActionIds: ['eci_2.1'],
      },
    },
  });

  if (!fichesWithAction) {
    expect.fail();
  }

  expect(fichesWithAction.length).toBeGreaterThan(1);

  // Test avec une action associée à aucune fiche
  const { data: noFichesFound } = await ficheResumesFetch({
    ...params,
    options: {
      filtre: {
        referentielActionIds: ['eci_2.2'],
      },
    },
  });

  if (!noFichesFound) {
    expect.fail();
  }

  expect(noFichesFound).toHaveLength(0);
});

test('Fetch avec filtre sur une fiche liée', async () => {
  await dbAdmin.from('fiche_action_lien').insert([
    { fiche_une: 1, fiche_deux: 5 },
    { fiche_une: 5, fiche_deux: 3 },
  ]);

  onTestFinished(async () => {
    await dbAdmin.from('fiche_action_lien').delete().match({ fiche_une: 1 });
    await dbAdmin.from('fiche_action_lien').delete().match({ fiche_une: 5 });
  });

  // Test avec une action associée à plusieurs fiches
  const { data: fichesWithAction } = await ficheResumesFetch({
    ...params,
    options: {
      filtre: {
        linkedFicheActionIds: [5],
      },
    },
  });

  if (!fichesWithAction) {
    expect.fail();
  }

  expect(fichesWithAction).toHaveLength(2);

  // Test avec une fiche associée à aucune autre fiche
  const { data: noFichesFound } = await ficheResumesFetch({
    ...params,
    options: {
      filtre: {
        linkedFicheActionIds: [10],
      },
    },
  });

  if (!noFichesFound) {
    expect.fail();
  }

  expect(noFichesFound).toHaveLength(0);
});

test('Fetch avec filtre sur un statut', async () => {
  const { data } = await ficheResumesFetch({
    ...params,
    options: { filtre: { statuts: ['En cours'] } },
  });

  expect(data).toMatchObject({});
});

test('Fetch avec filtre sur la date de modification', async () => {
  const { data } = await ficheResumesFetch({
    ...params,
    options: { filtre: { modifiedSince: 'last-15-days' } },
  });

  expect(data).toMatchObject({});
});
