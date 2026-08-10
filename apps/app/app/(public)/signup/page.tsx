import { buildSignupWithOidcUrl } from '@/app/users/authentications/oidc/create-user-with-oidc/create-user-with-oidc.urls';
import { SignupPageClient } from '@/app/users/authentications/signup-user/signup.view';
import { trpcInServerFunction } from '@tet/api/utils/trpc/trpc-server-client';
import * as Sentry from '@sentry/nextjs';
import { redirect } from 'next/navigation';

/**
 * La création de compte se fait par le fournisseur d'identité : les vues du
 * formulaire email + mot de passe ne sont plus affichées, sauf dans les vues
 * déjà engagées (`view` renseignée) et en mode dégradé.
 *
 * `etape3` en particulier n'est PAS un départ d'inscription mais la complétion
 * de profil des sessions sans DCP (cf. `require-onboarded-user.server.ts`) :
 * la rediriger vers le fournisseur bouclerait indéfiniment.
 */
const isSignupEntryPoint = (view: string | null) =>
  view === null || view === 'etape1';

/**
 * Résout le fournisseur d'identité mis en avant. Renvoie `null` — création de
 * compte en mode dégradé — si aucun n'est configuré, ou si le backend est
 * injoignable (mieux vaut un formulaire que la page en erreur).
 */
async function getSignupOidcUrl(redirectTo: string): Promise<string | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    const { targetProvider } =
      await trpcInServerFunction.users.authentications.oidc.getStatus.query();

    if (!backendUrl || !targetProvider) {
      logDegradedSignup(
        `aucun fournisseur d'identité configuré (MON_COMPTE_ADEME_ENABLED / PRO_CONNECT_ENABLED)`
      );
      return null;
    }

    return buildSignupWithOidcUrl({
      backendUrl,
      provider: targetProvider,
      next: redirectTo,
    });
  } catch (error) {
    logDegradedSignup(
      `statut OIDC injoignable : ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}

/** Trace le repli sur le formulaire email + mot de passe (anomalie de config). */
function logDegradedSignup(cause: string) {
  const message = `Création de compte en mode dégradé (email + mot de passe) — ${cause}`;
  console.error(message);
  Sentry.captureMessage(message, 'warning');
}

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

  if (isSignupEntryPoint(view)) {
    const oidcUrl = await getSignupOidcUrl(redirect_to);
    if (oidcUrl) {
      redirect(oidcUrl);
    }
  }

  return (
    <SignupPageClient
      view={view}
      email={email}
      otp={otp}
      redirect_to={redirect_to}
    />
  );
}
