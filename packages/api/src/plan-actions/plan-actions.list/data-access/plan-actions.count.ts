import { DBClient } from '@tet/api/typeUtils';

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
};

/**
 * Charge le nombre total de fiches action d'une collectivité
 */
export async function planActionsCount({ dbClient, collectiviteId }: Props) {
  const query = dbClient
    .from('axe')
    .select('id', {
      count: 'exact',
    })
    .eq('collectivite_id', collectiviteId)
    .is('parent', null);

  const { error, count } = await query;

  if (error) {
    console.error(error);
    return { error };
  }

  return count;
}
