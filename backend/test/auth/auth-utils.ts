import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { YOLO_DODO_CREDENTIALS } from './test-users.samples';

let supabase: SupabaseClient;

export async function getYoloDodoAuthResponse() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
  }

  return await supabase.auth.signInWithPassword(YOLO_DODO_CREDENTIALS);
}

export const getYoloDodoToken = async (): Promise<string> => {
  const response = await getYoloDodoAuthResponse();

  const yoloDodoToken = response.data.session?.access_token || '';
  return yoloDodoToken;
};

export async function getYoloDodoUser() {
  const {
    data: { user },
  } = await getYoloDodoAuthResponse();

  if (!user) {
    expect.fail('Could not authenticated user yolododo');
  }

  return user;
}
