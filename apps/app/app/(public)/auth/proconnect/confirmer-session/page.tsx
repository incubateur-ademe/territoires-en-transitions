import { signInPath } from '@/app/app/paths';
import { LinkOidcIdentityConfirmSessionView } from '@/app/users/authentications/oidc/link-oidc-identity/link-oidc-identity.confirm-session.view';
import { sanitizeNextPath } from '@/app/users/authentications/sanitize-next-path';
import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{ ticket?: string; next?: string }>;
};

/**
 * Écran atteint juste après la reconnexion classique (cas « Oui ») : le
 * middleware d'`apps/auth` ramène ici via `redirect_to` une fois la session
 * classique posée. La vue cliente déclenche la liaison des identités au
 * montage.
 */
export default async function Page({ searchParams }: PageProps) {
  const { ticket, next } = await searchParams;

  if (!ticket) {
    redirect(signInPath);
  }

  return (
    <LinkOidcIdentityConfirmSessionView ticket={ticket} next={sanitizeNextPath(next)} />
  );
}
