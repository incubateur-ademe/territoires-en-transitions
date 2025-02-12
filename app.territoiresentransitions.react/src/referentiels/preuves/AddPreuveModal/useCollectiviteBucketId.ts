import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

export const useCollectiviteBucketId = (collectivite_id: number | null) => {
  const supabase = useSupabase();
  const query = useQuery(
    ['collectivite_bucket', collectivite_id],
    async () => {
      if (!collectivite_id) {
        return;
      }
      const { data } = await supabase
        .from('collectivite_bucket')
        .select()
        .match({ collectivite_id })
        .single();
      return data?.bucket_id;
    },
    DISABLE_AUTO_REFETCH
  );

  return query?.data || null;
};
