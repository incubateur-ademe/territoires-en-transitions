import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { YOLO_DODO_CREDENTIALS } from './test-users.samples';
let supabase: SupabaseClient;

export const getYoloDodoToken = async (): Promise<string> => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  const signinResponse = await supabase.auth.signInWithPassword(
    YOLO_DODO_CREDENTIALS
  );
  const yoloDodoToken = signinResponse.data.session?.access_token || '';
  return yoloDodoToken;
};
