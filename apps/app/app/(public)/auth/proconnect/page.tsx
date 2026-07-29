import { signInPath } from '@/app/app/paths';
import { LinkOidcIdentityWelcomeView } from '@/app/users/authentications/oidc/link-oidc-identity/link-oidc-identity.welcome.view';
import { sanitizeNextPath } from '@/app/users/authentications/sanitize-next-path';
import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{ ticket?: string; next?: string; erreur?: string }>;
};

/**
 * Écran de bienvenue ProConnect :
 * - cas 3 (aucune correspondance automatique) : reçoit le `ticket` posé par le
 *   backend au retour du callback OIDC ;
 * - cas 2 email non vérifié : le backend redirige ici avec
 *   `?erreur=oidc-email-non-verifie` (sans ticket) pour afficher une alerte.
 *
 * Sans ticket NI erreur connue, le backend n'aurait jamais dû rediriger ici :
 * on renvoie vers la connexion classique.
 */
export default async function Page({ searchParams }: PageProps) {
  const { ticket, next, erreur } = await searchParams;

  if (erreur === 'oidc-email-non-verifie') {
    return <LinkOidcIdentityWelcomeView erreur="email-non-verifie" />;
  }

  if (!ticket) {
    redirect(signInPath);
  }

  return <LinkOidcIdentityWelcomeView ticket={ticket} next={sanitizeNextPath(next)} />;
}
