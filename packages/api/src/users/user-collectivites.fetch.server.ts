import 'server-only';

import { CollectiviteAccess } from '@/domain/users';
import { toCollectiviteAccess } from '../collectivites';
import { DBClient } from '../typeUtils';

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
