import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {
  DISABLE_AUTO_REFETCH,
  supabaseClient,
} from '@/app/core-logic/api/supabase';
import { useQuery } from 'react-query';
import { TActionInfo, TRPCName } from './type';

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
