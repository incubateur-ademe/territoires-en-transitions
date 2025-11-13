import { expect } from 'vitest';
import { dbAdmin } from '../../../../tests/supabase';
import { ModuleInsert } from '../domain/module.schema';

export const moduleNew: ModuleInsert = {
  id: crypto.randomUUID(),
  collectiviteId: 1,
  userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  titre: 'Mon module personnalisé',
  defaultKey: 'actions-dont-je-suis-pilote',
  type: 'fiche_action.list',
  options: {
    filtre: {
      utilisateurPiloteIds: ['17440546-f389-4d4f-bfdb-b0c94a1bd0f9'],
    },
  },
};

export async function resetModules(params: { collectiviteId: number }) {
  // Supprime les modules existants
  await dbAdmin
    .from('tableau_de_bord_module')
    .delete()
    .eq('collectivite_id', params.collectiviteId)
    .not('user_id', 'is', null);

  const { data } = await dbAdmin
    .from('tableau_de_bord_module')
    .select('*')
    .not('user_id', 'is', null);

  expect(data).toHaveLength(0);
}
