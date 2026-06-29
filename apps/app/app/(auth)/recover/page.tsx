import { RecoverPageClient } from './page.client';

/**
 * Affiche la page de réinitialisation du mot de passe
 *
 * Lance directement le flux de réinitialisation via la vue `mdp_oublie`.
 * Après réinitialisation, si les searchParams contiennent `redirect_to`,
 * l'utilisateur est redirigé sur la page voulue, et à défaut sur l'app.
 */
export default async function RecoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    email: string | null;
    redirect_to: string;
  }>;
}) {
  const { email, redirect_to } = await searchParams;

  return <RecoverPageClient email={email} redirect_to={redirect_to} />;
}
