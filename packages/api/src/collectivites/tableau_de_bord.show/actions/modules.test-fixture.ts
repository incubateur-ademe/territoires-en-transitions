import {expect} from 'vitest';
import {dbAdmin} from '../../../tests/supabase';
import {Module} from '../domain/module.schema';

export const moduleNew: Module = {
  id: crypto.randomUUID(),
  collectiviteId: 1,
  userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  titre: 'Mon module personnalisé',
  slug: 'mon-module-personnalise',
  type: 'fiche_action.list',
  options: {
    filtre: {
      utilisateurPiloteIds: ['17440546-f389-4d4f-bfdb-b0c94a1bd0f9'],
    },
  },
};

export async function resetTableauDeBordModules(params: {
  collectiviteId: number;
  userId: string;
}) {
  // Supprime les modules existants
  await dbAdmin
    .from('tableau_de_bord_module')
    .delete()
    .eq('collectivite_id', params.collectiviteId)
    .eq('user_id', params.userId);

  const {data} = await dbAdmin.from('tableau_de_bord_module').select('*');
  expect(data).toHaveLength(0);
}
