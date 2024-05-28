import {beforeEach, expect, test} from 'vitest';
import {signIn, signOut} from '../../../tests/auth';
import {dbAdmin, supabase} from '../../../tests/supabase';
import {modulesFetch} from './modules.fetch';
import {modulesSave} from './modules.save';
import {moduleNew, resetTableauDeBordModules} from './modules.test-fixture';
import {getDefaultModules} from '../domain/module.schema';

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

test('Enregistre un nouveau module', async () => {
  const module = moduleNew;

  const {data: noData} = await modulesSave({
    ...params,
    module,
  });

  // Vérifie le bon enregistrement du module
  expect(noData).toBeNull();

  // Vérifie la récupération du module
  const {data} = await modulesFetch({...params});

  expect(data).toHaveLength(numberOfModulesByDefault + 1);
  expect(data[0]).toMatchObject({
    titre: module.titre,
    type: module.type,
    options: module.options,
  });
});

test("Vérifie la mise à jour d'un module existant", async () => {
  const module = moduleNew;

  // Enregistre un nouveau module pour yolododo
  await modulesSave({
    ...params,
    module,
  });

  const newTitre = 'Nouveau titre';

  // Enregistre le module mis à jour
  await modulesSave({
    ...params,
    module: {
      ...module,
      titre: newTitre,
    },
  });

  // Vérifie la mise à jour
  const {data} = await modulesFetch({...params});

  expect(data).toHaveLength(numberOfModulesByDefault + 1);
  expect(data[0]).toMatchObject({
    titre: newTitre,
  });
});

test("RLS: Vérifie qu'un utilisateur sans accès à la collectivité ne peut pas insert", async () => {
  const module = moduleNew;

  // Enregistre un module pour le user par défaut
  await modulesSave({
    ...params,
    module,
  });

  // Se connecte avec un autre utilisateur sans droits sur la collectivité
  await signOut();
  await signIn('yulududu');

  // Tente d'enregistrer un nouveau module pour la collectivité par défaut
  const {error} = await modulesSave({
    ...params,
    module: {
      ...module,
      id: crypto.randomUUID(),
    },
  });

  // Vérifie qu'une erreur est retournée
  expect(error).toBeDefined();

  // Vérifie que l'utilisateur n'a pas pu enregistrer le module pour cette collectivité
  const {data} = await modulesFetch({...params, dbClient: dbAdmin});
  expect(data).toHaveLength(numberOfModulesByDefault + 1);
});

test("RLS: Vérifie qu'un utilisateur en lecture sur la collectivité ne peut pas update", async () => {
  const module = moduleNew;

  // Enregistre un module pour le user par défaut
  await modulesSave({
    ...params,
    module,
  });

  // Se connecte avec un autre utilisateur n'ayant que les droits en lecture
  await signOut();
  await signIn('yaladada');

  // Tente de mettre à jour le module
  await modulesSave({
    ...params,
    module: {
      ...module,
      titre: 'Nouveau titre',
    },
  });

  // Vérifie que l'utilisateur n'a pas pu mettre à jour le module
  const {data} = await modulesFetch({...params, dbClient: dbAdmin});
  expect(data).toHaveLength(numberOfModulesByDefault + 1);
  expect(data[0]).toMatchObject({
    titre: module.titre,
  });
});

test("RLS: Vérifie qu'un utilisateur en écriture ne peut pas update le module d'un autre utilisateur de la collectivité", async () => {
  const module = moduleNew;

  // Enregistre un module pour le user par défaut
  await modulesSave({
    ...params,
    module,
  });

  // Se connecte avec un autre utilisateur ayant aussi les droits
  // en écriture sur la collectivité
  await signOut();
  await signIn('yilididi');

  // Tente de mettre à jour le module
  await modulesSave({
    ...params,
    module: {
      ...module,
      titre: 'Nouveau titre',
    },
  });

  // Vérifie que l'utilisateur n'a pas pu mettre à jour le module
  const {data} = await modulesFetch({...params, dbClient: dbAdmin});
  expect(data).toHaveLength(numberOfModulesByDefault + 1);
  expect(data[0]).toMatchObject({
    titre: module.titre,
  });
});
