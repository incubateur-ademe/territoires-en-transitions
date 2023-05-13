import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {TActionInfo, TRPCName} from './type';

/**
 * Charge une partie (exemples, ressources, etc.) des infos associées à une action
 */
export const useActionInfoData = (infoType: TActionInfo, actionId: string) => {
  const rpc = `action_${infoType}` as TRPCName;

  return useQuery(
    [rpc, actionId],
    async () => {
      const {data} = await supabaseClient.rpc(rpc, {id: actionId}).single();
      return data?.[infoType] as string;
    },
    DISABLE_AUTO_REFETCH
  );
};
