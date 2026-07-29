import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AllowPublicAccess } from '@tet/backend/users/decorators/allow-public-access.decorator';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import type { CookieOptions, Request, Response } from 'express';
import { LoginUserWithOidcProviderService } from './login-user-with-oidc-provider/login-user-with-oidc-provider.service';
import { CreateUserOidcIdentityService } from './create-user-oidc-identity/create-user-oidc-identity.service';
import { CreateSupabaseSessionService } from './create-supabase-session.service';
import {
  OIDC_COOKIES,
  OIDC_FLOW_COOKIES_TTL_MS,
  OIDC_ID_TOKEN_COOKIE_TTL_MS,
  OidcErrorCode,
} from './oidc.models';
import {
  getRequestCookies,
  getRootDomainFromUrl,
  sanitizeNextPath,
} from './oidc.utils';
import { OidcClientService } from './oidc-client.service';
import { OidcProviderRuntimeConfig } from './provider-configs/oidc-provider.config';
import { LinkOidcIdentityToUserService } from './link-oidc-identity-to-user/link-oidc-identity-to-user.service';
import { OidcSessionTicketService } from './oidc-session-ticket/oidc-session-ticket.service';
import { ConvertJwtToAuthUserService } from '../../convert-jwt-to-auth-user.service';
import { AuthRole } from '../../models/auth.models';
import { extractAccessTokenFromSupabaseCookie } from '@tet/backend/utils/supabase/supabase-cookie-parser';

/**
 * Endpoints REST publics du flux OIDC relying party
 * (pattern `apikeys.controller.ts`). `:provider` est validé contre les
 * providers configurés et activés — pour l'instant {'proconnect'} ;
 * `moncompteademe` répond 404 tant qu'il n'est pas branché.
 *
 * Toute erreur du flux aboutit à une redirection typée vers
 * `${APP_URL}/login?erreur=<code>` — jamais de 500 nue.
 */
