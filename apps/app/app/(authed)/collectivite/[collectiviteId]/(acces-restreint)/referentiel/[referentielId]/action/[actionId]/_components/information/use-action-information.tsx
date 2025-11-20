import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@tet/api';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';
import { TActionInfo, TRPCName } from './action-information.types';

/**
 * Charge une partie (exemples, ressources, etc.) des infos associées à une action
 */
export const useActionInfoData = (
  infoType: TActionInfo,
  action: ActionDefinitionSummary
) => {
  const actionId = action.id;
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['action', infoType, actionId],

    queryFn: async () => {
      if (infoType === 'desc') {
        return action.description;
      }

      const rpc = `action_${infoType}` as TRPCName;
      const { data } = await supabase.rpc(rpc, { id: actionId }).single();
      return data?.[infoType] as string | undefined;
    },

    ...DISABLE_AUTO_REFETCH,
  });
};
