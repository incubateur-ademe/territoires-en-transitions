import 'server-only';

import { DBClient } from '@/api';
import { toCollectiviteAccess } from '@/api/collectivites';
import { CollectiviteAccess } from '@/domain/users';

// charge les collectivités associées au compte de l'utilisateur courant
// (identifié à partir du token passant dans toutes les requêtes)
/**
 * @deprecated use tRPC instead
 * @param supabase
 * @returns
 */
export const fetchUserCollectivites = async (
  supabase: DBClient
): Promise<CollectiviteAccess[]> => {
  const query = supabase.from('mes_collectivites').select();

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data.map(toCollectiviteAccess);
};
