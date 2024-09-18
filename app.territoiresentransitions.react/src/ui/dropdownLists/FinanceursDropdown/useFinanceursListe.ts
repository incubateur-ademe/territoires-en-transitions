import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TFinanceurTagRow} from 'types/alias';

export const useFinanceursListe = () => {
  const collectivite_id = useCollectiviteId()!;

  return useQuery(['financeurs', collectivite_id], async () => {
    const {error, data} = await supabaseClient
      .from('financeur_tag')
      .select()
      .eq('collectivite_id', collectivite_id)
      .order('nom');

    if (error) throw new Error(error.message);

    return data as TFinanceurTagRow[];
  });
};
