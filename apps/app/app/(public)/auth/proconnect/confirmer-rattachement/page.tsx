import { signInPath } from '@/app/app/paths';
import { LinkOidcIdentityConfirmInvitationView } from '@/app/users/authentications/oidc/link-oidc-identity/link-oidc-identity.confirm-invitation.view';
import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

/**
 * Écran atteint via le lien à usage unique reçu par email (fallback « mot de
 * passe oublié »). `token` est distinct du `ticket` du parcours principal.
 */
export default async function Page({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect(signInPath);
  }

  return <LinkOidcIdentityConfirmInvitationView token={token} />;
}
