import {useQuery} from 'react-query';
import {restoreSessionFromAuthTokens} from '@tet/api';
import {supabaseClient} from '../supabase';
import {ENV} from 'environmentVariables';

export const useCurrentSession = () => {
  const {data, error} = useQuery(['session'], async () => {
    // restaure une éventuelle session précédente
    const ret = await restoreSessionFromAuthTokens(supabaseClient);
    if (ret) {
      const {data, error} = ret;
      if (data?.session) {
        return data?.session;
      }
      throw error;
    }

    const {data, error} = await supabaseClient.auth.getSession();
    if (data?.session) {
      return data?.session;
    }
    throw error;
  });

  if (error || !data) {
    return null;
  }

  return data;
};

export const useAuthHeaders = () => {
  const session = useCurrentSession();
  if (!session) {
    return null;
  }

  const {access_token} = session;
  return {
    authorization: `Bearer ${access_token}`,
    apikey: `${ENV.supabase_anon_key}`,
  };
};
