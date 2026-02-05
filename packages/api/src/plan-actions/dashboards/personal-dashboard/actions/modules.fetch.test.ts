import { beforeEach, expect, test } from 'vitest';
import { signIn, signOut } from '../../../../tests/auth';
import { supabase } from '../../../../tests/supabase';
import {
  ModuleInsert,
  personalDefaultModuleKeysSchema,
} from '../domain/module.schema';
import { modulesFetch } from './modules.fetch';
import { modulesSave } from './modules.save';
import { moduleNew, resetModules } from './modules.test-fixture';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
  userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  planIds: [1, 12],
};

const numberOfModulesByDefault = 4;

beforeEach(async () => {
  await resetModules(params);
  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test("Renvoie les 4 modules par défaut si aucun n'a été précédemment enregistré", async () => {
  const { data } = await modulesFetch(params);

  expect(data).toHaveLength(numberOfModulesByDefault);

  expect(data?.[0]).toMatchObject({
    titre: /indicateurs/i,
    type: 'indicateur.list',
    options: expect.objectContaining({
      filtre: expect.any(Object),
    }),
  });

  expect(data?.[1]).toMatchObject({
    titre: /sous actions/i,
    type: 'fiche_action.list',
    options: expect.objectContaining({
      filtre: expect.any(Object),
    }),
  });

  expect(data?.[2]).toMatchObject({
    titre: /actions/i,
    type: 'fiche_action.list',
    options: expect.objectContaining({
      filtre: expect.any(Object),
    }),
  });

  expect(data?.[3]).toMatchObject({
    titre: /mesures/i,
    type: 'mesure.list',
    options: expect.objectContaining({
      filtre: expect.any(Object),
    }),
  });
});

test('Renvoie un module enregistré et les 2 autres par défaut', async () => {
  const moduleDefaultKey =
    personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote'];

  const myModule: ModuleInsert = {
    ...moduleNew,
    defaultKey: moduleDefaultKey,
  };

  await modulesSave({
    ...params,
    module: myModule,
  });

  const { data } = await modulesFetch(params);

  expect([{ foo: 'bar', hello: 1 }, { baz: 1 }]).toMatchObject([
    { foo: 'bar' },
    { baz: 1 },
  ]);

  expect(data).toHaveLength(numberOfModulesByDefault);

  // Modules must always be in the same order
  expect(data).toMatchObject([
    {
      titre: expect.stringMatching(/indicateurs/i),
      type: 'indicateur.list',
      options: expect.any(Object),
    },
    myModule,
    {
      titre: expect.stringMatching(/sous actions/i),
      type: 'fiche_action.list',
      options: expect.any(Object),
    },
    {
      titre: expect.stringMatching(/mesures/i),
      type: 'mesure.list',
      defaultKey: expect.not.stringMatching(moduleDefaultKey),
    },
  ]);
});

test("RLS: Vérifie l'accès en lecture sur la collectivité", async () => {
  const myModule: ModuleInsert = {
    ...moduleNew,
    defaultKey:
      personalDefaultModuleKeysSchema.enum['actions-dont-je-suis-pilote'],
  };

  await modulesSave({
    ...params,
    module: myModule,
  });

  const { data } = await modulesFetch(params);
  expect(data).toHaveLength(numberOfModulesByDefault);

  // Se connecte avec un autre utilisateur de la collectivité, autorisé en lecture
  await signOut();
  await signIn('yaladada');

  // RLS: Vérifie que le module est accessible
  const { data: authorizedData } = await supabase
    .from('tableau_de_bord_module')
    .select('*')
    .eq('id', myModule.id);

  expect(authorizedData).toHaveLength(1);

  // Se connecte avec un utilisateur n'appartenant pas à la collectivité
  await signOut();
  await signIn('yulududu');

  // RLS: Vérifie que le module n'est pas accessible
  const { data: unauthorizedData } = await supabase
    .from('tableau_de_bord_module')
    .select('*')
    .eq('id', myModule.id);

  expect(unauthorizedData).toHaveLength(0);
});
