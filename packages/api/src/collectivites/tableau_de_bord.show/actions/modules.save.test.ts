import {beforeAll, expect, test} from 'vitest';
import {signIn, signOut} from '../../../tests/auth';
import {supabase} from '../../../tests/supabase';
import {modulesFetch} from './modules.fetch';
import {modulesSave} from './modules.save';
import {Module} from '../domain/module.schema';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
  userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
};

beforeAll(async () => {
  await signIn('yolododo');

  return async () => {
    await supabase
      .from('tableau_de_bord_module')
      .delete()
      .eq('collectivite_id', params.collectiviteId)
      .eq('user_id', params.userId);

    const {data} = await supabase.from('tableau_de_bord_module').select('*');
    expect(data).toHaveLength(0);

    await signOut();
  };
});

test('filtre vide', async () => {
  const module: Module = {
    id: crypto.randomUUID(),
    collectiviteId: 1,
    userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    titre: 'Mon module personnalisé',
    type: 'fiche_action.list',
    options: {
      filtre: {
        utilisateurPiloteIds: ['17440546-f389-4d4f-bfdb-b0c94a1bd0f9'],
      },
    },
  };

  const {data: noData} = await modulesSave({
    ...params,
    module,
  });

  expect(noData).toBeNull();

  const {data} = await modulesFetch({...params});

  expect(data).toHaveLength(1);
  expect(data[0]).toMatchObject({
    titre: module.titre,
    type: module.type,
    options: module.options,
  });
});

// test('filtre sur un statut', async () => {
//   const {data} = await modulesSave({
//     ...params,
//   });

//   expect(data).toMatchObject({});
// });
