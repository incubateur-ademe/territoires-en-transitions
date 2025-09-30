import 'server-only';

import { DBClient } from '@/api';
import {
  CurrentCollectivite,
  toCurrentCollectivite,
} from '@/api/collectivites';

// charge les collectivités associées au compte de l'utilisateur courant
// (identifié à partir du token passant dans toutes les requêtes)
export const fetchUserCollectivites = async (
  supabase: DBClient
): Promise<CurrentCollectivite[]> => {
  const query = supabase.from('mes_collectivites').select();

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data.map(toCurrentCollectivite);
};
