import { ENV } from '@/api/environmentVariables';
import { Session } from '@supabase/supabase-js';

export function getAuthHeaders(session: Session | null) {
  if (!session) {
    return {
      authorization: `Bearer `,
      apikey: `${ENV.supabase_anon_key}`,
    };
  }

  return {
    authorization: `Bearer ${session.access_token}`,
    apikey: `${ENV.supabase_anon_key}`,
  };
}
