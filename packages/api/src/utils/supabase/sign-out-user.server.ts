'use server';

import { createSupabaseServerClient } from './server-client';

export async function signOutUser() {
  const supabaseClient = await createSupabaseServerClient();
  await supabaseClient.auth.signOut();
}
