import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@tet/api';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';

export const useCollectiviteBucketId = (collectiviteId: number | null) => {
  const supabase = useSupabase();
  const query = useQuery({
    queryKey: ['collectivite_bucket', collectiviteId],

    queryFn: async () => {
      if (!collectiviteId) {
        return;
      }
      const { data } = await supabase
        .from('collectivite_bucket')
        .select()
        .match({ collectiviteId })
        .single();
      return data?.bucket_id;
    },

    ...DISABLE_AUTO_REFETCH,
  });

  return query?.data || null;
};
