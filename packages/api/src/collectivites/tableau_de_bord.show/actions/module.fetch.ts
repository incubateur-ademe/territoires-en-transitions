import {objectToCamel} from 'ts-case-convert';
import {DBClient} from '../../../typeUtils';
import {ModuleFetchReturnValue} from './modules.fetch';

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  userId: string;
  slug: string;
};

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export async function moduleFetch({
  dbClient,
  collectiviteId,
  userId,
  slug,
}: Props) {
  try {
    const query = dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .eq('user_id', userId)
      .eq('slug', slug);

    const {data: rawData, error} = await query;

    if (error) {
      throw error;
    }

    const data = objectToCamel(rawData) as ModuleFetchReturnValue;

    if (data.length === 0) {
      return {
        data: undefined,
      };
    }

    return {data: data[0]};
  } catch (error) {
    console.error(error);
    return {error};
  }
}
