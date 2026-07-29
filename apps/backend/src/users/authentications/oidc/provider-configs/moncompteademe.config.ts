import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import type { OidcProviderRuntimeConfig } from './oidc-provider.config';

/**
 * Scopes MonCompteAdeme (Keycloak, realm `integration`) : OIDC standard.
 * `profile` fournit `given_name`/`family_name`, `email` fournit `email` et
 * `email_verified` (Keycloak émet bien ce claim, contrairement à ProConnect).
 */
export const MON_COMPTE_ADEME_SCOPES = ['openid', 'email', 'profile'] as const;

/**
 * Construit la config MonCompteAdeme depuis la configuration d'environnement.
 * Retourne `null` si le flag est désactivé ou si la config est
 * incomplète : les endpoints /moncompteademe/* restent alors inertes.
 *
 * MonCompteAdeme est un Keycloak « classique » : contrairement à ProConnect,
 * pas de nom d'usage `usual_name` (on mappe depuis `family_name`), pas de
 * userinfo signé (JSON standard, donc pas de `userinfo_signed_response_alg`),
 * et pas de siret/idp_id/roles propres à l'écosystème agent public.
 */
export function buildMoncompteademeConfig(
  configurationService: ConfigurationService
): OidcProviderRuntimeConfig | null {
  if (!configurationService.get('MON_COMPTE_ADEME_ENABLED')) {
    return null;
  }

  const issuer = configurationService.get('MON_COMPTE_ADEME_ISSUER');
  const clientId = configurationService.get('MON_COMPTE_ADEME_CLIENT_ID');
  const clientSecret = configurationService.get(
    'MON_COMPTE_ADEME_CLIENT_SECRET'
  );
  const redirectUri = configurationService.get('MON_COMPTE_ADEME_REDIRECT_URI');

  if (!issuer || !clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    provider: 'moncompteademe',
    issuer,
    clientId,
    clientSecret,
    scopes: MON_COMPTE_ADEME_SCOPES,
    redirectUri,
    postLogoutRedirectUri: configurationService.get(
      'MON_COMPTE_ADEME_POST_LOGOUT_REDIRECT_URI'
    ),
    // Keycloak accepte `client_secret_post` (aussi listé dans son discovery).
    clientAuthMethod: 'client_secret_post',
    // Pas de userinfo signé côté Keycloak par défaut : JSON standard.
    clientMetadata: {},
    mapClaims: (raw) => ({
      sub: raw.sub,
      email: raw.email,
      // Keycloak émet `email_verified` (booléen) — respecté par isEmailVerified.
      email_verified: raw.email_verified,
      given_name: raw.given_name,
      // Pas de nom d'usage dédié côté Keycloak : on mappe `family_name` sur
      // `usual_name` (champ requis par oidcClaimsSchema, hérité du modèle
      // ProConnect). Repli sur `name` puis `preferred_username` pour ne pas
      // bloquer la connexion d'un compte MCA sans nom de famille renseigné.
      usual_name: raw.family_name ?? raw.name ?? raw.preferred_username,
      // siret / idp_id / roles / organization_label : absents chez MCA.
    }),
  };
}
