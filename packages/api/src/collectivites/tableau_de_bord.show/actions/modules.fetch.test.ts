import {beforeEach, expect, test} from 'vitest';
import {signIn, signOut} from '../../../tests/auth';
import {supabase} from '../../../tests/supabase';
import {defaultSlugsSchema, getDefaultModules} from '../domain/module.schema';
import {modulesFetch} from './modules.fetch';
import {modulesSave} from './modules.save';
import {moduleNew, resetTableauDeBordModules} from './modules.test-fixture';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
  userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
};

const numberOfModulesByDefault = getDefaultModules(params).length;

beforeEach(async () => {
  await signIn('yolododo');

  return async () => {
    await resetTableauDeBordModules(params);
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

test('Renvoie un module enregistré et les 2 autres par défaut', async () => {
  const defaultSlug = defaultSlugsSchema.enum['actions-dont-je-suis-pilote'];
  const module = {
    ...moduleNew,
    slug: defaultSlug,
  };

  await modulesSave({
    ...params,
    module,
  });

  const {data} = await modulesFetch(params);

  expect([{foo: 'bar', hello: 1}, {baz: 1}]).toMatchObject([
    {foo: 'bar'},
    {baz: 1},
  ]);

  expect(data).toHaveLength(3);

  expect(data).toMatchObject([
    module,
    {
      titre: expect.stringMatching(/indicateurs/i),
      type: 'indicateur.list',
      options: expect.any(Object),
    },
    {
      titre: expect.stringMatching(/actions/i),
      type: 'fiche_action.list',
      slug: expect.not.stringMatching(defaultSlug),
    },
  ]);
});

test("RLS: Vérifie l'accès en lecture sur la collectivité", async () => {
  const module = moduleNew;

  await modulesSave({
    ...params,
    module,
  });

  const {data} = await modulesFetch(params);
  expect(data).toHaveLength(numberOfModulesByDefault + 1);

  // Se connecte avec un autre utilisateur de la collectivité, autorisé en lecture
  await signOut();
  await signIn('yaladada');

  // RLS: Vérifie que le module est accessible
  const {data: authorizedData} = await supabase
    .from('tableau_de_bord_module')
    .select('*')
    .eq('id', module.id);

  expect(authorizedData).toHaveLength(1);

  // Se connecte avec un utilisateur n'appartenant pas à la collectivité
  await signOut();
  await signIn('yulududu');

  // RLS: Vérifie que le module n'est pas accessible
  const {data: unauthorizedData} = await supabase
    .from('tableau_de_bord_module')
    .select('*')
    .eq('id', module.id);

  expect(unauthorizedData).toHaveLength(0);
});
