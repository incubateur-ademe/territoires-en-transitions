import { beforeEach, expect, test } from 'vitest';
import { defaultSlugsSchema } from '../domain/module.schema';
import { modulesFetch } from './modules.fetch';
import { modulesSave } from './modules.save';
import { signIn, signOut } from '@tet/api/tests/auth';
import { supabase } from '@tet/api/tests/supabase';
import { moduleNew, resetModules } from './modules.test-fixture';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
};

const numberOfModulesByDefault = 2;

beforeEach(async () => {
  await resetModules(params);
  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test("Renvoie les 2 modules par défaut si aucun n'a été précédemment enregistré", async () => {
  const { data } = await modulesFetch(params);

  expect(data).toHaveLength(numberOfModulesByDefault);

  expect(data?.[0]).toMatchObject({
    titre: /plans d'action/i,
    type: 'plan-action.list',
    options: expect.any(Object),
  });

  expect(data?.[1]).toMatchObject({
    titre: /actions/i,
    type: 'fiche-action.count-by-status',
    options: expect.objectContaining({
      filtre: expect.any(Object),
    }),
  });
});

test("Renvoie un module enregistré et l'autre par défaut", async () => {
  const defaultSlug = defaultSlugsSchema.enum['suivi-plan-actions'];

  const myModule = {
    ...moduleNew,
    slug: defaultSlug,
  };

  await modulesSave({
    ...params,
    module: myModule,
  });

  const { data } = await modulesFetch(params);

  expect(data).toHaveLength(numberOfModulesByDefault);

  expect(data).toMatchObject([
    myModule,
    {
      type: 'fiche-action.count-by-status',
      slug: expect.not.stringMatching(defaultSlug),
    },
  ]);
});

test("RLS: Vérifie l'accès en lecture sur la collectivité", async () => {
  const myModule = moduleNew;

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
