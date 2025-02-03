import { signOutUser } from '@/api/utils/supabase/auth-user.server';
import { redirect } from 'next/navigation';

export default async function SignOutPage() {
  await signOutUser();
  redirect('/');
}
