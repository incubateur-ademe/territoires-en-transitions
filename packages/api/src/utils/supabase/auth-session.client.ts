import { ENV } from '@/api/environmentVariables';
import { createClientWithCookieOptions } from './browser-client';

export async function getAuthHeaders() {
  const supabaseClient = createClientWithCookieOptions(
    window.location.hostname
  );

  const { data: session } = await supabaseClient.auth.getSession();

  if (!session) {
    return null;
  }

  return {
    authorization: `Bearer ${session.session?.access_token}`,
    apikey: `${ENV.supabase_anon_key}`,
  };
}
