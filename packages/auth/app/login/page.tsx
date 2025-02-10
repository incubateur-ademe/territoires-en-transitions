import { createClientWithOldCookie } from '@/api/utils/supabase/server-client';
import { redirect } from 'next/navigation';
import { LoginPageClient } from './page.client';

/**
 * Affiche la page d'authentification
 *
 * Après authentification, si les searchParams de l'url contiennent
 * `redirect_to`, l'utilisateur est redirigé sur la page voulue, et à défaut sur
 * l'app.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    view: string | null;
    email: string | null;
    otp: string | null;
    redirect_to: string;
  }>;
}) {
  const { view, email, otp, redirect_to } = await searchParams;

  // Log out to clear old auth cookie
  const signOut = async () => {
    'use server';
    const supabase = await createClientWithOldCookie();
    await supabase.auth.signOut({ scope: 'global' });

    redirect('/login');
  };

  const supabase = await createClientWithOldCookie();
  const { data: user } = await supabase.auth.getUser();

  if (user.user) {
    await signOut();
  }

  return (
    <LoginPageClient
      view={view}
      email={email}
      otp={otp}
      redirect_to={redirect_to}
    />
  );
}
