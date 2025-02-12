import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useQuery } from 'react-query';
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

  return useQuery(
    ['action', infoType, actionId],
    async () => {
      if (infoType === 'desc') {
        return action.description;
      }

      const rpc = `action_${infoType}` as TRPCName;
      const { data } = await supabase.rpc(rpc, { id: actionId }).single();
      return data?.[infoType] as string | undefined;
    },
    DISABLE_AUTO_REFETCH
  );
};
