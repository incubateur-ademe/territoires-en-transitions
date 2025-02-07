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

  return (
    <LoginPageClient
      view={view}
      email={email}
      otp={otp}
      redirect_to={redirect_to}
    />
  );
}
