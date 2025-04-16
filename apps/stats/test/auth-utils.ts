import {
  createClient,
  SignInWithPasswordCredentials,
  SupabaseClient,
} from '@supabase/supabase-js';

let supabase: SupabaseClient;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return supabase;
};

export async function signInWith(credentials: SignInWithPasswordCredentials) {
  const supabase = getSupabaseClient();
  return await supabase.auth.signInWithPassword(credentials);
}
