import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
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

  return useQuery(
    ['action', infoType, actionId],
    async () => {
      if (infoType === 'desc') {
        return action.description;
      }

      const rpc = `action_${infoType}` as TRPCName;
      const { data } = await supabaseClient.rpc(rpc, { id: actionId }).single();
      return data?.[infoType] as string | undefined;
    },
    DISABLE_AUTO_REFETCH
  );
};
