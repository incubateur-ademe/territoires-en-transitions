import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import * as oidc from 'openid-client';
import request from 'supertest';
import { ConvertJwtToAuthUserService } from '../../convert-jwt-to-auth-user.service';
import { LoginUserWithOidcProviderService } from './login-user-with-oidc-provider/login-user-with-oidc-provider.service';
import { CreateUserOidcIdentityService } from './create-user-oidc-identity/create-user-oidc-identity.service';
import { CreateSupabaseSessionService } from './create-supabase-session.service';
import { OidcController } from './oidc.controller';
import { OidcClientService } from './oidc-client.service';
import { PROCONNECT_SCOPES } from './provider-configs/proconnect.config';
import { LinkOidcIdentityToUserService } from './link-oidc-identity-to-user/link-oidc-identity-to-user.service';
import { OidcSessionTicketService } from './oidc-session-ticket/oidc-session-ticket.service';
import { AuthRole } from '../../models/auth.models';
import { supabaseUrlToAuthCookieName } from '@tet/domain/utils';

const APP_URL = 'https://app.territoiresentransitions.fr';
const SUPABASE_URL = 'http://127.0.0.1:54321';
const ISSUER = 'https://fca.integ.example.gouv.fr/api/v2';
const REDIRECT_URI =
  'https://api.territoiresentransitions.fr/api/v1/proconnect/callback';
const POST_LOGOUT_REDIRECT_URI =
  'https://api.territoiresentransitions.fr/api/v1/proconnect/logout/callback';

const baseConfiguration: Record<string, unknown> = {
  APP_URL,
  SUPABASE_URL: 'http://127.0.0.1:54321',
  PRO_CONNECT_ENABLED: true,
  PRO_CONNECT_ISSUER: ISSUER,
  PRO_CONNECT_CLIENT_ID: 'test-client-id',
  PRO_CONNECT_CLIENT_SECRET: 'test-client-secret',
  PRO_CONNECT_REDIRECT_URI: REDIRECT_URI,
  PRO_CONNECT_POST_LOGOUT_REDIRECT_URI: POST_LOGOUT_REDIRECT_URI,
  OIDC_TICKET_SECRET: 'test-ticket-secret',
};

