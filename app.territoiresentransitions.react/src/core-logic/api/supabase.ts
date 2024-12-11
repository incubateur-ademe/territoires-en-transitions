import { supabaseClient } from '@/api/utils/supabase-client';

export { supabaseClient };

// options pour `useQuery` lorsqu'il s'agit de données qui ne changent pas trop
// souvent (définitions du référentiel etc.)
export const DISABLE_AUTO_REFETCH = {
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
};
