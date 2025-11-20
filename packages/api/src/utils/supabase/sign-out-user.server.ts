'use server';

import { redirect } from 'next/navigation';
import { createClient } from './server-client';

export async function signOutUser() {
  const supabaseClient = await createClient();
  await supabaseClient.auth.signOut();

  redirect('/');
}
