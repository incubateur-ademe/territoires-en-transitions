import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {NonNullableFields, Views} from '@tet/api';

export type TCollectivite = NonNullableFields<Views<'named_collectivite'>>;

type TUseAllCollectivites = () => TCollectivite[];

export const useAllCollectivites: TUseAllCollectivites = () => {
  const {data} = useQuery(['named_collectivite'], fetchAllCollectivites);
  return data || [];
};

const fetchAllCollectivites = async () => {
  const {data} = await supabaseClient.from('named_collectivite').select();
  return data?.filter(c => c.collectivite_id && c.nom) as TCollectivite[];
};
