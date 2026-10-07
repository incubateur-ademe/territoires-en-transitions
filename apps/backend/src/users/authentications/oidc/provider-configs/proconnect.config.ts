import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import type { OidcProviderRuntimeConfig } from './oidc-provider.config';

/**
 * Scopes ProConnect : chaque claim se demande comme un scope dédié.
 * Attention : ProConnect renvoie `usual_name` (nom d'usage), PAS `family_name`.
 */
export const PROCONNECT_SCOPES = [
  'openid',
  'given_name',
  'usual_name',
  'email',
  'siret',
  'idp_id',
  'uid',
  // Statut d'agent public (agent_public / agent_public_etat /
  // agent_public_territorial / vide), dans la config ProConnect de base.
  'roles',
] as const;

/**
 * Construit la config ProConnect depuis la configuration d'environnement.
 * Retourne `null` si le flag est désactivé ou si la config est incomplète :
 * les endpoints restent alors inertes.
 */
export function buildProconnectConfig(
  configurationService: ConfigurationService
): OidcProviderRuntimeConfig | null {
  if (!configurationService.get('PRO_CONNECT_ENABLED')) {
    return null;
  }

  const issuer = configurationService.get('PRO_CONNECT_ISSUER');
  const clientId = configurationService.get('PRO_CONNECT_CLIENT_ID');
  const clientSecret = configurationService.get('PRO_CONNECT_CLIENT_SECRET');
  const redirectUri = configurationService.get('PRO_CONNECT_REDIRECT_URI');

  if (!issuer || !clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    provider: 'proconnect',
    issuer,
    clientId,
    clientSecret,
    scopes: PROCONNECT_SCOPES,
    redirectUri,
    postLogoutRedirectUri: configurationService.get(
      'PRO_CONNECT_POST_LOGOUT_REDIRECT_URI'
    ),
    // ProConnect impose l'authentification client `client_secret_post`.
    clientAuthMethod: 'client_secret_post',
    clientMetadata: {
      // ProConnect renvoie un userinfo signé (JWT RS256) : openid-client
      // vérifie la signature via le JWKS quand cette metadata est déclarée.
      userinfo_signed_response_alg: 'RS256',
    },
    mapClaims: (raw) => ({
      sub: raw.sub,
      email: raw.email,
      // Absent/false → non vérifié (fail closed) : voir oidcClaimsSchema.
      email_verified: raw.email_verified,
      given_name: raw.given_name,
      // ProConnect : nom d'usage exposé sous `usual_name`, pas `family_name`.
      usual_name: raw.usual_name,
      uid: raw.uid,
      siret: raw.siret,
      idp_id: raw.idp_id,
      // Statut d'agent public (scope `roles`, config de base ProConnect).
      roles: raw.roles,
      // Nom lisible de l'organisation, fourni avec le siret (pas de scope
      // dédié à ajouter). Optionnel.
      organization_label: raw.organization_label,
    }),
  };
}
