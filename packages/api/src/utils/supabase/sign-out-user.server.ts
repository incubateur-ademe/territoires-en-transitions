'use server';

import { createClient } from '@/api/utils/supabase/server-client';
import { redirect } from 'next/navigation';

export async function signOutUser() {
  const supabaseClient = await createClient();
  await supabaseClient.auth.signOut();

  redirect('/');
}
