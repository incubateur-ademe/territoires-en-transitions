import {QueryOptions} from '../../../fiche_actions';
import {DBClient} from '../../../typeUtils';

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  userId: number;
  options: QueryOptions;
};

export async function modulesSave({
  dbClient,
  collectiviteId,
  userId,
  options,
}: Props) {
  try {
    const {data, error} = await dbClient
      .from('tableau_de_bord_module')
      .upsert(
        {
          collectivite_id: collectiviteId,
          user_id: userId,
          type: 'fiche_actions',
          query_options: options,
        },
        {onConflict: 'collectivite_id, user_id, type'}
      )
      .eq('collectivite_id', collectiviteId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return {data};
  } catch (error) {
    console.error(error);
    return {error};
  }
}
