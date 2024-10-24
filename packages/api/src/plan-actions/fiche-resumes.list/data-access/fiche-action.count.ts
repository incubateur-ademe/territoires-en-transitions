import { DBClient } from '@tet/api/typeUtils';

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
};

/**
 * Charge le nombre total de fiches action d'une collectivité
 */
export async function ficheActionCount({ dbClient, collectiviteId }: Props) {
  const query = dbClient
    .from('fiche_action')
    .select('id', {
      count: 'exact',
    })
    .eq('collectivite_id', collectiviteId);

  const { error, count } = await query;

  if (error) {
    console.error(error);
    return { error };
  }

  return count;
}
