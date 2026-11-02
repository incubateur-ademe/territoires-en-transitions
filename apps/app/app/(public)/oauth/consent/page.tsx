import { OauthConsentView } from '@/app/users/authentications/oauth-consent/oauth-consent.view';

/**
 * Page de consentement du serveur OAuth 2.1 de Supabase Auth (chemin
 * d'autorisation configuré dans le dashboard Supabase). Supabase y redirige
 * avec `authorization_id` quand un client OAuth (connecteur MCP) demande
 * l'accès au nom de l'utilisateur.
 */
export default async function OauthConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>;
}) {
  const { authorization_id } = await searchParams;

  return <OauthConsentView authorizationId={authorization_id ?? null} />;
}
