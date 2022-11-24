import {useQuery} from 'react-query';
import {supabaseClient} from '../supabase';
import {ENV} from 'environmentVariables';

export const useCurrentSession = () => {
  const {data, error} = useQuery(['session'], () =>
    supabaseClient.auth.getSession()
  );
  if (error || !data?.data?.session) {
    return null;
  }
  return data.data.session;
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
