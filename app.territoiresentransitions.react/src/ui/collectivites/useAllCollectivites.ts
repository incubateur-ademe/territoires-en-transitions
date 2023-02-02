import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';
import {NonNullableFields} from 'types/utils';

export type TCollectivite = NonNullableFields<
  Database['public']['Views']['named_collectivite']['Row']
>;

type TUseAllCollectivites = () => TCollectivite[];

export const useAllCollectivites: TUseAllCollectivites = () => {
  const {data} = useQuery(['named_collectivite'], fetchAllCollectivites);
  return data || [];
};

const fetchAllCollectivites = async () => {
  const {data} = await supabaseClient.from('named_collectivite').select();
  return data?.filter(c => c.collectivite_id && c.nom) as TCollectivite[];
};
