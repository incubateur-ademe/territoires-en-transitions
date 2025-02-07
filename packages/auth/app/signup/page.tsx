import { SignupPageClient } from './page.client';

/**
 * Affiche la page de création de compte
 *
 * Après authentification, si les searchParams de l'url contiennent
 * `redirect_to`, l'utilisateur est redirigé sur la page voulue, et à défaut sur
 * l'app.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    view: string | null;
    email: string | null;
    otp: string | null;
    redirect_to: string;
  }>;
}) {
  const {
    view = null,
    email = null,
    otp = null,
    redirect_to = '/',
  } = await searchParams;

  return (
    <SignupPageClient
      view={view}
      email={email}
      otp={otp}
      redirect_to={redirect_to}
    />
  );
}
