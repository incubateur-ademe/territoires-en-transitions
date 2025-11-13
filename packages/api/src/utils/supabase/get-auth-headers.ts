import { Session } from '@supabase/supabase-js';
import { ENV } from '../../environmentVariables';

export function getAuthHeaders(session: Session | null) {
  if (!session) {
    return {
      authorization: `Bearer ${ENV.supabase_anon_key}`,
      apikey: `${ENV.supabase_anon_key}`,
    };
  }

  return {
    authorization: `Bearer ${session.access_token}`,
    apikey: `${ENV.supabase_anon_key}`,
  };
}
