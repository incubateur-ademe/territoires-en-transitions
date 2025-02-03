import { ENV } from '@/api/environmentVariables';
import { supabaseClient } from './browser-client';

export async function getAuthSession() {
  const { data: session } = await supabaseClient.auth.getSession();
  return session;
}

export async function getAuthHeaders() {
  const session = await getAuthSession();

  if (!session) {
    return null;
  }

  return {
    authorization: `Bearer ${session.session?.access_token}`,
    apikey: `${ENV.supabase_anon_key}`,
  };
}
