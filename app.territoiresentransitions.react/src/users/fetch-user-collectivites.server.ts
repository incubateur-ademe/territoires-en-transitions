import 'server-only';

import { DBClient, MaCollectivite } from '@/api';

// charge les collectivités associées au compte de l'utilisateur courant
// (identifié à partir du token passant dans toutes les requêtes)
export const fetchUserCollectivites = async (supabase: DBClient) => {
  const query = supabase
    .from('mes_collectivites')
    .select()
    .returns<MaCollectivite[]>();

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export type TMesCollectivites = Awaited<
  ReturnType<typeof fetchUserCollectivites>
>;
