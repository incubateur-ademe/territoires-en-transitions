import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';

export const useCollectiviteBucketId = (collectivite_id: number | null) => {
  const query = useQuery(
    ['collectivite_bucket', collectivite_id],
    async () => {
      if (!collectivite_id) {
        return;
      }
      const {data} = await supabaseClient
        .from('collectivite_bucket')
        .select()
        .match({collectivite_id})
        .single();
      return data?.bucket_id;
    },
    DISABLE_AUTO_REFETCH
  );

  return query?.data || null;
};
