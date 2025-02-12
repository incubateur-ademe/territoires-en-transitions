import { ENV } from '@/api/environmentVariables';

export async function getAuthHeaders() {
  const { data: session } = await supabaseClient.auth.getSession();

  if (!session) {
    return null;
  }

  return {
    authorization: `Bearer ${session.session?.access_token}`,
    apikey: `${ENV.supabase_anon_key}`,
  };
}
