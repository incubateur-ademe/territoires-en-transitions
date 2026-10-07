import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { OidcProvider } from '../oidc.models';
import { buildMoncompteademeConfig } from './moncompteademe.config';
import { buildProconnectConfig } from './proconnect.config';

/**
 * Méthode d'authentification du client au token endpoint. ProConnect impose
 * `client_secret_post` ; Keycloak (MonCompteAdeme) accepte les deux — voir la
 * config de chaque provider.
 */
export type OidcClientAuthMethod = 'client_secret_post' | 'client_secret_basic';

/**
 * Configuration d'exécution d'un provider OIDC — contrat commun,
 * provider-agnostique. Chaque provider fournit la sienne via
 * `provider-configs/<provider>.config.ts` (fonction `build<Provider>Config`),
 * agrégées par `buildOidcProviderConfig` ci-dessous.
 */
export type OidcProviderRuntimeConfig = {
  provider: OidcProvider;
  issuer: string;
  clientId: string;
  clientSecret: string;
  scopes: readonly string[];
  redirectUri: string;
  postLogoutRedirectUri?: string;
  /** Authentification client au token endpoint (défaut de fait : post). */
  clientAuthMethod: OidcClientAuthMethod;
  /**
   * Metadata client additionnelle passée à openid-client
   * (ex : `userinfo_signed_response_alg` pour ProConnect).
   */
  clientMetadata: Record<string, string>;
  /**
   * Mapping des claims bruts (userinfo + id_token) vers la forme attendue par
   * `oidcClaimsSchema`. Le retour est re-validé par zod — pas de confiance ici.
   */
  mapClaims: (raw: Record<string, unknown>) => Record<string, unknown>;
};

/**
 * Registre des providers OIDC : fabrique la config d'exécution du
 * provider demandé depuis la configuration d'environnement, ou retourne `null`
 * si le provider est inconnu, désactivé (flag) ou mal configuré — auquel cas
 * ses endpoints restent inertes. Chaque provider est indépendant : on
 * peut activer l'un sans l'autre.
 */
export function buildOidcProviderConfig(
  provider: OidcProvider,
  configurationService: ConfigurationService
): OidcProviderRuntimeConfig | null {
  switch (provider) {
    case 'proconnect':
      return buildProconnectConfig(configurationService);
    case 'moncompteademe':
      return buildMoncompteademeConfig(configurationService);
  }
}
