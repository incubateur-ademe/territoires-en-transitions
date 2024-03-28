import useSWR from 'swr';
import {NonNullableFields, Views} from '@tet/api';
import {supabase} from 'src/clientAPI';

/** Charge la liste des collectivités */
const getCollectivites = async (nom?: string) => {
  const query = supabase
    .from('collectivite_card')
    .select('value: collectivite_id, label: nom');

  if (nom) {
    query.ilike('nom', `%${nom}%`);
  } else {
    query.limit(15);
  }

  const {data} = await query;

  return (data || []) as Array<{value: number; label: string}>;
};

export const useCollectivites = (nom?: string) =>
  useSWR(['signup-collectivite', nom], () => getCollectivites(nom));
