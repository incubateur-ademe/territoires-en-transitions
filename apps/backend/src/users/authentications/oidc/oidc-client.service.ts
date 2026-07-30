import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import * as oidc from 'openid-client';
import {
  OidcClaims,
  oidcClaimsSchema,
  OidcErrorCode,
  oidcProviders,
  OidcProvider,
} from './oidc.models';
import {
  buildOidcProviderConfig,
  OidcProviderRuntimeConfig,
} from './provider-configs/oidc-provider.config';

/**
 * Wrapper provider-agnostique autour d'openid-client v6 :
 * - discovery mise en cache par provider ;
 * - construction de l'authorization URL (state, nonce, scopes du provider) ;
 * - échange code → tokens (`authorizationCodeGrant`, valide id_token : signature
 *   JWKS, nonce, iss, aud) ;
 * - récupération du userinfo signé (`fetchUserInfo`, signature RS256 vérifiée
 *   via la metadata client `userinfo_signed_response_alg`) ;
 * - validation zod des claims.
 */
@Injectable()
export class OidcClientService {
  private readonly logger = new Logger(OidcClientService.name);

  private readonly discoveryCache = new Map<
    OidcProvider,
    Promise<oidc.Configuration>
  >();

  /**
   * Fetch injectable par les tests (sert un discovery document statique,
   * aucun appel réseau). Non utilisé en production.
   */
  customFetch?: oidc.CustomFetch;

  constructor(private readonly configurationService: ConfigurationService) {}

  /**
   * Config d'exécution du provider, ou `null` si le provider est inconnu,
   * désactivé ou mal configuré (endpoints inertes). Délègue au registre
   * `buildOidcProviderConfig` (un provider = un fichier `provider-configs/*.config.ts`).
   */
  getProviderConfig(provider: string): OidcProviderRuntimeConfig | null {
    if (!(oidcProviders as readonly string[]).includes(provider)) {
      return null;
    }
    return buildOidcProviderConfig(
      provider as OidcProvider,
      this.configurationService
    );
  }

  /**
   * Providers OIDC actifs (flag activé + configuration complète) — sert à
   * n'afficher, côté profil, que les boutons lier/délier pertinents.
   * ProConnect et MonCompteAdeme y apparaissent indépendamment selon leur
   * propre flag.
   */
  getEnabledProviders(): OidcProvider[] {
    return oidcProviders.filter(
      (provider) => this.getProviderConfig(provider) !== null
    );
  }

  randomState(): string {
    return oidc.randomState();
  }

  /** ≥ 32 caractères aléatoires (32 octets base64url). */
  randomNonce(): string {
    return oidc.randomNonce();
  }

  async buildAuthorizationUrl(
    providerConfig: OidcProviderRuntimeConfig,
    params: { state: string; nonce: string }
  ): Promise<Result<URL, Extract<OidcErrorCode, 'oidc-erreur-interne'>>> {
    try {
      const config = await this.getConfiguration(providerConfig);
      const url = oidc.buildAuthorizationUrl(config, {
        redirect_uri: providerConfig.redirectUri,
        scope: providerConfig.scopes.join(' '),
        state: params.state,
        nonce: params.nonce,
      });
      return success(url);
    } catch (error) {
      this.logger.error(
        `Echec de la construction de l'authorization URL ${
          providerConfig.provider
        }: ${error instanceof Error ? error.message : String(error)}`
      );
      return failure('oidc-erreur-interne', toError(error));
    }
  }

