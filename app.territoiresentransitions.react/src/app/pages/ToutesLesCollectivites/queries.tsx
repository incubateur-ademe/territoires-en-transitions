import {supabaseClient} from 'core-logic/api/supabase';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';

export type TFetchCollectiviteCardsArgs = {
  regionCodes: string[];
};

export const fetchCollectiviteCards = async (
  args: TFetchCollectiviteCardsArgs
): Promise<CollectiviteCarteRead[]> => {
  // la requête
  let query = supabaseClient
    .from<CollectiviteCarteRead>('collectivite_card')
    .select()
    .limit(20);

  if (args.regionCodes.length > 0)
    query = query.in('region_code', args.regionCodes);

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};