// Discovery document statique servi par un fetch de test : aucune requête
// réseau, mais le vrai code path openid-client (discovery + buildAuthorizationUrl).
const discoveryDocument = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/authorize`,
  token_endpoint: `${ISSUER}/token`,
  userinfo_endpoint: `${ISSUER}/userinfo`,
  jwks_uri: `${ISSUER}/jwks`,
  end_session_endpoint: `${ISSUER}/session/end`,
  response_types_supported: ['code'],
  scopes_supported: [...PROCONNECT_SCOPES],
  id_token_signing_alg_values_supported: ['RS256'],
  userinfo_signing_alg_values_supported: ['RS256'],
};

const fakeFetch: oidc.CustomFetch = async (url) => {
  if (String(url).includes('.well-known')) {
    return new Response(JSON.stringify(discoveryDocument), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  throw new Error(`Appel réseau inattendu dans les tests: ${url}`);
};

const creerSessionMock = {
  creerSession: vi.fn(),
};

const rattacherIdentiteMock = {
  rattacherAvecGardeFous: vi.fn(),
};

const creerCompteOidcMock = {
  creerCompte: vi.fn(),
};

const convertJwtToAuthUserMock = {
  convertJwtToAuthUser: vi.fn(),
};

async function createTestApp(
  configOverrides: Record<string, unknown> = {}
): Promise<INestApplication> {
  const configuration = { ...baseConfiguration, ...configOverrides };

  const moduleRef = await Test.createTestingModule({
    controllers: [OidcController],
    providers: [
      OidcClientService,
      LoginUserWithOidcProviderService,
      {
        provide: ConfigurationService,
        useValue: {
          get: (key: string) => configuration[key],
        },
      },
      { provide: CreateSupabaseSessionService, useValue: creerSessionMock },
      { provide: CreateUserOidcIdentityService, useValue: creerCompteOidcMock },
      // LoginUserWithOidcProviderService n'est jamais réellement exercé dans ces tests
      // (son `authentifier` est systématiquement mocké via vi.spyOn) — ses
      // dépendances DB n'ont donc besoin que d'exister pour l'injection Nest.
      { provide: DatabaseService, useValue: {} },
      {
        provide: LinkOidcIdentityToUserService,
        useValue: rattacherIdentiteMock,
      },
      {
        provide: ConvertJwtToAuthUserService,
        useValue: convertJwtToAuthUserMock,
      },
      JwtService,
      OidcSessionTicketService,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1', { exclude: ['version', 'throw'] });
  app.get(OidcClientService).customFetch = fakeFetch;
  await app.init();
  return app;
}

function getSetCookie(
  response: request.Response,
  name: string
): string | undefined {
  const cookies = (response.headers['set-cookie'] ?? []) as unknown as string[];
  return cookies.find((cookie) => cookie.startsWith(`${name}=`));
}

function getCookieValue(setCookie: string): string {
  return setCookie.split(';')[0].split('=').slice(1).join('=');
}

/**
 * Fabrique un cookie de session Supabase (@supabase/ssr) transportant
 * `access_token` — pilote la résolution de session côté callback (mode=link)
 * via le VRAI parseur `extractAccessTokenFromSupabaseCookie`, plutôt qu'un
 * mock de module fragile sous `isolate:false`. Le JWT lui-même reste opaque :
 * c'est `ConvertJwtToAuthUserService` (mocké par DI) qui le résout en compte.
 */
function supabaseAuthCookie(accessToken: string): string {
  const name = supabaseUrlToAuthCookieName(SUPABASE_URL);
  const value =
    'base64-' +
    Buffer.from(JSON.stringify({ access_token: accessToken }), 'utf8').toString(
      'base64url'
    );
  return `${name}=${value}`;
}

describe("Contrôleur OIDC (déclinaison ProConnect) — jamais d'erreur 500 nue (R13)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    vi.clearAllMocks();
    creerSessionMock.creerSession.mockResolvedValue(
      success({ hashedToken: 'hashed-token-du-spike' })
    );
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /:provider/login', () => {
    test("redirige vers l'authorization URL ProConnect avec state, nonce et scopes", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/login')
        .expect(302);

      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(`${ISSUER}/authorize`);
      expect(location.searchParams.get('client_id')).toBe('test-client-id');
      expect(location.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
      expect(location.searchParams.get('response_type')).toBe('code');
      expect(location.searchParams.get('scope')).toBe(
        'openid given_name usual_name email siret idp_id uid roles'
      );

      // state et nonce posés en cookies httpOnly et repris dans l'URL
      const stateCookie = getSetCookie(response, 'oidc-state');
      const nonceCookie = getSetCookie(response, 'oidc-nonce');
      expect(stateCookie).toBeDefined();
      expect(nonceCookie).toBeDefined();
      expect(stateCookie).toContain('HttpOnly');
      expect(stateCookie).toContain('SameSite=Lax');
      expect(stateCookie).toContain('Max-Age=300');
      expect(stateCookie).toContain('Secure');

      const state = getCookieValue(stateCookie as string);
      const nonce = getCookieValue(nonceCookie as string);
      expect(location.searchParams.get('state')).toBe(state);
      expect(location.searchParams.get('nonce')).toBe(nonce);
      // nonce ≥ 32 caractères aléatoires
      expect(nonce.length).toBeGreaterThanOrEqual(32);
    });

    test('conserve un next relatif en cookie et ignore un next absolu', async () => {
      const withNext = await request(app.getHttpServer())
        .get('/api/v1/proconnect/login?next=/plans/123')
        .expect(302);
      const nextCookie = getSetCookie(withNext, 'oidc-next');
      expect(nextCookie).toBeDefined();
      expect(getCookieValue(nextCookie as string)).toBe(
        encodeURIComponent('/plans/123')
      );

      const withAbsoluteNext = await request(app.getHttpServer())
        .get('/api/v1/proconnect/login?next=https://evil.example.com')
        .expect(302);
      expect(getSetCookie(withAbsoluteNext, 'oidc-next')).toBeUndefined();
    });
  });

  describe('GET /:provider/callback — comportements en erreur', () => {
    test('state altéré → redirection erreur typée, pas de 500', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=state-altere')
        .set('Cookie', ['oidc-state=state-attendu', 'oidc-nonce=nonce-attendu'])
        .expect(303);

      expect(response.headers.location).toBe(
        `${APP_URL}/login?erreur=oidc-state-invalide`
      );
    });

    test('cookie state absent → redirection erreur typée', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .expect(303);

      expect(response.headers.location).toBe(
        `${APP_URL}/login?erreur=oidc-state-invalide`
      );
    });

    test('error=access_denied du provider → code dédié', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?error=access_denied&state=un-state')
        .set('Cookie', ['oidc-state=un-state', 'oidc-nonce=un-nonce'])
        .expect(303);

      expect(response.headers.location).toBe(
        `${APP_URL}/login?erreur=oidc-acces-refuse`
      );
    });

    test("échec de l'échange code→tokens → redirection erreur typée", async () => {
      vi.spyOn(
        app.get(OidcClientService),
        'exchangeCodeAndFetchClaims'
      ).mockResolvedValue(failure('oidc-echec-token'));

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', ['oidc-state=un-state', 'oidc-nonce=un-nonce'])
        .expect(303);

      expect(response.headers.location).toBe(
        `${APP_URL}/login?erreur=oidc-echec-token`
      );
    });

    test('exception inattendue → redirection erreur interne, jamais de 500', async () => {
      vi.spyOn(
        app.get(OidcClientService),
        'exchangeCodeAndFetchClaims'
      ).mockRejectedValue(new Error('boom'));

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', ['oidc-state=un-state', 'oidc-nonce=un-nonce'])
        .expect(303);

      expect(response.headers.location).toBe(
        `${APP_URL}/login?erreur=oidc-erreur-interne`
      );
    });
  });

  describe('GET /:provider/callback — succès du protocole', () => {
    const claims = {
      sub: 'sub-proconnect-1',
      email: 'agent@collectivite.fr',
      given_name: 'Jeanne',
      usual_name: 'Dupont',
      siret: '21690123400011',
    };

    beforeEach(() => {
      vi.spyOn(
        app.get(OidcClientService),
        'exchangeCodeAndFetchClaims'
      ).mockResolvedValue(success({ claims, idToken: 'id-token-brut' }));
    });

    test('compte non reconnu (cas 3, aucun match) → redirection vers la dialog de bienvenue avec un ticket', async () => {
      vi.spyOn(
        app.get(LoginUserWithOidcProviderService),
        'authentifier'
      ).mockResolvedValue({ statut: 'non-reconnu' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', ['oidc-state=un-state', 'oidc-nonce=un-nonce'])
        .expect(303);

      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(
        `${APP_URL}/auth/proconnect`
      );
      const ticket = location.searchParams.get('ticket');
      expect(ticket).toBeTruthy();

      // le ticket porte les claims vérifiés, jamais renvoyés en clair
      const verifie = app
        .get(OidcSessionTicketService)
        .verifier(ticket as string);
      expect(verifie).toMatchObject({
        success: true,
        data: { provider: 'proconnect', claims },
      });

      // l'id_token est conservé en cookie httpOnly pour le logout futur
      const idTokenCookie = getSetCookie(response, 'oidc-id-token');
      expect(idTokenCookie).toBeDefined();
      expect(idTokenCookie).toContain('HttpOnly');
      expect(getCookieValue(idTokenCookie as string)).toBe('id-token-brut');
      expect(idTokenCookie).toContain('Domain=territoiresentransitions.fr');
    });

    test('compte non reconnu + intent=creation → crée directement le compte et ponte la session (pas de dialog)', async () => {
      vi.spyOn(
        app.get(LoginUserWithOidcProviderService),
        'authentifier'
      ).mockResolvedValue({ statut: 'non-reconnu' });
      creerCompteOidcMock.creerCompte.mockResolvedValue(
        success({ compteCree: true, hashedToken: 'hash-creation' })
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', [
          'oidc-state=un-state',
          'oidc-nonce=un-nonce',
          'oidc-signup-intent=1',
        ])
        .expect(303);

      expect(creerCompteOidcMock.creerCompte).toHaveBeenCalledWith(
        'proconnect',
        claims
      );

      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(
        `${APP_URL}/auth/verify`
      );
      expect(location.searchParams.get('token_hash')).toBe('hash-creation');
    });

    test('compte désactivé (dcp.limited, cas 2) → redirection erreur dédiée, pas de pont session', async () => {
      vi.spyOn(
        app.get(LoginUserWithOidcProviderService),
        'authentifier'
      ).mockResolvedValue({ statut: 'compte-desactive' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', ['oidc-state=un-state', 'oidc-nonce=un-nonce'])
        .expect(303);

      expect(response.headers.location).toBe(
        `${APP_URL}/login?erreur=oidc-compte-desactive`
      );
      expect(creerSessionMock.creerSession).not.toHaveBeenCalled();
    });

    test('email connu mais non vérifié par le provider (cas 2) → redirection bienvenue en mode alerte, aucun pont session ni ticket', async () => {
      vi.spyOn(
        app.get(LoginUserWithOidcProviderService),
        'authentifier'
      ).mockResolvedValue({ statut: 'email-non-verifie' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', ['oidc-state=un-state', 'oidc-nonce=un-nonce'])
        .expect(303);

      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(
        `${APP_URL}/auth/proconnect`
      );
      expect(location.searchParams.get('erreur')).toBe(
        'oidc-email-non-verifie'
      );
      // mode alerte, pas la dialog « déjà un compte ? » : aucun ticket émis.
      expect(location.searchParams.get('ticket')).toBeNull();
      expect(creerSessionMock.creerSession).not.toHaveBeenCalled();
    });

    test('statut connexion → pont session puis 303 vers /auth/verify avec token_hash et next', async () => {
      vi.spyOn(
        app.get(LoginUserWithOidcProviderService),
        'authentifier'
      ).mockResolvedValue({
        statut: 'connexion',
        userId: 'user-1',
        email: 'agent@collectivite.fr',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', [
          'oidc-state=un-state',
          'oidc-nonce=un-nonce',
          `oidc-next=${encodeURIComponent('/plans/123')}`,
        ])
        .expect(303);

      expect(creerSessionMock.creerSession).toHaveBeenCalledWith(
        'agent@collectivite.fr'
      );

      const location = new URL(response.headers.location);
      expect(location.origin).toBe(APP_URL);
      expect(location.pathname).toBe('/auth/verify');
      expect(location.searchParams.get('token_hash')).toBe(
        'hashed-token-du-spike'
      );
      expect(location.searchParams.get('next')).toBe('/plans/123');
      expect(location.searchParams.get('liaison')).toBeNull();

      // les cookies du flux sont purgés
      const purgedState = getSetCookie(response, 'oidc-state');
      const purgedNext = getSetCookie(response, 'oidc-next');
      expect(purgedState).toContain('Expires=Thu, 01 Jan 1970');
      expect(purgedNext).toContain('Expires=Thu, 01 Jan 1970');
    });

    test('statut connexion avec nouvelleLiaison (cas 2) → /auth/verify porte `liaison=1` (toast one-shot)', async () => {
      vi.spyOn(
        app.get(LoginUserWithOidcProviderService),
        'authentifier'
      ).mockResolvedValue({
        statut: 'connexion',
        userId: 'user-1',
        email: 'agent@collectivite.fr',
        nouvelleLiaison: true,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', ['oidc-state=un-state', 'oidc-nonce=un-nonce'])
        .expect(303);

      const location = new URL(response.headers.location);
      expect(location.searchParams.get('liaison')).toBe('1');
    });

    test('échec du pont session → redirection erreur typée', async () => {
      vi.spyOn(
        app.get(LoginUserWithOidcProviderService),
        'authentifier'
      ).mockResolvedValue({
        statut: 'connexion',
        userId: 'user-1',
        email: 'agent@collectivite.fr',
      });
      creerSessionMock.creerSession.mockResolvedValue(
        failure('GENERATE_LINK_ERROR')
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', ['oidc-state=un-state', 'oidc-nonce=un-nonce'])
        .expect(303);

      expect(response.headers.location).toBe(
        `${APP_URL}/login?erreur=oidc-echec-session`
      );
    });
  });

  describe('GET /:provider/logout et /:provider/logout/callback', () => {
    test("sans id_token en cookie → purge et redirection directe vers l'app", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/logout')
        .expect(302);

      expect(response.headers.location).toBe(APP_URL);
    });

    test('avec id_token en cookie → redirection session/end avec id_token_hint, state et post_logout_redirect_uri', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/logout')
        .set('Cookie', ['oidc-id-token=id-token-brut'])
        .expect(302);

      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(`${ISSUER}/session/end`);
      expect(location.searchParams.get('id_token_hint')).toBe('id-token-brut');
      expect(location.searchParams.get('post_logout_redirect_uri')).toBe(
        POST_LOGOUT_REDIRECT_URI
      );
      expect(location.searchParams.get('state')).toBeTruthy();

      // le cookie id_token est purgé immédiatement (fail-safe)
      const purgedIdToken = getSetCookie(response, 'oidc-id-token');
      expect(purgedIdToken).toContain('Expires=Thu, 01 Jan 1970');
    });

    test("logout/callback → purge des cookies et redirection vers l'app", async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/logout/callback')
        .set('Cookie', ['oidc-logout-state=un-state'])
        .expect(302);

      expect(response.headers.location).toBe(APP_URL);
      const purgedLogoutState = getSetCookie(response, 'oidc-logout-state');
      expect(purgedLogoutState).toContain('Expires=Thu, 01 Jan 1970');
    });
  });

  describe('Liaison volontaire depuis le profil (mode=link, U8)', () => {
    const claims = {
      sub: 'sub-link-1',
      email: 'agent@collectivite.fr',
      given_name: 'Jeanne',
      usual_name: 'Dupont',
    };

    beforeEach(() => {
      vi.spyOn(
        app.get(OidcClientService),
        'exchangeCodeAndFetchClaims'
      ).mockResolvedValue(success({ claims, idToken: 'id-token-brut' }));
    });

    test('login sans session valide (mode=link) → aucun cookie de liaison posé, flux normal', async () => {
      // aucun cookie sb-* → extractAccessTokenFromSupabaseCookie renvoie null
      // (valeur par défaut du mock) : pas de session, drapeau de liaison ignoré.
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/login?mode=link')
        .expect(302);

      expect(getSetCookie(response, 'oidc-link-mode')).toBeUndefined();
      expect(
        convertJwtToAuthUserMock.convertJwtToAuthUser
      ).not.toHaveBeenCalled();
    });

    test("login avec session valide (mode=link) → pose le drapeau oidc-link-mode='1'", async () => {
      convertJwtToAuthUserMock.convertJwtToAuthUser.mockResolvedValue({
        id: 'user-courant',
        role: AuthRole.AUTHENTICATED,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/login?mode=link')
        .set('Cookie', [supabaseAuthCookie('jwt-session-active')])
        .expect(302);

      const linkCookie = getSetCookie(response, 'oidc-link-mode');
      expect(linkCookie).toBeDefined();
      // simple drapeau d'intention : la valeur est '1', jamais un id de compte.
      expect(getCookieValue(linkCookie as string)).toBe('1');
      expect(linkCookie).toContain('HttpOnly');
    });

    test('callback avec drapeau de liaison → re-résout le compte depuis la session puis rattache directement, jamais de matching ni de nouvelle session', async () => {
      // session active : le compte cible vient de la session (cookie sb-*),
      // PAS du drapeau de liaison (simple '1', non forgeable en id de compte).
      convertJwtToAuthUserMock.convertJwtToAuthUser.mockResolvedValue({
        id: 'user-courant',
        role: AuthRole.AUTHENTICATED,
      });
      rattacherIdentiteMock.rattacherAvecGardeFous.mockResolvedValue(
        success({ email: claims.email })
      );
      const authentifier = vi.spyOn(
        app.get(LoginUserWithOidcProviderService),
        'authentifier'
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', [
          'oidc-state=un-state',
          'oidc-nonce=un-nonce',
          'oidc-link-mode=1',
          supabaseAuthCookie('jwt-session-active'),
        ])
        .expect(303);

      expect(rattacherIdentiteMock.rattacherAvecGardeFous).toHaveBeenCalledWith(
        'proconnect',
        'user-courant',
        claims
      );
      // jamais de matching cas 1/2/3, jamais de session pontée : le compte
      // est déjà connu, la session déjà active reste la session finale.
      expect(authentifier).not.toHaveBeenCalled();
      expect(creerSessionMock.creerSession).not.toHaveBeenCalled();

      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(`${APP_URL}/profil`);
      expect(location.searchParams.get('comptes-associes')).toBe('1');

      // le cookie de liaison est purgé comme les autres cookies de flux
      const purged = getSetCookie(response, 'oidc-link-mode');
      expect(purged).toContain('Expires=Thu, 01 Jan 1970');
    });

    test('callback avec drapeau de liaison mais session perdue → redirection profil avec oidc-session-requise, aucun rattachement', async () => {
      // session perdue entre le clic « lier » et le retour du provider :
      // aucun cookie sb-*, le parseur renvoie null → pas de compte à lier.
      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', [
          'oidc-state=un-state',
          'oidc-nonce=un-nonce',
          'oidc-link-mode=1',
        ])
        .expect(303);

      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(`${APP_URL}/profil`);
      expect(location.searchParams.get('erreur-liaison')).toBe(
        'oidc-session-requise'
      );
      expect(
        rattacherIdentiteMock.rattacherAvecGardeFous
      ).not.toHaveBeenCalled();
      expect(creerSessionMock.creerSession).not.toHaveBeenCalled();
    });

    test('callback avec drapeau de liaison, sub déjà lié ailleurs → redirection erreur vers le profil, aucune modification', async () => {
      convertJwtToAuthUserMock.convertJwtToAuthUser.mockResolvedValue({
        id: 'user-courant',
        role: AuthRole.AUTHENTICATED,
      });
      rattacherIdentiteMock.rattacherAvecGardeFous.mockResolvedValue(
        failure('IDENTITE_DEJA_LIEE_AILLEURS')
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/proconnect/callback?code=un-code&state=un-state')
        .set('Cookie', [
          'oidc-state=un-state',
          'oidc-nonce=un-nonce',
          'oidc-link-mode=1',
          supabaseAuthCookie('jwt-session-active'),
        ])
        .expect(303);

      const location = new URL(response.headers.location);
      expect(location.origin + location.pathname).toBe(`${APP_URL}/profil`);
      expect(location.searchParams.get('erreur-liaison')).toBe(
        'oidc-identite-deja-liee-ailleurs'
      );
      expect(creerSessionMock.creerSession).not.toHaveBeenCalled();
    });
  });

  describe('exposition des endpoints (AC8)', () => {
    test('provider non configuré (moncompteademe) → 404 sur tous les endpoints', async () => {
      const server = app.getHttpServer();
      await request(server).get('/api/v1/moncompteademe/login').expect(404);
      await request(server).get('/api/v1/moncompteademe/callback').expect(404);
      await request(server).get('/api/v1/moncompteademe/logout').expect(404);
      await request(server)
        .get('/api/v1/moncompteademe/logout/callback')
        .expect(404);
    });

    test('PRO_CONNECT_ENABLED=false → endpoints proconnect inertes (404)', async () => {
      const disabledApp = await createTestApp({ PRO_CONNECT_ENABLED: false });
      const server = disabledApp.getHttpServer();

      await request(server).get('/api/v1/proconnect/login').expect(404);
      await request(server)
        .get('/api/v1/proconnect/callback?code=x&state=y')
        .expect(404);
      await request(server).get('/api/v1/proconnect/logout').expect(404);
      await request(server)
        .get('/api/v1/proconnect/logout/callback')
        .expect(404);

      await disabledApp.close();
    });
  });
});