  /**
   * Echange le code d'autorisation contre les tokens puis récupère le userinfo
   * signé — le tout dans le même appel : le code est valable 30 s et l'access
   * token 60 s côté ProConnect.
   */
  async exchangeCodeAndFetchClaims(
    providerConfig: OidcProviderRuntimeConfig,
    currentUrl: URL,
    checks: { expectedState: string; expectedNonce: string }
  ): Promise<
    Result<
      { claims: OidcClaims; idToken: string },
      Extract<
        OidcErrorCode,
        | 'oidc-acces-refuse'
        | 'oidc-state-invalide'
        | 'oidc-echec-token'
        | 'oidc-echec-userinfo'
        | 'oidc-claims-invalides'
      >
    >
  > {
    let config: oidc.Configuration;
    try {
      config = await this.getConfiguration(providerConfig);
    } catch (error) {
      this.logger.error(
        `Echec de la discovery ${providerConfig.provider}: ${
          toError(error).message
        }`
      );
      return failure('oidc-echec-token', toError(error));
    }

    let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
    try {
      tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
        expectedState: checks.expectedState,
        expectedNonce: checks.expectedNonce,
      });
    } catch (error) {
      if (error instanceof oidc.AuthorizationResponseError) {
        // Le provider a répondu avec `error=...` (ex : access_denied).
        this.logger.warn(
          `Réponse d'erreur du provider ${providerConfig.provider}: ${error.error}`
        );
        return failure(
          error.error === 'access_denied'
            ? 'oidc-acces-refuse'
            : 'oidc-echec-token',
          error
        );
      }
      // Signature/nonce/iss/aud invalides, state inattendu, échec réseau…
      this.logger.error(
        `Echec de l'échange code→tokens ${providerConfig.provider}: ${
          toError(error).message
        }`
      );
      const message = toError(error).message.toLowerCase();
      return failure(
        message.includes('state') ? 'oidc-state-invalide' : 'oidc-echec-token',
        toError(error)
      );
    }

    const idTokenClaims = tokens.claims();
    const idToken = tokens.id_token;
    if (!idTokenClaims?.sub || !idToken) {
      this.logger.error(
        `Réponse token sans id_token exploitable (${providerConfig.provider})`
      );
      return failure('oidc-echec-token');
    }

    let userinfo: oidc.UserInfoResponse;
    try {
      // Vérifie la signature du userinfo (JWT RS256 via JWKS) car la metadata
      // client déclare `userinfo_signed_response_alg` — un userinfo non signé
      // ou signé avec la mauvaise clé est rejeté ici.
      userinfo = await oidc.fetchUserInfo(
        config,
        tokens.access_token,
        idTokenClaims.sub
      );
    } catch (error) {
      this.logger.error(
        `Echec de la récupération du userinfo ${providerConfig.provider}: ${
          toError(error).message
        }`
      );
      return failure('oidc-echec-userinfo', toError(error));
    }

    const parsedClaims = oidcClaimsSchema.safeParse(
      providerConfig.mapClaims({ ...idTokenClaims, ...userinfo })
    );
    if (!parsedClaims.success) {
      this.logger.error(
        `Claims invalides (${providerConfig.provider}): ${parsedClaims.error.message}`
      );
      return failure('oidc-claims-invalides');
    }

    return success({ claims: parsedClaims.data, idToken });
  }

  /**
   * URL de fin de session du provider (`{ISSUER}/session/end`), ou `null` si
   * le provider n'expose pas de `end_session_endpoint`.
   */
  async buildEndSessionUrl(
    providerConfig: OidcProviderRuntimeConfig,
    params: { idTokenHint: string; state: string }
  ): Promise<URL | null> {
    try {
      const config = await this.getConfiguration(providerConfig);
      if (!config.serverMetadata().end_session_endpoint) {
        return null;
      }
      return oidc.buildEndSessionUrl(config, {
        id_token_hint: params.idTokenHint,
        state: params.state,
        ...(providerConfig.postLogoutRedirectUri
          ? { post_logout_redirect_uri: providerConfig.postLogoutRedirectUri }
          : {}),
      });
    } catch (error) {
      this.logger.error(
        `Echec de la construction de l'URL de fin de session ${
          providerConfig.provider
        }: ${toError(error).message}`
      );
      return null;
    }
  }

  private getConfiguration(
    providerConfig: OidcProviderRuntimeConfig
  ): Promise<oidc.Configuration> {
    const cached = this.discoveryCache.get(providerConfig.provider);
    if (cached) {
      return cached;
    }

    const options: oidc.DiscoveryRequestOptions = {};
    if (this.customFetch) {
      options[oidc.customFetch] = this.customFetch;
    }
    if (providerConfig.issuer.startsWith('http://')) {
      const host = new URL(providerConfig.issuer).hostname;
      const estLoopback =
        host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (estLoopback) {
        // IdP LOCAL de dev uniquement : TLS désactivé pour la discovery.
        this.logger.warn(
          `OIDC ${providerConfig.provider} : issuer en http:// sur ${host} — TLS désactivé (autorisé uniquement en local).`
        );
        options.execute = [oidc.allowInsecureRequests];
      } else {
        // http:// sur un hôte distant = config erronée : on NE désactive PAS TLS
        // (le client_secret et les tokens ne doivent jamais transiter en clair).
        // La discovery échouera → fail-fast, comportement voulu.
        this.logger.error(
          `OIDC ${providerConfig.provider} : issuer en http:// sur un hôte distant (${host}) — refus de désactiver TLS, corrigez l'issuer en https://.`
        );
      }
    }

    // Méthode d'authentification client selon le provider (ProConnect impose
    // `client_secret_post`, Keycloak/MCA accepte les deux).
    const clientAuth =
      providerConfig.clientAuthMethod === 'client_secret_basic'
        ? oidc.ClientSecretBasic(providerConfig.clientSecret)
        : oidc.ClientSecretPost(providerConfig.clientSecret);

    const configurationPromise = oidc
      .discovery(
        new URL(providerConfig.issuer),
        providerConfig.clientId,
        {
          client_secret: providerConfig.clientSecret,
          ...providerConfig.clientMetadata,
        },
        clientAuth,
        options
      )
      .then((config) => {
        if (this.customFetch) {
          config[oidc.customFetch] = this.customFetch;
        }
        return config;
      });

    // Ne jamais mettre en cache un échec de discovery.
    configurationPromise.catch(() => {
      this.discoveryCache.delete(providerConfig.provider);
    });

    this.discoveryCache.set(providerConfig.provider, configurationPromise);
    return configurationPromise;
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
