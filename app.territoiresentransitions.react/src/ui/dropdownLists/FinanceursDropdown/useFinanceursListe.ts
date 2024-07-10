import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TFinanceurTagRow} from 'types/alias';

export const useFinanceursListe = () => {
  const collectivite_id = useCollectiviteId()!;

  return useQuery(['financeurs', collectivite_id], async () => {
    const {data} = await supabaseClient
      .from('financeur_tag')
      .select()
      .eq('collectivite_id', collectivite_id)
      .order('nom');
    return data as unknown as TFinanceurTagRow[];
  });
};