@ApiExcludeController()
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller()
export class OidcController {
  private readonly logger = new Logger(OidcController.name);

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly oidcClientService: OidcClientService,
    private readonly authentifierOidcService: LoginUserWithOidcProviderService,
    private readonly creerSessionService: CreateSupabaseSessionService,
    private readonly ticketOidcService: OidcSessionTicketService,
    private readonly rattacherIdentiteService: LinkOidcIdentityToUserService,
    private readonly creerCompteOidcService: CreateUserOidcIdentityService,
    private readonly convertJwtToAuthUserService: ConvertJwtToAuthUserService
  ) {}

  @AllowPublicAccess()
  @Get(':provider/login')
  async login(
    @Param('provider') provider: string,
    @Query('next') next: string | undefined,
    @Query('mode') mode: string | undefined,
    @Query('intent') intent: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const providerConfig = this.getProviderConfigOrThrow(provider);

    try {
      const state = this.oidcClientService.randomState();
      const nonce = this.oidcClientService.randomNonce();

      const authorizationUrl =
        await this.oidcClientService.buildAuthorizationUrl(providerConfig, {
          state,
          nonce,
        });
      if (!authorizationUrl.success) {
        this.redirectLoginError(res, authorizationUrl.error);
        return;
      }

      const cookieOptions = this.flowCookieOptions(providerConfig);
      res.cookie(OIDC_COOKIES.state, state, cookieOptions);
      res.cookie(OIDC_COOKIES.nonce, nonce, cookieOptions);

      const nextPath = sanitizeNextPath(next);
      if (nextPath) {
        res.cookie(OIDC_COOKIES.next, nextPath, cookieOptions);
      }

      // Liaison volontaire depuis le profil : si une session classique
      // est active, on pose un simple DRAPEAU d'intention (pas l'id du compte).
      // Le compte cible sera re-résolu depuis la session au callback — jamais
      // depuis un cookie (anti-forge). Sans session valide, `mode=link` est
      // silencieusement ignoré : le parcours redevient une connexion normale.
      if (mode === 'link' && (await this.resolveAuthenticatedUserId(req))) {
        res.cookie(OIDC_COOKIES.linkMode, '1', cookieOptions);
      }

      // Parcours de création de compte : au retour, si aucun compte ne
      // correspond (cas 3), on crée directement au lieu de poser la question.
      if (intent === 'creation') {
        res.cookie(OIDC_COOKIES.signupIntent, '1', cookieOptions);
      }

      res.redirect(302, authorizationUrl.data.href);
    } catch (error) {
      this.logUnexpectedError('login', providerConfig.provider, error);
      this.redirectLoginError(res, 'oidc-erreur-interne');
    }
  }

  @AllowPublicAccess()
  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const providerConfig = this.getProviderConfigOrThrow(provider);

    const cookies = getRequestCookies(req);
    const nextPath = sanitizeNextPath(cookies.get(OIDC_COOKIES.next));

    // Les cookies du flux sont à usage unique : purgés quoi qu'il arrive.
    this.clearFlowCookies(res, providerConfig);

    try {
      const query = req.query as Record<string, string | undefined>;

      // Erreur renvoyée par le provider (ex : l'agent annule chez son FI).
      if (query.error) {
        this.logger.warn(
          `Erreur retournée par ${providerConfig.provider} au callback: ${query.error}`
        );
        this.redirectLoginError(
          res,
          query.error === 'access_denied'
            ? 'oidc-acces-refuse'
            : 'oidc-echec-token'
        );
        return;
      }

      const expectedState = cookies.get(OIDC_COOKIES.state);
      const expectedNonce = cookies.get(OIDC_COOKIES.nonce);
      if (
        !expectedState ||
        !expectedNonce ||
        !query.state ||
        query.state !== expectedState
      ) {
        this.logger.warn(
          `State ou nonce invalide au callback ${providerConfig.provider}`
        );
        this.redirectLoginError(res, 'oidc-state-invalide');
        return;
      }

      // Echange code→tokens IMMEDIATEMENT (code valable 30 s, access token
      // 60 s) : tout se joue dans ce handler.
      const currentUrl = new URL(providerConfig.redirectUri);
      currentUrl.search = new URL(req.originalUrl, 'http://placeholder').search;

      const exchange = await this.oidcClientService.exchangeCodeAndFetchClaims(
        providerConfig,
        currentUrl,
        { expectedState, expectedNonce }
      );
      if (!exchange.success) {
        this.redirectLoginError(res, exchange.error);
        return;
      }

      const { claims, idToken } = exchange.data;

      // id_token conservé en cookie httpOnly (domaine racine) pour le logout futur.
      res.cookie(OIDC_COOKIES.idToken, idToken, this.idTokenCookieOptions());
      // Provider de la session (cookie LISIBLE par l'app) : la déconnexion s'en
      // sert pour fermer la session SSO amont via /:provider/logout.
      res.cookie(
        OIDC_COOKIES.provider,
        providerConfig.provider,
        this.providerCookieOptions()
      );

      if (cookies.get(OIDC_COOKIES.linkMode)) {
        // Liaison volontaire depuis le profil. Le compte cible est
        // re-résolu depuis la session Supabase (jamais depuis un cookie
        // forgeable — anti prise de contrôle de compte). On rattache
        // directement : pas de matching cas 1/2/3, pas de nouvelle session à
        // ponter (celle déjà active reste la session finale).
        const profilUrl = new URL(
          '/profil',
          this.configurationService.get('APP_URL')
        );

        const linkUserId = await this.resolveAuthenticatedUserId(req);
        if (!linkUserId) {
          // Session perdue entre le clic « lier » et le retour du provider.
          profilUrl.searchParams.set('erreur-liaison', 'oidc-session-requise');
          res.redirect(303, profilUrl.href);
          return;
        }

        const rattachement =
          await this.rattacherIdentiteService.rattacherAvecGardeFous(
            providerConfig.provider,
            linkUserId,
            claims
          );

        if (!rattachement.success) {
          profilUrl.searchParams.set(
            'erreur-liaison',
            rattachement.error === 'IDENTITE_DEJA_LIEE_AILLEURS'
              ? 'oidc-identite-deja-liee-ailleurs'
              : 'oidc-compte-supprime'
          );
          res.redirect(303, profilUrl.href);
          return;
        }

        profilUrl.searchParams.set('comptes-associes', '1');
        res.redirect(303, profilUrl.href);
        return;
      }

      const authentification = await this.authentifierOidcService.authentifier(
        providerConfig.provider,
        claims
      );

      if (authentification.statut === 'non-reconnu') {
        // Parcours de création de compte : on sait déjà que l'utilisateur
        // voulait s'inscrire, on crée directement le compte sans passer par la
        // dialog de bienvenue « avez-vous déjà un compte ? ».
        if (cookies.get(OIDC_COOKIES.signupIntent)) {
          const creation = await this.creerCompteOidcService.creerCompte(
            providerConfig.provider,
            claims
          );
          if (!creation.success) {
            if (creation.error === 'EMAIL_NON_VERIFIE') {
              const bienvenueUrl = new URL(
                '/auth/proconnect',
                this.configurationService.get('APP_URL')
              );
              bienvenueUrl.searchParams.set('erreur', 'oidc-email-non-verifie');
              res.redirect(303, bienvenueUrl.href);
              return;
            }
            this.redirectLoginError(
              res,
              creation.error === 'CREATION_COMPTE_ERROR'
                ? 'oidc-echec-creation-compte'
                : 'oidc-echec-session'
            );
            return;
          }

          const verifyUrl = new URL(
            '/auth/verify',
            this.configurationService.get('APP_URL')
          );
          verifyUrl.searchParams.set('token_hash', creation.data.hashedToken);
          if (nextPath) {
            verifyUrl.searchParams.set('next', nextPath);
          }
          res.redirect(303, verifyUrl.href);
          return;
        }

        // Cas 3 : rien n'est créé tant que l'utilisateur n'a pas répondu
        // à la dialog de bienvenue — le contexte (claims vérifiés) voyage
        // dans un ticket signé, jamais renvoyé au navigateur en clair.
        const ticket = this.ticketOidcService.signer({
          provider: providerConfig.provider,
          claims,
        });
        const bienvenueUrl = new URL(
          '/auth/proconnect',
          this.configurationService.get('APP_URL')
        );
        bienvenueUrl.searchParams.set('ticket', ticket);
        if (nextPath) {
          bienvenueUrl.searchParams.set('next', nextPath);
        }
        res.redirect(303, bienvenueUrl.href);
        return;
      }

      if (authentification.statut === 'compte-desactive') {
        this.redirectLoginError(res, 'oidc-compte-desactive');
        return;
      }

      if (authentification.statut === 'email-non-verifie') {
        // Un compte existe pour cet email mais ProConnect ne le déclare pas
        // vérifié : rattachement automatique refusé (sécurité). On envoie vers
        // l'écran de bienvenue en mode alerte (pas de dialog, pas de ticket).
        const bienvenueUrl = new URL(
          '/auth/proconnect',
          this.configurationService.get('APP_URL')
        );
        bienvenueUrl.searchParams.set('erreur', 'oidc-email-non-verifie');
        res.redirect(303, bienvenueUrl.href);
        return;
      }

      const session = await this.creerSessionService.creerSession(
        authentification.email
      );
      if (!session.success) {
        this.redirectLoginError(res, 'oidc-echec-session');
        return;
      }

      const verifyUrl = new URL(
        '/auth/verify',
        this.configurationService.get('APP_URL')
      );
      verifyUrl.searchParams.set('token_hash', session.data.hashedToken);
      if (nextPath) {
        verifyUrl.searchParams.set('next', nextPath);
      }
      if (authentification.nouvelleLiaison) {
        // Indicateur one-shot : jamais stocké en session
        // permanente — l'app le lit une fois sur `/auth/verify` puis nettoie
        // l'URL pour déclencher le toast « comptes associés ».
        verifyUrl.searchParams.set('liaison', '1');
      }

      res.redirect(303, verifyUrl.href);
    } catch (error) {
      this.logUnexpectedError('callback', providerConfig.provider, error);
      this.redirectLoginError(res, 'oidc-erreur-interne');
    }
  }

  /**
   * Déconnexion côté provider.
   * Fail-safe : le cookie id_token est purgé immédiatement — un échec de
   * l'étape provider ne bloque jamais le retour à l'app.
   */
  @AllowPublicAccess()
  @Get(':provider/logout')
  async logout(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const providerConfig = this.getProviderConfigOrThrow(provider);
    const appUrl = this.configurationService.get('APP_URL');

    try {
      const cookies = getRequestCookies(req);
      const idToken = cookies.get(OIDC_COOKIES.idToken);

      res.clearCookie(OIDC_COOKIES.idToken, this.idTokenCookieOptions());
      res.clearCookie(OIDC_COOKIES.provider, this.providerCookieOptions());

      if (!idToken) {
        res.redirect(302, appUrl);
        return;
      }

      const state = this.oidcClientService.randomState();
      const endSessionUrl = await this.oidcClientService.buildEndSessionUrl(
        providerConfig,
        { idTokenHint: idToken, state }
      );

      if (!endSessionUrl) {
        res.redirect(302, appUrl);
        return;
      }

      res.cookie(
        OIDC_COOKIES.logoutState,
        state,
        this.flowCookieOptions(providerConfig)
      );
      res.redirect(302, endSessionUrl.href);
    } catch (error) {
      this.logUnexpectedError('logout', providerConfig.provider, error);
      res.redirect(302, appUrl);
    }
  }

  @AllowPublicAccess()
  @Get(':provider/logout/callback')
  async logoutCallback(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const providerConfig = this.getProviderConfigOrThrow(provider);
    const appUrl = this.configurationService.get('APP_URL');

    try {
      const cookies = getRequestCookies(req);
      const expectedState = cookies.get(OIDC_COOKIES.logoutState);
      const query = req.query as Record<string, string | undefined>;
      if (expectedState && query.state && query.state !== expectedState) {
        this.logger.warn(
          `State inattendu au retour de déconnexion ${providerConfig.provider}`
        );
      }
    } catch (error) {
      this.logUnexpectedError(
        'logout/callback',
        providerConfig.provider,
        error
      );
    }

    res.clearCookie(
      OIDC_COOKIES.logoutState,
      this.flowCookieOptions(providerConfig)
    );
    res.clearCookie(OIDC_COOKIES.idToken, this.idTokenCookieOptions());
    res.clearCookie(OIDC_COOKIES.provider, this.providerCookieOptions());
    res.redirect(302, appUrl);
  }

  /** 404 pour un provider inconnu, non configuré ou désactivé (endpoints inertes). */
  private getProviderConfigOrThrow(
    provider: string
  ): OidcProviderRuntimeConfig {
    const providerConfig = this.oidcClientService.getProviderConfig(provider);
    if (!providerConfig) {
      throw new NotFoundException();
    }
    return providerConfig;
  }

  private redirectLoginError(res: Response, code: OidcErrorCode): void {
    const appUrl = this.configurationService.get('APP_URL');
    res.redirect(303, `${appUrl}/login?erreur=${code}`);
  }

  /** Cookies du flux : httpOnly, Secure, SameSite=Lax, scoppés au host api, TTL 5 min. */
  private flowCookieOptions(
    providerConfig: OidcProviderRuntimeConfig
  ): CookieOptions {
    return {
      httpOnly: true,
      // `false` uniquement en dev local http (localhost) — la redirect URI
      // déclarée fait foi sur le schéma effectivement servi.
      secure: providerConfig.redirectUri.startsWith('https://'),
      sameSite: 'lax',
      path: '/',
      maxAge: OIDC_FLOW_COOKIES_TTL_MS,
    };
  }

  /** Cookie id_token : httpOnly, domaine racine (partagé app/api), 12 h. */
  private idTokenCookieOptions(): CookieOptions {
    const appUrl = this.configurationService.get('APP_URL');
    return {
      httpOnly: true,
      secure: appUrl.startsWith('https://'),
      sameSite: 'lax',
      path: '/',
      domain: getRootDomainFromUrl(appUrl),
      maxAge: OIDC_ID_TOKEN_COOKIE_TTL_MS,
    };
  }

  /**
   * Cookie du provider de session : mêmes portée/durée que l'id_token mais
   * LISIBLE par l'app (`httpOnly: false`) — la déconnexion côté app lit le nom
   * du provider pour rediriger vers `/:provider/logout`. Le nom du provider
   * n'est pas une donnée sensible.
   */
  private providerCookieOptions(): CookieOptions {
    return { ...this.idTokenCookieOptions(), httpOnly: false };
  }

  private clearFlowCookies(
    res: Response,
    providerConfig: OidcProviderRuntimeConfig
  ): void {
    const options = this.flowCookieOptions(providerConfig);
    res.clearCookie(OIDC_COOKIES.state, options);
    res.clearCookie(OIDC_COOKIES.nonce, options);
    res.clearCookie(OIDC_COOKIES.next, options);
    res.clearCookie(OIDC_COOKIES.linkMode, options);
    res.clearCookie(OIDC_COOKIES.signupIntent, options);
  }

  /**
   * Résout l'utilisateur authentifié de la requête courante via son cookie de
   * session Supabase (même mécanisme que le contexte tRPC), pour `mode=link`.
   * `null` si aucune session valide — le flux redevient une connexion
   * normale plutôt que d'échouer.
   */
  private async resolveAuthenticatedUserId(
    req: Request
  ): Promise<string | null> {
    const supabaseUrl = this.configurationService.get('SUPABASE_URL');
    const jwt = await extractAccessTokenFromSupabaseCookie(req, supabaseUrl);
    if (!jwt) {
      return null;
    }

    try {
      const user = await this.convertJwtToAuthUserService.convertJwtToAuthUser(
        jwt
      );
      return user.role === AuthRole.AUTHENTICATED ? user.id : null;
    } catch {
      return null;
    }
  }

  private logUnexpectedError(
    step: string,
    provider: string,
    error: unknown
  ): void {
    this.logger.error(
      `Erreur inattendue (${step}, provider ${provider}): ${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`
    );
  }
}
